# Kairos — The Agentic Economy on X Layer (Testnet)

> **Multi-agent AI for crypto & DeFi with agentic wallets, on-chain settlement, and a repeatable “earn → pay → earn” loop. For hackathon mode, Kairos runs on X Layer testnet (chainId 1952) and produces judge-friendly explorer proofs.**

---

## What Kairos Does

Kairos is the **agent + money** layer for crypto copilots: specialists fetch real market structure (prices, headlines, TVL, yields, bridges, perps), an orchestrator keeps answers **grounded in tool output**, and **on-chain settlement** runs through **agentic wallets**. In hackathon mode, the onchain identity and activity are on **X Layer testnet (chainId 1952)**.

**Name note:** there is an unrelated project name “KairosLab” in the ecosystem. This repository is **not** a fork or affiliate of that project; it is our own hackathon build focused on X Layer + agentic wallets.

**Key differentiators:**
- ✅ **Native-token micropayments** — Treasury pays agent owners per specialist invocation (when settlement succeeds)
- ✅ **Agent-to-agent (A2A) commerce** — Agents pay each other for sub-tasks
- ✅ **On-chain registry** — Nine agents resolvable from `AgentRegistry` + env fallbacks
- ✅ **Auditable** — Explorer links for successful transfers; receipts API for late hashes
- ✅ **Deterministic routing + Groq** — Tool-first paths for reliability; optional live web index (Tavily / Brave) when API keys are set

**9 specialist agents:**

| Agent | ID | Capability |
|---|---|---|
| Price Oracle | `oracle` | Real-time prices, market cap, ATH via CoinGecko |
| News Scout | `news` | Crypto headlines (aggregated RSS) |
| Yield Optimizer | `yield` | DeFi yields across 500+ protocols |
| Tokenomics Analyzer | `tokenomics` | Supply, unlocks, inflation models |
| Chain Scout | `chain-scout` | X Layer testnet **chain pulse** + **Explain my wallet** (0x → snapshot, risks, next actions) + 0x account facts |
| Perp Stats | `perp` | Perpetual futures, funding rates, open interest |
| Protocol Stats | `protocol` | TVL, fees, revenue via DeFiLlama |
| Bridge Monitor | `bridges` | Cross-chain bridge volumes |
| DEX Volumes | `dex-volumes` | Top DEX volumes by chain (DeFiLlama) |

---

## Hackathon: Judge Quickstart (3–5 minutes)

1) **Set chain target to X Layer**
- Backend: `KAIROS_CHAIN_TARGET=xlayer`
- Frontend: `VITE_CHAIN_TARGET=xlayer`

2) **Verify contracts on explorer**
- Deploy: `xlayer-contracts/script/deploy-xlayer.sh`
- Verify: use the **OKX X Layer testnet explorer** “Verify and publish your smart contract” page (no OKLink API key required)

3) **Run the onchain activity loop**
- Call `POST /api/demo/run-cycles` (suggested: `cycles=50`, `fundAgents=true`)
- Result JSON includes **tx hashes + explorer links**

4) **Show Uniswap integration (mandatory module)**
- Call `GET /api/uniswap/v3/quote?tokenIn=...&tokenOut=...&fee=3000&amountIn=...`
- This directly queries Uniswap V3 Quoter (configurable via `UNISWAP_*` env vars)

## Proof Pack (paste before submitting)

- **X Layer testnet chain**: `chainId 1952`
- **AgentRegistry (verified ✅)**: `0x7e7b5dbaE3aDb3D94a27DCfB383bDB98667145E6` (verified in OKX explorer)
- **SpendingPolicy (verified ✅)**: `0x3f00dB811A4Ab36e7a953a9C9bC841499fC2EAF6` (verified in OKX explorer)
- **Agentic wallet identities table**: see below
- **5 representative txs** (different senders / types):
  - Funding (treasury → oracle): `https://www.okx.com/web3/explorer/xlayer-test/tx/0xa5bf07318f2f4c61892fb0ddbb138f219fcebeb18a149cd53a4edc481288a3e1`
  - Funding (treasury → news): `https://www.okx.com/web3/explorer/xlayer-test/tx/0x2b00a1ba18fa5bb3ff3b11b1aa0c09d5fd44a266ef13fa47e6c9434828ff6b2a`
  - A2A (oracle → yield): `https://www.okx.com/web3/explorer/xlayer-test/tx/0x14a301fbcb71b4fe7324e7086790bbe71921604271679c2e83cfb807ce6571cb`
  - A2A (perp → protocol): `https://www.okx.com/web3/explorer/xlayer-test/tx/0x4ff311dfa0f5bf135dddc4e92b1cba2b9816e05361969aa445da0193582b5f4a`
  - A2A (chain-scout → news): `https://www.okx.com/web3/explorer/xlayer-test/tx/0x047e4a5331b4f099081f11f3415d04ed9d6aa4fbf53bbf998a88bd4aed3f654c`

## Agentic Wallet Identity (onchain)

Create one orchestrator treasury wallet + 9 specialist wallets. For judge friendliness, paste explorer links here:

| Agent | Role | Address | Explorer |
|---|---|---|---|
| `treasury` | Orchestrator / payer | `<0x...>` | `<link>` |
| `oracle` | Price Oracle | `<0x...>` | `<link>` |
| `news` | News Scout | `<0x...>` | `<link>` |
| `yield` | Yield Optimizer | `<0x...>` | `<link>` |
| `tokenomics` | Tokenomics Analyzer | `<0x...>` | `<link>` |
| `perp` | Perp Stats | `<0x...>` | `<link>` |
| `chain-scout` | Chain Scout | `<0x...>` | `<link>` |
| `protocol` | Protocol Stats | `<0x...>` | `<link>` |
| `bridges` | Bridge Monitor | `<0x...>` | `<link>` |
| `dex-volumes` | DEX Volumes | `<0x...>` | `<link>` |

## Architecture

```
kairos-frontend/     React + Vite + TailwindCSS (deployed on Vercel/Railway)
kairos-backend/      Node.js + Express + TypeScript (deployed on Railway)
  src/
    load-env.ts           Loads `kairos-backend/.env` by path (works regardless of `process.cwd()`)
    index.ts              API routes, activity feed, treasury endpoints
    config.ts             All agent addresses, network config, pricing
    services/
      gemini.ts           AI orchestrator (Groq) — routing, synthesis, on-chain payments
      search.ts           Web research (Tavily / Brave when configured; honest Groq fallback)
      agent-registry-evm.ts EVM agent registry reader (on-chain + env fallback)
      evm-chain.ts        Active EVM chain config (hashkey vs xlayer)
      uniswap-v3.ts        Uniswap V3 quote (Quoter) integration
      price-oracle.ts     CoinGecko integration
      news-scout.ts       Crypto RSS headlines
      yield-optimizer.ts  DeFi yield aggregation
      tokenomics-service.ts Token supply & unlock data
      defillama.ts        DeFiLlama TVL/fees/bridges
      perp-stats/         Perpetuals data from 7+ exchanges
      hashkey-chain.ts     EVM RPC helpers (balance)
      hashkey-chain-pulse.ts Live block / gas / native-activity snapshot via chain RPC
      rag.ts              RAG corpus indexing + semantic search
      supabase.ts         Chat history, ratings, response time logs
      hashkey.ts          Treasury + A2A payments (EVM)
    routes/               (no x402 routes in HashKey build)
  db/
    schema.sql            Supabase table definitions (run once)
  scripts/
    generate-agent-evm-wallets.ts Derive 9 EVM agent wallets from treasury key
    simulate-agent-traffic.ts  Load-test agent payments
    list-models.ts             List available Gemini models
  rag-corpus/
    kairos-knowledge.md   Domain knowledge for RAG
    sources.urls          External URLs indexed at startup
xlayer-contracts/      Foundry: `AgentRegistry.sol`, `SpendingPolicy.sol`, `script/deploy-xlayer.sh`, `script/verify-deployed-xlayer.sh`
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- A funded EVM account (treasury) on your target chain
- MetaMask (or compatible EVM wallet)

### Backend

```bash
cd kairos-backend
cp .env.example .env   # fill in required values (or create kairos-backend/.env)
npm install
npm run dev
```

### Frontend

```bash
cd kairos-frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`, backend at `http://localhost:3001`.

### Chain pulse vs web search (important for demos)

- **Live blocks / gas / `tx.value` activity** come from **`getHashKeyPulse`** (chain RPC), not from web snippets.
- With **`KAIROS_GROQ_TOOL_CALLING=1`**, Groq may call **`searchWeb`** for a chain-style question; the backend **backfills `getHashKeyPulse`** when pulse JSON is still missing, **without re-running** search/news (avoids duplicate treasury pays).
- The **company “Oracle”** web-research shortcut does **not** run when the question is classified as a **chain pulse** (avoids unrelated `searchWeb` + news on RPC-style questions).
- Default **`KAIROS_FAST_MODE=1`** routes pulse + price deterministically first — safest for live demos.

---

## Environment Variables

### Backend (`kairos-backend/.env`)

The server loads **`kairos-backend/.env` by file path** (not only `process.cwd()`), so Brave/Tavily and other keys work even if you start the dev server from a parent folder. **Restart the backend** after editing `.env`.

**Required:**

| Variable | Description |
|---|---|
| `GROQ_API_KEY` | Groq API key (OpenAI-compatible) |
| `GROQ_MODEL` | Groq model id (default `llama-3.3-70b-versatile`) |
| `KAIROS_CHAIN_TARGET` | `xlayer` (hackathon) or `hashkey` (legacy) |
| `KAIROS_TREASURY_PRIVATE_KEY` | Treasury private key (0x...) (preferred, works for any chain target) |
| `XLAYER_RPC_URL` | X Layer RPC |
| `XLAYER_CHAIN_ID` | `195` |
| `XLAYER_EXPLORER_BASE` | e.g. `https://www.okx.com/explorer/xlayer/testnet` |
| `HASHKEY_RPC_URL` | HashKey RPC (legacy target) |
| `HASHKEY_CHAIN_ID` | `133` (legacy target) |
| `KAIROS_AGENT_REGISTRY_EVM_ADDRESS` | Deployed `AgentRegistry` address |
| `KAIROS_SPENDING_POLICY_EVM_ADDRESS` | Deployed `SpendingPolicy` address (optional) |
| `KAIROS_SPENDING_POLICY_STRICT` | `1` = block payout if `canSpend` reverts. Default `0` = still pay (direct treasury transfer) when the policy call reverts — fixes stuck “Confirming” when ABI/policy mismatches. |
| `KAIROS_TREASURY_TX_WAIT_CONFIRMS` | Default `1` — wait for that many confirmations after each treasury native transfer (and `recordSpend` when used) before the next payout. Prevents **replacement fee too low** when multiple agents are paid in one request. Set `0` to skip waits (faster, less safe). |
| `KAIROS_A2A_TX_WAIT_CONFIRMS` | Default `1` — same for agent→agent native-token transfers. |
| `KAIROS_TX_WAIT_TIMEOUT_MS` | Default `180000` — max time to wait for confirmations per transaction. |

**Server config:**

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | HTTP port |
| `ALLOWED_ORIGINS` | _(optional)_ | Comma-separated origins; only enforced when **`STRICT_CORS=1`**. Default CORS reflects any browser `Origin` (good for Vercel + Railway). |

**Agent addresses (EVM) (all 9 required):**

```
ORACLE_EVM_ADDRESS
NEWS_EVM_ADDRESS
YIELD_EVM_ADDRESS
TOKENOMICS_EVM_ADDRESS
PERP_EVM_ADDRESS
CHAIN_SCOUT_EVM_ADDRESS
PROTOCOL_EVM_ADDRESS
BRIDGES_EVM_ADDRESS
DEX_VOLUMES_EVM_ADDRESS
```

**Agent private keys (required for demo loop / A2A):**

```
ORACLE_EVM_PRIVATE_KEY
NEWS_EVM_PRIVATE_KEY
YIELD_EVM_PRIVATE_KEY
TOKENOMICS_EVM_PRIVATE_KEY
PERP_EVM_PRIVATE_KEY
CHAIN_SCOUT_EVM_PRIVATE_KEY
PROTOCOL_EVM_PRIVATE_KEY
BRIDGES_EVM_PRIVATE_KEY
DEX_VOLUMES_EVM_PRIVATE_KEY
```

**Uniswap (mandatory module):**

| Variable | Default | Description |
|---|---:|---|
| `UNISWAP_CHAIN_ID` | `1` | Chain used for quoting |
| `UNISWAP_RPC_URL` | `https://eth.llamarpc.com` | RPC for Uniswap quotes |
| `UNISWAP_V3_QUOTER_ADDRESS` | mainnet QuoterV2 | Quoter address |
| `UNISWAP_QUOTER_VERSION` | `v2` | `v2` or `v1` |

**Optional (app degrades gracefully):**

| Variable | Effect if missing |
|---|---|
| `COINGECKO_API_KEY` | Price oracle hits public rate limits |
| `TAVILY_API_KEY` | **Recommended in production:** `searchWeb` uses an offline Groq summary without it (or without `BRAVE_SEARCH_API_KEY`) |
| `BRAVE_SEARCH_API_KEY` | Alternative live web index for `searchWeb` |
| `KAIROS_WEB_SEARCH_PROVIDER` | `auto` (default, try Tavily then Brave), `tavily`, or `brave` |
| `SUPABASE_URL` + `SUPABASE_ANON_KEY` | No persistent chat history, ratings, or response time tracking |
| `KAIROS_AGENT_REGISTRY_EVM_ADDRESS` | Agent address resolution falls back to env map (payments still work) |
| `KAIROS_SPENDING_POLICY_EVM_ADDRESS` | Spending-policy enforcement for treasury payouts |
| `STRICT_CORS` | Set to `1` to allow only **`ALLOWED_ORIGINS`** plus `https://*.vercel.app`. If unset, CORS is **permissive** (reflects any `Origin`) — better for hackathon deploys; tighten for real production. |

index…` vs the one-line warning when keys are missing).

### Frontend (`kairos-frontend/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3001` | Backend URL |
| `VITE_ADMIN_ADDRESS` | _(empty)_ | Wallet address shown with Admin badge |
| `VITE_CHAIN_TARGET` | `hashkey` | `xlayer` for hackathon |
| `VITE_XLAYER_CHAIN_ID` | `195` | X Layer chainId |
| `VITE_XLAYER_EXPLORER_BASE` | `https://www.okx.com/explorer/xlayer/testnet` | Explorer base |
| `VITE_XLAYER_NATIVE_SYMBOL` | `OKB` | Native symbol label |
| `VITE_XLAYER_NETWORK_LABEL` | `X Layer Testnet` | Network label |

---

## Agent Wallet Setup

Kairos uses 9 autonomous **EVM agent wallets**. A helper script deterministically derives them from the treasury key and writes them into `kairos-backend/.env`.

```bash
cd kairos-backend

npx tsx scripts/generate-agent-evm-wallets.ts
```

The script outputs `.env` lines ready to paste. Keep `agent-wallets.json` secret — it contains private keys.

---

## Database Setup (Supabase)

Run `db/schema.sql` once in the Supabase SQL Editor. It creates:
- `chat_sessions` — per-wallet conversation threads
- `chat_messages` — full message history with tx hashes
- `message_ratings` — thumbs up/down per agent (drives ratings)
- `query_logs` — response times per agent (drives live stats)

---

## Deployment

### Backend → Railway

Set all environment variables from the table above in Railway's Variables tab, then connect the `kairos-backend/` directory. `railway.toml` and `Dockerfile` handle the rest.

### Frontend → Vercel / Railway

Set `VITE_API_URL` to your Railway backend URL. `vercel.json` includes SPA rewrite rules.

---

## Payment Architecture

Kairos implements two layers of on-chain payments — fully auditable EVM transactions.

### Layer 1: Treasury → Agent
Every user query triggers the treasury paying each specialist agent in the chain’s **native token**. The payment fires before the response is returned and the tx hash is embedded in the UI.

```
User query → Orchestrator → Agent A  →  0.01 USDC (treasury → oracle)
                          → Agent B  →  0.01 USDC (treasury → news)
```

### Layer 2: Agent → Agent (A2A Sub-payments)
When multiple agents collaborate on a query, the primary agent pays the sub-agents for their coordination. This is true autonomous agent commerce — agents earn AND spend on-chain.

```
Agent A (oracle) → Agent B (news)  →  0.005 USDC A2A payment
```

Both payment layers are visible in the chat UI as clickable badges linking to the active chain explorer.

**Payment path:** Treasury (native token) → Agent wallets (native token, X Layer testnet)
**A2A protocol:** Agents hold their own funded wallets and sign transactions autonomously.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI | Groq (OpenAI-compatible chat API) |
| Search grounding | Tavily / Brave (optional) |
| Blockchain | X Layer (hackathon) + EVM-compatible networks |
| Smart contracts | Agent Registry + Spending Policy (Foundry) |
| Payments | Native-token micropayments + A2A sub-payments |
| Prices | CoinGecko API |
| DeFi data | DeFiLlama API |
| Database | Supabase (PostgreSQL) |
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + TailwindCSS + shadcn/ui |
| Wallet | MetaMask (EVM wallet) |

---

## Smart Contracts (EVM)

Two contracts deployed on the target EVM chain (X Layer for hackathon):

### 1. Agent Registry

All 9 agents are registered on-chain via `AgentRegistry`.

The contract stores:
- Agent owner address (EVM 0x…)
- Service type (price, news, yield, etc.)
- Per-task price (in wei)
- Reputation score (updated on ratings)
- Tasks completed counter

Contract methods: `registerAgent`, `updateAgent`, `updateReputation`, `getAgent`, `listAgentKeys`

### 2. Spending Policy

Demonstrates **programmable spending constraints** for autonomous agents — a key capability for production agentic systems.

Features:
- Daily spending limits per agent (native token)
- Automatic daily reset
- Lifetime spend tracking
- Owner-controlled limit updates

Contract methods: `setDailyLimit`, `getStatus`, `remaining`, `canSpend`, `recordSpend`

---

## Agentic Payments (EVM)

Kairos implements:
- Machine-to-machine payments (A2A transfers)
- Pay-per-use resources (per-agent settlement per query)
- Autonomous wallets (9 agent EOAs)
- Programmable access + limits (registry + spending policy)

---


### Chat Interface
Users ask natural language questions. Agent badges show which specialists responded. Payment badges link directly to the X Layer explorer.

### Dashboard
Per-agent treasury balance, tasks completed, recent activity feed with on-chain receipts. A2A debits/credits displayed with direction indicators.

### Agent Marketplace
Browse all 9 agents, see ratings, response times, and pricing. Connect to view your agent's dashboard.

---

## Hackathon Submission Checklist (X Layer)

- [x] **Open-source repo** — Full source code with detailed README
- [x] **Video demo** — Shows agent queries, payments, A2A coordination
- [x] **X Layer interaction** — Real transactions on chainId 1952 (testnet demo loop)
- [ ] **Verified contracts** — `AgentRegistry` + `SpendingPolicy` verified on OKX X Layer explorer
- [x] **Agent-to-agent payments** — Primary agent pays sub-agents
- [x] **Agent wallets** — 9 independent EVM accounts
- [x] **On-chain registry** — EVM smart contract
- [x] **Rating/reputation** — Thumbs up/down updates agent ratings

---

## License

MIT
