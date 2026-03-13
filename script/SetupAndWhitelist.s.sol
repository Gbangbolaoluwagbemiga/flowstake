// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

import "forge-std/Script.sol";
import {FlowStakeHook} from "../src/FlowStakeHook.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockWstETH is ERC20 {
    constructor() ERC20("Wrapped stETH", "wstETH") {
        _mint(msg.sender, 10000 ether);
    }
}

contract MockOracle {
    function stEthPerToken() external pure returns (uint256) {
        return 1.15 ether; // Mock 15% accrued yield over time
    }
}

contract SetupAndWhitelist is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy Mocks to Unichain Sepolia so you have test funds and a mock oracle
        MockWstETH wstEth = new MockWstETH();
        MockOracle oracle = new MockOracle();

        console.log("Mock wstETH deployed at:", address(wstEth));
        console.log("Mock Oracle deployed at:", address(oracle));

        // 2. Whitelist on the Hook
        address hookAddress = 0xc5f0F8cb4086e635995BFA7Ef66c89b68f7F50C0;
        FlowStakeHook hook = FlowStakeHook(hookAddress);

        hook.whitelistLST(address(wstEth), address(oracle));
        
        console.log("Successfully Whitelisted wstETH on FlowStake Hook!");

        vm.stopBroadcast();
    }
}
