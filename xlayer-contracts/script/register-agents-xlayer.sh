#!/usr/bin/env bash
set -euo pipefail

# Register / update the 9 Kairos agents in AgentRegistry on X Layer testnet.
#
# Required env:
# - XLAYER_RPC_URL
# - XLAYER_CHAIN_ID (default 1952)
# - PRIVATE_KEY (deployer/admin EOA that can call register/update)
# - KAIROS_AGENT_REGISTRY_EVM_ADDRESS
#
# Agent owner env (EVM addresses):
# - ORACLE_EVM_ADDRESS, NEWS_EVM_ADDRESS, YIELD_EVM_ADDRESS, TOKENOMICS_EVM_ADDRESS,
#   PERP_EVM_ADDRESS, CHAIN_SCOUT_EVM_ADDRESS, PROTOCOL_EVM_ADDRESS, BRIDGES_EVM_ADDRESS,
#   DEX_VOLUMES_EVM_ADDRESS
#
# Optional:
# - KAIROS_SPENDING_POLICY_EVM_ADDRESS
# - KAIROS_DEFAULT_AGENT_PRICE_WEI (default 1e15)

if [[ -z "${XLAYER_RPC_URL:-}" ]]; then
  echo "Missing XLAYER_RPC_URL" >&2
  exit 1
fi
CHAIN_ID="${XLAYER_CHAIN_ID:-1952}"

if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Missing PRIVATE_KEY (deployer/admin)" >&2
  exit 1
fi
if [[ -z "${KAIROS_AGENT_REGISTRY_EVM_ADDRESS:-}" ]]; then
  echo "Missing KAIROS_AGENT_REGISTRY_EVM_ADDRESS" >&2
  exit 1
fi

# Ensure paths resolve regardless of caller CWD.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

export KAIROS_AGENT_REGISTRY="$KAIROS_AGENT_REGISTRY_EVM_ADDRESS"
export KAIROS_SPENDING_POLICY="${KAIROS_SPENDING_POLICY_EVM_ADDRESS:-}"

export ORACLE_OWNER="${ORACLE_EVM_ADDRESS:?Missing ORACLE_EVM_ADDRESS}"
export NEWS_OWNER="${NEWS_EVM_ADDRESS:?Missing NEWS_EVM_ADDRESS}"
export YIELD_OWNER="${YIELD_EVM_ADDRESS:?Missing YIELD_EVM_ADDRESS}"
export TOKENOMICS_OWNER="${TOKENOMICS_EVM_ADDRESS:?Missing TOKENOMICS_EVM_ADDRESS}"
export PERP_OWNER="${PERP_EVM_ADDRESS:?Missing PERP_EVM_ADDRESS}"
export CHAIN_SCOUT_OWNER="${CHAIN_SCOUT_EVM_ADDRESS:?Missing CHAIN_SCOUT_EVM_ADDRESS}"
export PROTOCOL_OWNER="${PROTOCOL_EVM_ADDRESS:?Missing PROTOCOL_EVM_ADDRESS}"
export BRIDGES_OWNER="${BRIDGES_EVM_ADDRESS:?Missing BRIDGES_EVM_ADDRESS}"
export DEX_VOLUMES_OWNER="${DEX_VOLUMES_EVM_ADDRESS:?Missing DEX_VOLUMES_EVM_ADDRESS}"

echo "Registering agents on X Layer testnet (chainId=${CHAIN_ID})"
echo " - registry: ${KAIROS_AGENT_REGISTRY}"
echo " - rpc: ${XLAYER_RPC_URL}"

forge script "script/RegisterAgents.s.sol:RegisterAgents" \
  --rpc-url "$XLAYER_RPC_URL" \
  --chain-id "$CHAIN_ID" \
  --broadcast \
  --private-key "$PRIVATE_KEY"

