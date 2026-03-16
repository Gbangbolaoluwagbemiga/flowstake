// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import {IReactive, ISubscriptionService} from "./IReactive.sol";

/**
 * @title FlowStakeReactive
 * @notice A Reactive Contract (RC) that trustlessly monitors Unichain Sepolia 
 * for FlowStake intent submissions and triggers cross-chain signaling.
 */
contract FlowStakeReactive is IReactive {
    address public service;
    uint256 public originChainId;
    address public hookAddress;

    event ReactionEmitted(bytes32 indexed log_id, address indexed hook);

    constructor(address _service, uint256 _originChainId, address _hookAddress) {
        service = _service;
        originChainId = _originChainId;
        hookAddress = _hookAddress;
    }

    /**
     * @notice This function is automatically triggered by the ReactVM when a 
     * matching event is detected on the origin chain.
     */
    function react(bytes32 log_id) external override {
        // In a production Reactive Network environment, this would execute 
        // a callback to the destination chain.
        emit ReactionEmitted(log_id, hookAddress);
    }
    
    function subscribeToHook(uint256 topic0) external {
        ISubscriptionService(service).subscribe(
            originChainId, 
            hookAddress, 
            topic0, 
            0, 0, 0
        );
    }
}
