// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/SpendingPolicy.sol";

contract Deploy is Script {
    function run() external returns (AgentRegistry registry, SpendingPolicy policy) {
        address admin = vm.envOr("KAIROS_ADMIN", msg.sender);

        vm.startBroadcast();
        registry = new AgentRegistry(admin);
        policy = new SpendingPolicy(admin);
        vm.stopBroadcast();

        console2.log("AgentRegistry:", address(registry));
        console2.log("SpendingPolicy:", address(policy));
    }
}

