# HashKey Chain & EVM DeFi Context

This document provides general DeFi context for EVM ecosystems and how Kairos sources data. It intentionally avoids chain-specific claims unless backed by tools.

---

## Lending & Borrowing (EVM patterns)

- **Money markets**: lend/borrow with collateral and liquidation thresholds
- **Interest rates**: commonly driven by utilization curves
- **Risks**: liquidation risk, oracle risk, smart contract risk

---

## AMMs & DEXs (EVM patterns)

- **AMMs**: x*y=k or concentrated liquidity variants
- **LP yield sources**: trading fees + incentives (if any)
- **DEX analytics**: volume/liquidity vary by chain and protocol

---

## How Kairos answers DeFi questions

- For **protocol TVL/fees/revenue**: use DeFiLlama tools
- For **DEX volumes**: use DeFiLlama DEX volume tools
- For **token prices**: use CoinGecko tools

---

## Yield comparisons

Avoid quoting specific APYs without tool output; yields move quickly and differ by chain, asset, and market conditions.

---

## Bridging

Use bridge tools for current bridge options and always remind users to verify official docs and contract addresses.

---

## Risks (general)

- Smart contract risk
- Oracle risk
- Liquidity risk
- Bridge risk
- Impermanent loss (for AMMs)
