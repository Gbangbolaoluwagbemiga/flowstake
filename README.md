# Kairos — HashKey Agentic Marketplace

> **Multi-agent AI for crypto & DeFi on HashKey Chain (EVM): routed specialists, tool-grounded answers, and native HSK settlement — with optional on-chain spending policy.**

---

## What Kairos Does

Kairos is the **agent + money** layer for crypto copilots: specialists fetch real market structure (prices, headlines, TVL, yields, bridges, perps), an orchestrator keeps answers **grounded in tool output**, and **treasury → agent** flows use **native HSK** on HashKey testnet—with **agent-to-agent (A2A)** demos when multiple specialists coordinate.

**Key differentiators:**
- ✅ **Native HSK micropayments** — Treasury pays agent owners per specialist invocation (when settlement succeeds)
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
| Chain Scout | `chain-scout` | HashKey testnet **chain pulse** + **Explain my wallet** (0x → snapshot, risks, next actions) + 0x account facts |
| Perp Stats | `perp` | Perpetual futures, funding rates, open interest |
| Protocol Stats | `protocol` | TVL, fees, revenue via DeFiLlama |
| Bridge Monitor | `bridges` | Cross-chain bridge volumes |
| DEX Volumes | `dex-volumes` | Top DEX volumes by chain (DeFiLlama) |

---

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
      price-oracle.ts     CoinGecko integration
      news-scout.ts       Crypto RSS headlines
      yield-optimizer.ts  DeFi yield aggregation
      tokenomics-service.ts Token supply & unlock data
      defillama.ts        DeFiLlama TVL/fees/bridges
      perp-stats/         Perpetuals data from 7+ exchanges
      hashkey-chain.ts     HashKey RPC helpers (balance)
      hashkey-chain-pulse.ts Live block / gas / native-activity snapshot via HASHKEY_RPC_URL
      rag.ts              RAG corpus indexing + semantic search
      supabase.ts         Chat history, ratings, response time logs
      hashkey.ts          HashKey treasury + A2A payments
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
hashkey-contracts/      Foundry: `AgentRegistry.sol`, `SpendingPolicy.sol`, `script/verify-deployed.sh`
```

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- A funded HashKey testnet account (treasury)
- MetaMask (or compatible EVM wallet)

### Backend

```bash
cd kairos-backend
cp .env.example .env   # fill in required values
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

- **Live blocks / gas / `tx.value` activity** come from **`getHashKeyPulse`** (HashKey RPC), not from Brave/snippets.
- With **`KAIROS_GROQ_TOOL_CALLING=1`**, Groq may call **`searchWeb`** for a chain-style question; the backend **backfills `getHashKeyPulse`** when pulse JSON is still missing, **without re-running** search/news (avoids duplicate treasury pays).
- The **company “Oracle”** web-research shortcut does **not** run when the question is classified as a **HashKey chain pulse** (avoids unrelated `searchWeb` + news on RPC-style questions).
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
| `HASHKEY_TREASURY_PRIVATE_KEY` | Treasury private key (0x...) |
| `HASHKEY_RPC_URL` | HashKey testnet RPC (default `https://testnet.hsk.xyz`) |
| `HASHKEY_CHAIN_ID` | `133` |
| `KAIROS_AGENT_REGISTRY_EVM_ADDRESS` | Deployed `AgentRegistry` address |
| `KAIROS_SPENDING_POLICY_EVM_ADDRESS` | Deployed `SpendingPolicy` address (optional) |
| `KAIROS_SPENDING_POLICY_STRICT` | `1` = block payout if `canSpend` reverts. Default `0` = still pay (direct treasury transfer) when the policy call reverts — fixes stuck “Confirming” when ABI/policy mismatches. |
| `KAIROS_TREASURY_TX_WAIT_CONFIRMS` | Default `1` — wait for that many confirmations after each treasury native transfer (and `recordSpend` when used) before the next payout. Prevents **replacement fee too low** when multiple agents are paid in one request. Set `0` to skip waits (faster, less safe). |
| `KAIROS_A2A_TX_WAIT_CONFIRMS` | Default `1` — same for agent→agent HSK transfers. |
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

Kairos implements two layers of on-chain payments — both are real HashKey (EVM) transactions, fully auditable.

### Layer 1: Treasury → Agent
Every user query triggers the treasury paying each specialist agent in native **HSK**. The payment fires before the response is returned and the tx hash is embedded in the UI.

```
User query → Orchestrator → Agent A  →  0.01 USDC (treasury → oracle)
                          → Agent B  →  0.01 USDC (treasury → news)
```

### Layer 2: Agent → Agent (A2A Sub-payments)
When multiple agents collaborate on a query, the primary agent pays the sub-agents for their coordination. This is true autonomous agent commerce — agents earn AND spend on-chain.

```
Agent A (oracle) → Agent B (news)  →  0.005 USDC A2A payment
```

Both payment layers are visible in the chat UI as clickable badges linking to HashKey Explorer.

**Payment path:** Treasury (HSK) → Agent wallets (HSK, HashKey testnet)  
**A2A protocol:** Agents hold their own funded wallets and sign transactions autonomously.

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI | Gemini 2.5 Flash (Google) |
| Search grounding | Gemini Google Search (built-in) |
| Blockchain | HashKey Chain (EVM) |
| Smart contracts | Agent Registry + Spending Policy (Foundry) |
| Payments | Native HSK micropayments + A2A sub-payments |
| Prices | CoinGecko API |
| DeFi data | DeFiLlama API |
| Database | Supabase (PostgreSQL) |
| Backend | Node.js + Express + TypeScript |
| Frontend | React + Vite + TailwindCSS + shadcn/ui |
| Wallet | MetaMask (EVM wallet) |

---

## Smart Contracts (EVM)

Two contracts deployed to HashKey testnet:

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
- Daily spending limits per agent (native HSK)
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
Users ask natural language questions. Agent badges show which specialists responded. Payment badges link directly to HashKey Explorer.

### Dashboard
Per-agent treasury balance, tasks completed, recent activity feed with on-chain receipts. A2A debits/credits displayed with direction indicators.

### Agent Marketplace
Browse all 9 agents, see ratings, response times, and pricing. Connect to view your agent's dashboard.

---

## Hackathon Submission Checklist

- [x] **Open-source repo** — Full source code with detailed README
- [x] **Video demo** — Shows agent queries, payments, A2A coordination
- [x] **HashKey testnet interaction** — Real HSK payments + EVM contracts
- [ ] **Verified contracts** — `AgentRegistry` + `SpendingPolicy` green-checked on [testnet explorer](https://testnet-explorer.hsk.xyz)
- [x] **Agent-to-agent payments** — Primary agent pays sub-agents
- [x] **Agent wallets** — 9 independent EVM accounts
- [x] **On-chain registry** — EVM smart contract
- [x] **Rating/reputation** — Thumbs up/down updates agent ratings

---

## License

MIT
