---
name: agent-checkout-demo
description: Demo script and hackathon submission guide for Agent Checkout. Use when preparing demos, pitch copy, README, or Encode Agentathon submission.
---

# Agent Checkout Demo

## 3-minute demo flow

1. Merchant registers Shopify store at `/register`
2. Select products at `/products` → sync to platform
3. AI agent connects to MCP (`http://localhost:3001/mcp`)
4. Agent calls `search_products_nl` → Somnia LLM matches products
5. Agent calls `initiate_checkout` → HTTP 402 with STT amount
6. Payment MCP `make_stt_payment` → STT transfer on Shannon testnet
7. Agent calls `finalize_checkout` → Shopify order created
8. Merchant sees order + txHash on `/dashboard`

## Judge talking points

- HTTP 402 agent commerce on Somnia (not Solana)
- Consensus-validated Somnia Agents for pricing + NL search
- Any Shopify store agent-ready in 2 minutes
- Native STT micropayments with on-chain verification

## Env checklist

```bash
# packages/backend/.env
SUPABASE_URL=
SUPABASE_KEY=
SOMNIA_RPC_URL=https://dream-rpc.somnia.network
SOMNIA_CHAIN_ID=50312
EVM_PRIVATE_KEY=0x...
X402_RECIPIENT_ADDRESS=0x...
STT_USD_RATE=0.01
```

## Run locally

```bash
pnpm install
pnpm dev   # frontend :3000, backend :3001, payment :3002
```

Expose via ngrok for remote agent testing.
