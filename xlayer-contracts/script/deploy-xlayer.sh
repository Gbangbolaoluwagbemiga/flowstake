#!/usr/bin/env bash
set -euo pipefail

# Deploy AgentRegistry + SpendingPolicy to X Layer testnet (chainId 1952).
#
# Required env:
# - XLAYER_RPC_URL
# - PRIVATE_KEY (deployer EOA)
#
# Optional env:
# - KAIROS_ADMIN (contract admin; default = deployer)
#
# Output:
# - prints deployed addresses to stdout (also written into broadcast artifacts)

if [[ -z "${XLAYER_RPC_URL:-}" ]]; then
  echo "Missing XLAYER_RPC_URL" >&2
  exit 1
fi
if [[ -z "${PRIVATE_KEY:-}" ]]; then
  echo "Missing PRIVATE_KEY (deployer)" >&2
  exit 1
fi

RPC_URL="$XLAYER_RPC_URL"
CHAIN_ID="${XLAYER_CHAIN_ID:-1952}"

echo "Deploying to X Layer (chainId=${CHAIN_ID}) via ${RPC_URL}"

# Ensure paths resolve regardless of caller CWD.
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

forge script "script/Deploy.s.sol:Deploy" \
  --rpc-url "$RPC_URL" \
  --chain-id "$CHAIN_ID" \
  --broadcast \
  --private-key "$PRIVATE_KEY"

