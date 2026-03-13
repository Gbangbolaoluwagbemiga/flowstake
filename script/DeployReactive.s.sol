// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {FlowStakeReactive} from "../reactive/FlowStakeReactive.sol";

contract DeployReactive is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // Address of the FlowStakeHook deployed on Unichain
        address hookSource = 0xc5f0F8cb4086e635995BFA7Ef66c89b68f7F50C0;
        uint256 unichainId = 1301;
        
        // Placeholder for the destination contract on another rollup (e.g. Base)
        address hookDest = address(0);

        // Deploy the Reactive Contract onto the ReactVM (Kopli Testnet)
        FlowStakeReactive reactive = new FlowStakeReactive(hookSource, unichainId, hookDest);

        console.log("Authentic FlowStakeReactive deployed on ReactVM at:", address(reactive));

        vm.stopBroadcast();
    }
}
