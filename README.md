# Bonfire Oracle — Self-Funding Autonomous Trading Agent

**Live Demo:** [https://bonfire-oracle.vercel.app](https://bonfire-oracle.vercel.app)

> **An autonomous AI agent that pays for its own intelligence.**
>
> Launches a token on Base, collects trading fees, and routes that revenue to fund multi-model inference — creating a self-sustaining onchain intelligence loop. Deeply integrated with Bonfires community intelligence for consensus-gated trading.

Built for **The Synthesis** hackathon — **Bankr $5,000 Bounty** (Best Bankr LLM Gateway Use).

**$ORACLE token live on Base** — generating real trading fee revenue autonomously.

---

## The Core Idea

Most AI agents are expenses. **Bonfire Oracle funds itself.**

```
┌─────────────────── THE SELF-FUNDING LOOP ───────────────────┐
│                                                              │
│   ┌──────────┐  fees   ┌───────────┐  insight  ┌────────┐   │
│   │ $ORACLE  │────────▶│  Bankr    │──────────▶│ Trade  │   │
│   │  Token   │         │  LLM GW   │           │ on Base│   │
│   │  (Base)  │◀────────│ 3 Models  │◀──────────│  chain │   │
│   └──────────┘ revenue └───────────┘  profit   └────────┘   │
│                                                              │
│   Token fees + trade PnL  ──▶  Fund inference  ──▶  Repeat  │
└──────────────────────────────────────────────────────────────┘
```

**Every cycle:**
1. Agent checks its Bankr wallet balance
2. Claims any accumulated $ORACLE trading fees
3. Runs a 3-model analysis committee (Gemini → GPT → Claude)
4. Executes real trades on Base via Bankr Agent API
5. Revenue from fees + trades funds the next cycle

After cycle 2, the agent **auto-launches $ORACLE** on Base to generate fee revenue — making the loop fully autonomous.

---

## What Makes This Different

### Real Self-Funding Economics (not just tracking numbers)

The agent doesn't just *display* economics — it **acts on them**:
- Calls `getBalances()` every cycle to check wallet state
- Calls `claimFees()` to collect token revenue and route it to inference funding
- Auto-launches $ORACLE token on Base after gathering initial market intelligence
- Dashboard shows live proof: wallet balance, fee claims, trade volume, inference spend

### Genuine Multi-Model Usage (3 distinct cognitive roles)

| Model | Role | Why | Cost/call |
|-------|------|-----|-----------|
| **Gemini 2.5 Flash** | Scanner | Cheapest, fastest — scans entire market for signals | ~$0.0003 |
| **GPT-5 Mini** | Quant Analyst | Pattern recognition on structured data | ~$0.0007 |
| **Claude Sonnet 4.6** | Thesis Writer | Best at nuanced reasoning for investment decisions | ~$0.003 |

The pipeline is **cost-optimized**: cheap Gemini filters first, expensive Claude only runs on high-confidence signals. This is real multi-model orchestration, not 3 wrappers around the same prompt.

### Real Onchain Execution

- Executes actual buy/sell trades on Base via Bankr Agent API
- Launches real ERC-20 token with Uniswap V4 liquidity pool
- Claims real trading fees from token swaps
- All verifiable onchain — wallet balance shown in dashboard

### Community Intelligence (Bonfires)

- Queries Bonfires knowledge graph for community alpha
- Extracts governance actions, trending topics, sentiment
- Feeds community context into every model call — not just raw price data

---

## Quick Start

### 1. Install

```bash
cd bonfire-agent
npm install
```

### 2. Configure

```bash
cp .env.example .env.local
```

Add your keys in `.env.local`:

```
BANKR_API_KEY=bk_your_llm_gateway_key
BANKR_AGENT_API_KEY=bk_your_agent_api_key
BONFIRES_API_KEY=your_bonfires_key
```

Get keys at [bankr.bot/api](https://bankr.bot/api) — enable both **LLM Gateway** and **Agent API**.

### 3. Fund LLM Credits

```bash
npm install -g @bankr/cli
bankr login
bankr llm credits add 5    # Add $5 in LLM credits
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 5. Usage

1. **"Run Cycle"** — triggers one full analysis + execution cycle
2. Watch the 3-model pipeline run: Gemini scan → GPT quant → Claude thesis
3. See the **Onchain Proof** panel populate with real wallet balance and activity
4. **"Start Agent"** — autonomous mode with continuous cycles
5. After cycle 2, the agent **auto-launches $ORACLE** and begins collecting fees
6. Watch the self-sustaining indicator: revenue vs inference cost

---

## Architecture

```
src/
├── lib/
│   ├── bankr/
│   │   ├── gateway.ts        # LLM Gateway (Vercel AI SDK, retry, logging)
│   │   ├── agent-api.ts      # Agent API (trades, balances, token launch)
│   │   └── types.ts          # Model configs + cost tables
│   ├── bonfires/
│   │   ├── client.ts         # Knowledge graph queries
│   │   └── types.ts
│   ├── analysis/
│   │   ├── pipeline.ts       # Gemini → GPT → Claude committee
│   │   └── types.ts          # ScanResult, QuantAnalysis, Thesis
│   ├── agent/
│   │   ├── orchestrator.ts   # Self-funding loop + cycle management
│   │   └── types.ts          # WalletInfo, OnchainActivity, AgentState
│   └── economics/
│       ├── tracker.ts        # Cost vs revenue tracking
│       └── types.ts
├── components/dashboard/
│   ├── onchain-activity.tsx   # Wallet balance + activity log (proof)
│   ├── economics-panel.tsx    # Self-funding economics display
│   ├── decision-feed.tsx      # Committee decision stream
│   ├── model-usage.tsx        # Per-model cost breakdown
│   ├── flywheel-diagram.tsx   # Visual flywheel animation
│   └── header.tsx             # Agent controls
├── hooks/useAgent.ts          # SSE real-time state hook
└── app/
    ├── api/agent/route.ts     # Agent control API
    ├── api/agent/stream/      # SSE streaming endpoint
    └── page.tsx               # Dashboard
```

## Self-Funding Loop (Detail)

```
                    ┌─── EVERY CYCLE ───┐
                    │                    │
                    ▼                    │
            ┌──────────────┐            │
            │ Check Wallet │  getBalances()
            │   Balance    │            │
            └──────┬───────┘            │
                   ▼                    │
            ┌──────────────┐            │
            │ Claim Token  │  claimFees()
            │    Fees      │  → revenue recorded
            └──────┬───────┘            │
                   ▼                    │
            ┌──────────────┐            │
            │ Run 3-Model  │  Gemini → GPT → Claude
            │  Committee   │  → costs recorded per model
            └──────┬───────┘            │
                   ▼                    │
            ┌──────────────┐            │
            │ Execute Trade│  executeTrade() on Base
            │  (if signal) │  → volume recorded
            └──────┬───────┘            │
                   ▼                    │
            ┌──────────────┐            │
            │ Auto-Launch  │  launchToken() (cycle 2+)
            │ $ORACLE Token│  → fee revenue starts
            └──────┬───────┘            │
                   │                    │
                   └────────────────────┘
```

## Tech Stack

- **Next.js 16** — App Router, API routes, SSE streaming
- **Vercel AI SDK** — `@ai-sdk/openai-compatible` for Bankr LLM Gateway
- **TypeScript** — Full stack type safety
- **Tailwind CSS** — Dark theme real-time dashboard
- **Lucide React** — Icons

## Bounty Criteria

| Criteria | Implementation |
|----------|----------------|
| **Real onchain execution** | Trades, token launch, fee claims — all via Bankr Agent API on Base. Wallet balance shown in dashboard. |
| **Genuine multi-model usage** | 3 models (Gemini, GPT, Claude) with distinct roles and cost-optimized pipeline routing. |
| **Self-sustaining economics** | Auto-launches token → claims fees → funds inference. Revenue vs cost tracked per cycle. Dashboard shows self-sustaining status. |
| **Bankr LLM Gateway** | All inference through `llm.bankr.bot/v1` via `@ai-sdk/openai-compatible`. Real token counting and cost tracking. |
| **Creative application** | AI investment committee with community intelligence (Bonfires) and autonomous self-funding. |

## License

MIT
