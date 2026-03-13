// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {PoolManager} from "@uniswap/v4-core/src/PoolManager.sol";
import {IPoolManager} from "@uniswap/v4-core/src/interfaces/IPoolManager.sol";
import {FlowStakeHook} from "../src/FlowStakeHook.sol";
import {FlowStakeReactive} from "../reactive/FlowStakeReactive.sol";
import {HookMiner} from "@uniswap/v4-periphery/src/utils/HookMiner.sol";
import {Hooks} from "@uniswap/v4-core/src/libraries/Hooks.sol";

contract DeployFlowStake is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);

        // Grab the canonical address from environment
        IPoolManager manager = IPoolManager(vm.envAddress("POOL_MANAGER"));

        // Extract unichain ID assuming deployer runs this or configures it
        uint256 unichainId = 1301; // Unichain Sepolia Chain ID

        // Deploy Reactive
        FlowStakeReactive reactive = new FlowStakeReactive(address(0), unichainId, address(0));

        // Mine hook address with the correct flags
        // We need afterInitialize, beforeSwap, afterSwap
        // 0000000000000000000000000000000000000000000000000000000000... (calculate flags)
        uint160 flags = uint160(
            Hooks.AFTER_INITIALIZE_FLAG | 
            Hooks.BEFORE_SWAP_FLAG | 
            Hooks.AFTER_SWAP_FLAG
        );
        
        // Use hookMiner to mine a salt for the correct prefix
        // Since constructor takes (IPoolManager, address), we include it in creation code
        bytes memory creationCode = type(FlowStakeHook).creationCode;
        bytes memory constructorArgs = abi.encode(manager, address(reactive));
        
        address CREATE2_DEPLOYER = 0x4e59b44847b379578588920cA78FbF26c0B4956C;
        (address hookAddress, bytes32 salt) = HookMiner.find(
            CREATE2_DEPLOYER,
            flags,
            creationCode,
            constructorArgs
        );

        // Deploy using the salt
        FlowStakeHook hook = new FlowStakeHook{salt: salt}(manager, address(reactive));
        
        require(address(hook) == hookAddress, "Hook address mismatch");
        
        // Update Reactive Contract pointers
        // (Just mocking the setup for deployment illustration)
        
        console.log("PoolManager attached at:", address(manager));
        console.log("FlowStakeReactive deployed at:", address(reactive));
        console.log("FlowStakeHook deployed at:", address(hook));

        vm.stopBroadcast();
    }
}
