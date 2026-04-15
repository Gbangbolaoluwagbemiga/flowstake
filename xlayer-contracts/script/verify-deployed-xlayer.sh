#!/usr/bin/env bash
set -euo pipefail

# Verify deployed contracts on OKLink (Etherscan-compatible API).
#
# Required env:
# - OKLINK_API_KEY
#
# Required args:
# - AGENT_REGISTRY_ADDRESS
# - SPENDING_POLICY_ADDRESS
#
# Optional env:
# - CHAIN_ID (default: 1952)
# - XLAYER_VERIFIER_URL (override default OKLink endpoint)
#
# Notes:
# - Foundry verification requires the exact constructor args.
#   AgentRegistry(admin) and SpendingPolicy(admin) use admin = $KAIROS_ADMIN if set, else deployer.

if [[ $# -ne 2 ]]; then
  echo "Usage: $0 <AGENT_REGISTRY_ADDRESS> <SPENDING_POLICY_ADDRESS>" >&2
  exit 1
fi

REGISTRY_ADDR="$1"
POLICY_ADDR="$2"

if [[ -z "${XLAYER_VERIFIER_URL:-}" ]]; then
  # OKLink verify endpoints (docs)
  # Testnet: https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER_TESTNET
  XLAYER_VERIFIER_URL="https://www.oklink.com/api/v5/explorer/contract/verify-source-code-plugin/XLAYER_TESTNET"
fi
if [[ -z "${OKLINK_API_KEY:-}" ]]; then
  echo "Missing OKLINK_API_KEY" >&2
  exit 1
fi

CHAIN_ID="${CHAIN_ID:-1952}"

# Ensure paths resolve regardless of caller CWD.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# Constructor arg: admin address
if [[ -n "${KAIROS_ADMIN:-}" ]]; then
  ADMIN="$KAIROS_ADMIN"
else
  # Best effort: infer deployer from PRIVATE_KEY when available
  if [[ -n "${PRIVATE_KEY:-}" ]]; then
    ADMIN="$(cast wallet address --private-key "$PRIVATE_KEY")"
  else
    echo "Missing KAIROS_ADMIN or PRIVATE_KEY to derive constructor arg" >&2
    exit 1
  fi
fi

echo "Verifying on X Layer (chainId=${CHAIN_ID})"
echo " - verifier URL: ${XLAYER_VERIFIER_URL}"
echo " - admin: ${ADMIN}"

forge verify-contract \
  --chain-id "$CHAIN_ID" \
  --verifier-url "$XLAYER_VERIFIER_URL" \
  --verifier etherscan \
  --etherscan-api-key "$OKLINK_API_KEY" \
  "$REGISTRY_ADDR" \
  "src/AgentRegistry.sol:AgentRegistry" \
  --constructor-args "$(cast abi-encode 'constructor(address)' "$ADMIN")"

forge verify-contract \
  --chain-id "$CHAIN_ID" \
  --verifier-url "$XLAYER_VERIFIER_URL" \
  --verifier etherscan \
  --etherscan-api-key "$OKLINK_API_KEY" \
  "$POLICY_ADDR" \
  "src/SpendingPolicy.sol:SpendingPolicy" \
  --constructor-args "$(cast abi-encode 'constructor(address)' "$ADMIN")"

echo "Submitted verification requests."

