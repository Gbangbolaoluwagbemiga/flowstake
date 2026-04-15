// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Script.sol";
import "../src/AgentRegistry.sol";
import "../src/SpendingPolicy.sol";

contract RegisterAgents is Script {
    function run() external {
        address registryAddr = vm.envAddress("KAIROS_AGENT_REGISTRY");
        address policyAddr = vm.envOr("KAIROS_SPENDING_POLICY", address(0));

        AgentRegistry registry = AgentRegistry(registryAddr);
        SpendingPolicy policy = policyAddr == address(0) ? SpendingPolicy(address(0)) : SpendingPolicy(policyAddr);

        // Default per-task price (native HSK) in wei.
        uint256 priceWei = vm.envOr("KAIROS_DEFAULT_AGENT_PRICE_WEI", uint256(1e15)); // 0.001 HSK
        uint256 dailyLimitWei = vm.envOr("KAIROS_DEFAULT_DAILY_LIMIT_WEI", uint256(0));

        vm.startBroadcast();
        _reg(registry, "oracle", vm.envAddress("ORACLE_OWNER"), "Price Oracle", "price", priceWei);
        _reg(registry, "news", vm.envAddress("NEWS_OWNER"), "News Scout", "news", priceWei);
        _reg(registry, "yield", vm.envAddress("YIELD_OWNER"), "Yield Optimizer", "yield", priceWei);
        _reg(registry, "tokenomics", vm.envAddress("TOKENOMICS_OWNER"), "Tokenomics Analyzer", "tokenomics", priceWei);
        _reg(registry, "perp", vm.envAddress("PERP_OWNER"), "Perp Stats", "perp", priceWei);
        _reg(registry, "protocol", vm.envAddress("PROTOCOL_OWNER"), "Protocol Stats", "protocol", priceWei);
        _reg(registry, "bridges", vm.envAddress("BRIDGES_OWNER"), "Bridge Monitor", "bridges", priceWei);
        _reg(registry, "dex-volumes", vm.envAddress("DEX_VOLUMES_OWNER"), "DEX Volumes", "dex-volumes", priceWei);
        _reg(registry, "chain-scout", vm.envAddress("CHAIN_SCOUT_OWNER"), "Chain Scout", "chain-scout", priceWei);

        if (policyAddr != address(0) && dailyLimitWei > 0) {
            policy.setDailyLimit(keccak256(bytes("oracle")), dailyLimitWei);
        }
        vm.stopBroadcast();
    }

    function _reg(
        AgentRegistry registry,
        string memory key,
        address owner,
        string memory name,
        string memory serviceType,
        uint256 priceWei
    ) internal {
        bytes32 k = keccak256(bytes(key));
        // Try register; if exists, update.
        try registry.registerAgent(k, owner, name, serviceType, priceWei) {}
        catch {
            registry.updateAgent(k, owner, priceWei, true);
        }
    }
}

