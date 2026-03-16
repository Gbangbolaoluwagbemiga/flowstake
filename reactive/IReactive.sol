// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IReactive {
    function react(bytes32 log_id) external;
}

interface ISubscriptionService {
    function subscribe(
        uint256 chain_id,
        address _address,
        uint256 topic_0,
        uint256 topic_1,
        uint256 topic_2,
        uint256 topic_3
    ) external;

    function unsubscribe(
        uint256 chain_id,
        address _address,
        uint256 topic_0,
        uint256 topic_1,
        uint256 topic_2,
        uint256 topic_3
    ) external;
}
