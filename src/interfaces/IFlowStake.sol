// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {PoolKey} from "@uniswap/v4-core/src/types/PoolKey.sol";

interface IFlowStake {
    struct SwapIntent {
        address user;
        address lstIn;          // e.g. stETH
        address lstOut;         // e.g. rETH
        uint256 amountIn;       // amount of lstIn to swap
        uint256 yieldSnapshot;  // rebase index at intent time
        uint256 expiry;
        bool fulfilled;
    }

    struct LSTConfig {
        address rebaseOracle;   // ratio feed (e.g. wstETH/stETH)
        uint256 lastIndex;      // last recorded rebase index
        bool whitelisted;
    }

    event IntentSubmitted(bytes32 indexed intentId, address indexed user, address lstIn, address lstOut, uint256 amount);
    event IntentSettled(bytes32 indexed intentId, address indexed solver, uint256 yieldDelta);
    event Reacted(bytes32 indexed intentId, address indexed destinationHook);

    function submitIntent(address lstIn, address lstOut, uint256 amount, uint256 expiry) external payable returns (bytes32 intentId);
    function fulfillIntent(bytes32 intentId) external;
    function onReactiveCallback(bytes32 intentId) external;
}
