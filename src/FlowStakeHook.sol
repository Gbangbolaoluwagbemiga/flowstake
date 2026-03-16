// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {BaseHook} from "@uniswap/v4-periphery/src/utils/BaseHook.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";
import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";
import {PoolId, PoolIdLibrary} from "@uniswap/v4-core/src/types/PoolId.sol";
import {BalanceDelta} from "@uniswap/v4-core/src/types/BalanceDelta.sol";
import {BeforeSwapDelta, BeforeSwapDeltaLibrary} from "@uniswap/v4-core/src/types/BeforeSwapDelta.sol";
import {Currency, CurrencyLibrary} from "@uniswap/v4-core/src/types/Currency.sol";
import {SwapParams} from "@uniswap/v4-core/src/types/PoolOperation.sol";

import {IFlowStake} from "./interfaces/IFlowStake.sol";
import {LSTLib} from "./libraries/LSTLib.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract FlowStakeHook is BaseHook, IFlowStake {
    using SafeERC20 for IERC20;
    using PoolIdLibrary for PoolKey;
    using CurrencyLibrary for Currency;

    // Intents mapping
    mapping(bytes32 => SwapIntent) public intents;
    uint256 public intentCounter;

    // LST Supported Configs
    mapping(address => LSTConfig) public lstConfigs;
    
    // Reactive Contract that can callback
    address public reactiveContract;

    modifier onlyReactive() {
        require(msg.sender == reactiveContract, "Only Reactive Configured");
        _;
    }

    constructor(IPoolManager _poolManager, address _reactiveContract) BaseHook(_poolManager) {
        reactiveContract = _reactiveContract;
    }

    /// @notice Whitelists an LST pair for use in the market
    function whitelistLST(address lstAddress, address oracle) external {
        // In prod, require owner/admin
        lstConfigs[lstAddress] = LSTConfig({
            rebaseOracle: oracle,
            lastIndex: LSTLib.fetchRebaseIndex(oracle),
            whitelisted: true
        });
    }

    /// @notice Require the permissions we need for this hook
    function getHookPermissions() public pure override returns (Hooks.Permissions memory) {
        return Hooks.Permissions({
            beforeInitialize: false,
            afterInitialize: true,
            beforeAddLiquidity: false,
            afterAddLiquidity: false,
            beforeRemoveLiquidity: false,
            afterRemoveLiquidity: false,
            beforeSwap: true,
            afterSwap: true,
            beforeDonate: false,
            afterDonate: false,
            beforeSwapReturnDelta: false,
            afterSwapReturnDelta: false,
            afterAddLiquidityReturnDelta: false,
            afterRemoveLiquidityReturnDelta: false
        });
    }

    /// @notice Initialize a new pool. We just snapshot the indices if an LST is recognized
    function afterInitialize(
        address sender,
        PoolKey calldata key,
        uint160 sqrtPriceX96,
        int24 tick
    ) external override returns (bytes4) {
        address currency0 = Currency.unwrap(key.currency0);
        address currency1 = Currency.unwrap(key.currency1);

        if (lstConfigs[currency0].whitelisted) {
            lstConfigs[currency0].lastIndex = LSTLib.fetchRebaseIndex(lstConfigs[currency0].rebaseOracle);
        }
        if (lstConfigs[currency1].whitelisted) {
            lstConfigs[currency1].lastIndex = LSTLib.fetchRebaseIndex(lstConfigs[currency1].rebaseOracle);
        }

        return FlowStakeHook.afterInitialize.selector;
    }

    /// @notice Gate check: ensure we're swapping whitelisted LSTs
    function beforeSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        bytes calldata hookData
    ) external override returns (bytes4, BeforeSwapDelta, uint24) {
        address currency0 = Currency.unwrap(key.currency0);
        address currency1 = Currency.unwrap(key.currency1);

        require(
            lstConfigs[currency0].whitelisted || lstConfigs[currency1].whitelisted,
            "Pool not an active LST pair"
        );

        return (FlowStakeHook.beforeSwap.selector, BeforeSwapDeltaLibrary.ZERO_DELTA, 0);
    }

    /// @notice Normal swap yields calculation and event distribution
    function afterSwap(
        address sender,
        PoolKey calldata key,
        SwapParams calldata params,
        BalanceDelta delta,
        bytes calldata hookData
    ) external override returns (bytes4, int128) {
        // NOTE: Here we could calculate standard yield deltas and distribute,
        // but since this is an intent market, normal pool swaps might just be internal AMM balancing.
        return (FlowStakeHook.afterSwap.selector, 0);
    }

    /// @notice User submits a cross-chain swap intent, depositing LST
    function submitIntent(address lstIn, address lstOut, uint256 amount, uint256 expiry) external payable override returns (bytes32 intentId) {
        require(lstConfigs[lstIn].whitelisted, "lstIn not whitelisted");
        // Pull token
        IERC20(lstIn).safeTransferFrom(msg.sender, address(this), amount);

        uint256 currentIdx = LSTLib.fetchRebaseIndex(lstConfigs[lstIn].rebaseOracle);
        intentId = keccak256(abi.encodePacked(msg.sender, lstIn, amount, intentCounter++, block.timestamp));

        intents[intentId] = SwapIntent({
            user: msg.sender,
            lstIn: lstIn,
            lstOut: lstOut,
            amountIn: amount,
            yieldSnapshot: currentIdx,
            expiry: block.timestamp + expiry,
            fulfilled: false
        });

        emit IntentSubmitted(intentId, msg.sender, lstIn, lstOut, amount);

        return intentId;
    }

    /// @notice The solver fulfills the intent directly on the destination chain (or via a router)
    /// @dev For the hackathon, we assume the solver proves fulfillment here or deposits the target token
    function fulfillIntent(bytes32 intentId) external override {
        SwapIntent storage intent = intents[intentId];
        require(!intent.fulfilled, "Already fulfilled");
        require(block.timestamp <= intent.expiry, "Intent expired");
        
        // Mark as fulfilled
        intent.fulfilled = true;

        // Yield calculation logic on the SOURCE chain token that was held
        uint256 currentIdx = LSTLib.fetchRebaseIndex(lstConfigs[intent.lstIn].rebaseOracle);
        uint256 yieldDelta = LSTLib.calculateYieldDelta(intent.amountIn, intent.yieldSnapshot, currentIdx);

        // Refund the user the yieldDelta (in lstIn tokens conceptually, since it accrued)
        if (yieldDelta > 0) {
            IERC20(intent.lstIn).safeTransfer(intent.user, yieldDelta);
        }

        // Transfer the base principal to the solver (who paid out on the destination chain)
        IERC20(intent.lstIn).safeTransfer(msg.sender, intent.amountIn);

        emit IntentSettled(intentId, msg.sender, yieldDelta);
    }

    /// @notice Entry point for the Reactive Network callback from the destination chain
    function onReactiveCallback(bytes32 intentId) external override onlyReactive {
        // Emits a reaction indicating the cross-chain settlement was triggered
        emit Reacted(intentId, address(this));
    }
}
