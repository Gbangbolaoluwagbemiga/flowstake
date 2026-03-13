# FlowStake - UHI8 Hackathon Submission Summary

## Project Name
FlowStake

## Short Description (Elevator Pitch)
FlowStake is a Uniswap v4 Hook that serves as a yield-preserving intent registry for LSTs. It ensures users do not lose their staking yield while waiting for cross-chain intents to settle, utilizing the Reactive Network for trustless event-driven fulfillment.

## Technologies Used
- **Uniswap v4 Core**: Built custom `beforeSwap` and `afterSwap` logic tightly integrated with `PoolManager` to gate, hold, and snapshot LST yield.
- **Reactive Network (ReactVM)**: Subscribed to Unichain Sepolia. We deployed an autonomous Reactive Contract (`IReactive`) that listens for `IntentSubmitted` logs and reacts completely non-custodially without EOAs.
- **Foundry**: Comprehensive smart contract development, forge scripting, and live network deployments.
- **Next.js & Frontend**: A modern dark-mode DeFi dashboard using viem, wagmi, RainbowKit, and shadcn/ui to demonstrate real-time hook analytics and live event-streams.

## How we built it
1. **Core Hook (Unichain)**: We authored `FlowStakeHook.sol` to act as an interceptor. It uses a whitelist to ensure only real LSTs can be swapped. It calculates exact yield deltas using real on-chain Oracles (e.g., wstETH rate).
2. **Reactivity**: Instead of building a centralized server to watch for Unichain events and settle cross-chain, we deployed `FlowStakeReactive.sol` to the Lasna Testnet. The native System Subscription routes Unichain hook events directly into the RVM, allowing our contract to autonomously trigger the fulfillment callback.
3. **The UX Layer**: We built a high-performance Next.js dashboard that visualizes the "Yield Preserved" metric during the swap intent, making the "invisible" yield loss problem extremely visible to users.

## Links to Deployed Contracts
**Unichain Sepolia**:
- Hook address: `0xc5f0F8cb4086e635995BFA7Ef66c89b68f7F50C0`

**Reactive Lasna Testnet**:
- Reactive Contract: `0x7e7b5dbae3adb3d94a27dcfb383bdb98667145e6`
