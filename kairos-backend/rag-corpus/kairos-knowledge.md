# Kairos — Product & Architecture Reference

This document is indexed for retrieval-augmented answers about Kairos, HashKey Chain, on-chain agent payments, and the agentic ecosystem.

---

## What Kairos Is

Kairos is an **AI agent marketplace** built on **HashKey Chain (EVM)**. Users chat with an AI orchestrator (Groq) that routes queries to specialist agents. Each agent call triggers a **real on-chain HSK payment** — agents earn for their work, pay sub-agents for coordination, and build on-chain reputation.

### Key Differentiators
- **Native HSK micropayments** — Each agent call settles on-chain
- **Agent-to-agent (A2A) commerce** — Agents pay each other for sub-tasks
- **On-chain registry** — 9 agents registered on an EVM smart contract
- **Auditable** — All payments visible on HashKey Explorer with clickable tx hashes
- **Multi-agent orchestration** — Gemini routes queries to specialist agents

---

## The 9 Specialist Agents

| Agent | ID | Capability | Price |
|-------|-----|------------|-------|
| Price Oracle | `oracle` | Real-time crypto prices via CoinGecko | (on-chain) |
| News Scout | `news` | Crypto headlines (RSS) | (on-chain) |
| Yield Optimizer | `yield` | DeFi yields from Lido, Aave, Curve, Beefy | 0.01 USDC |
| Tokenomics Analyzer | `tokenomics` | Supply, unlocks, inflation models | 0.01 USDC |
| Chain Scout | `stellar-scout` | HashKey/EVM account facts (balance, nonce, contract detection) | (on-chain) |
| Perp Stats | `perp` | Perpetual futures, funding rates, OI | 0.01 USDC |
| Protocol Stats | `protocol` | TVL, fees, revenue via DeFiLlama | 0.01 USDC |
| Bridge Monitor | `bridges` | Cross-chain bridge volumes | 0.01 USDC |
| DEX Volumes | `stellar-dex` | DEX volume overview via DeFiLlama | (on-chain) |

---

## Payment Architecture

### Layer 1: Treasury → Agent
Every user query triggers the treasury paying each specialist agent in native HSK. The payment fires before the response is returned and the tx hash is embedded in the UI.

```
User query → Orchestrator → Agent A  →  HSK (treasury → oracle)
                          → Agent B  →  HSK (treasury → news)
```

### Layer 2: Agent → Agent (A2A Sub-payments)
When multiple agents collaborate, the primary agent pays sub-agents for coordination. This is true autonomous agent commerce — agents earn AND spend on-chain.

```
Agent A (oracle) → Agent B (news)  →  HSK A2A payment
```

### Payment Truth (Do Not Invent Amounts)
- If asked about exact prices, point to the on-chain registry pricing (wei) or app configuration.
- Do not invent payment amounts as “live facts” without tool data.

---

## Smart Contracts (EVM)

### Agent Registry

Stores agent metadata on-chain:
- Owner address (EVM 0x…)
- Service type (price, news, yield, etc.)
- Per-task price (in wei)
- Reputation score
- Tasks completed counter

### Spending Policy

Programmable spending constraints:
- Daily spending limits per agent
- Automatic daily reset
- Lifetime spend tracking
- Owner-controlled limit updates

---

## HashKey/EVM Fundamentals (Quick)

- **Accounts**: Externally Owned Accounts (EOAs) and contracts (0x…)
- **Value transfer**: native HSK via transaction `value`
- **Units**: wei for on-chain integers; human display in ether units (HSK)
- **RPC**: JSON-RPC endpoint (`HASHKEY_RPC_URL`), chain id `133` for testnet

---

## Agentic Payments (Principles)

- Machine-to-machine payments (A2A transfers)
- Pay-per-use resources (per-agent settlement per query)
- Autonomous wallets (agents hold and manage funds)
- Spending policies (programmable daily caps)

---

## DeFi Data Sources Used

- **DeFiLlama**: TVL/fees/revenue, bridges, DEX volumes
- **CoinGecko**: prices and market metrics

---

## API Architecture

### Endpoints
- `POST /query` — Chat with AI, triggers agent payments
- `GET /receipts/:requestId` — Poll for payment tx hashes
- `GET /dashboard/stats?agentId=X` — Agent treasury balance, usage
- `GET /dashboard/activity?agentId=X` — Payment history
- `GET /health` — Server status

### Environment Variables
| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key |
| `GROQ_MODEL` | No | Groq model id (default `llama-3.3-70b-versatile`) |
| `HASHKEY_RPC_URL` | Yes | HashKey testnet RPC URL |
| `HASHKEY_CHAIN_ID` | Yes | `133` |
| `HASHKEY_TREASURY_PRIVATE_KEY` | Yes | Treasury private key (0x…) |
| `KAIROS_AGENT_REGISTRY_EVM_ADDRESS` | No | Agent registry contract |
| `KAIROS_SPENDING_POLICY_EVM_ADDRESS` | No | Spending policy contract |
| `SUPABASE_URL` | No | Database for chat history |
| `COINGECKO_API_KEY` | No | Higher rate limits |

---

## How RAG Works in Kairos

For questions about Kairos features, HashKey Chain, on-chain payments, or deployment:
1. The query is embedded using the same model as the corpus
2. Top-k relevant chunks are retrieved
3. Chunks are injected into the model context
4. Model answers citing **[Source N]** when using excerpts

For **live data** (prices, news, yields), RAG is bypassed — tools fetch real-time data from external APIs.

---

## Hackathon Context

Kairos is rebuilt for the **HashKey Chain Horizon Hackathon 2026** (AI track):
- On-chain agentic economy (payments + A2A)
- On-chain registry + spending policy controls
- Multi-agent orchestration with real data tools
