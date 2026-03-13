// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {ISubscriptionService} from "../reactive/IReactive.sol";

contract SubscribeReactive is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // System contract address on Lasna
        address SYSTEM_CONTRACT = 0x0000000000000000000000000000000000fffFfF;
        
        uint256 unichainId = 1301;
        address hookSource = 0xc5f0F8cb4086e635995BFA7Ef66c89b68f7F50C0;
        
        // Topic 0 for IntentSubmitted(bytes32,address,address,address,uint256)
        uint256 topic0 = uint256(keccak256("IntentSubmitted(bytes32,address,address,address,uint256)"));

        // Subscribe our Reactive Contract to these events
        // Note: The EOA must be the deployer of the specific ReactVM
        ISubscriptionService(SYSTEM_CONTRACT).subscribe(
            unichainId,
            hookSource,
            topic0,
            0,
            0,
            0
        );

        console.log("Subscription successful for Topic 0:", topic0);

        vm.stopBroadcast();
    }
}
