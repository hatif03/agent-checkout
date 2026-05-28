# Agent Checkout Backend

Express API + MCP servers for agent-native Shopify checkout on Somnia (HTTP 402 + native STT).

## Services

| Port | Service |
|------|---------|
| 3001 | Main API + Shopping MCP (`/mcp`) |
| 3002 | Payment MCP (`/mcp`) |

## Setup

```bash
cp .env.example .env
pnpm install
pnpm dev:all
```

## Key endpoints

- `POST /x402/checkout` — Two-phase HTTP 402 checkout
- `GET /x402/stores` — Agent store discovery
- `POST /api/stores` — Merchant store registration

## Payment scheme

`x402-somnia-stt-v1` — native STT on Shannon Testnet (50312)

Payment proof: `{ txHash, network, chainId, timestamp }`

See root [README](../../README.md) for full documentation.
