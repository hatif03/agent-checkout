# Encode Agentathon Submission — Agent Checkout

## Project name
Agent Checkout

## One-liner
Agent-native Shopify checkout: MCP discovery, HTTP 402 payments, native STT on Somnia, Somnia Agents for oracle + NL search.

## Track / sponsor alignment
- **Somnia** — Shannon Testnet deployment, native STT, Somnia Agents integration
- **Agent commerce** — MCP + HTTP 402 two-phase checkout for autonomous agents

## Demo video outline (3–5 min)

| Time | Scene |
|------|-------|
| 0:00 | Problem: Shopify stores aren't agent-ready |
| 0:30 | Merchant registers store, selects products |
| 1:00 | AI agent connects to MCP, searches products NL |
| 1:30 | initiate_checkout → HTTP 402 with STT wei amount |
| 2:00 | make_stt_payment → Shannon explorer tx |
| 2:30 | finalize_checkout → Shopify order appears |
| 3:00 | Dashboard + architecture recap |

## Judging criteria mapping

| Criterion | Evidence |
|-----------|----------|
| Novelty | HTTP 402 agent commerce + Somnia Agents (not just EVM swap) |
| Technical | Full MCP checkout, on-chain STT verification, agent modules |
| Impact | Any Shopify merchant agent-ready in 2 minutes |
| Design | Simple merchant UI, documented MCP API |
| Somnia-specific | STT payments, address validation, STT/USD oracle |

## Setup for judges

```bash
pnpm install
cp packages/backend/.env.example packages/backend/.env
# Configure Supabase + EVM keys + STT from faucet
pnpm dev
```

## Live URLs (fill after deploy)

- Frontend: _TBD_
- Backend API: _TBD_
- GitHub: _TBD_

## Team contact
_Add your contact_
