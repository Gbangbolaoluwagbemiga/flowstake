// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/SpendingPolicy.sol";

contract SpendingPolicyTest is Test {
    SpendingPolicy policy;

    function setUp() external {
        policy = new SpendingPolicy(address(this));
    }

    function testDailyLimitAndRecord() external {
        bytes32 key = keccak256("oracle");
        policy.setDailyLimit(key, 10 ether);
        assertEq(policy.remaining(key), 10 ether);

        policy.recordSpend(key, 3 ether);
        assertEq(policy.remaining(key), 7 ether);
    }
}

