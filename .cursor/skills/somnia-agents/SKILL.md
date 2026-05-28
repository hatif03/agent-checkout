---
name: somnia-agents
description: Invokes Somnia Agents (JSON API, LLM Inference) on Shannon testnet. Use when integrating agent calls, ABI encoding, agent deposits, or debugging agent receipts in agent-checkout.
---

# Somnia Agents

## Networks

- Testnet: chain ID **50312**, STT, RPC `https://dream-rpc.somnia.network`
- Mainnet: chain ID **5031**, SOMI

## Invocation pattern

Agents are invoked via HTTP POST with ABI-encoded input/output (same as Solidity calls).

```typescript
// See packages/backend/src/somnia-agents/client.ts
await invokeAgent({ agentId, abi, functionName, args, value });
```

## Base agents used in agent-checkout

| Agent | Use |
|-------|-----|
| JSON API Request | STT/USD price oracle, address validation API |
| LLM Inference | Natural-language product search, order summaries |

## Docs query

```
GET https://docs.somnia.network/agents/readme.md?ask=<question>
```

## Gas / deposits

Users deposit STT when creating agent requests. See [gas fees](https://docs.somnia.network/agents/invoking-agents/gas-fees.md).

Pin contract addresses from [quickstart](https://docs.somnia.network/agents/invoking-agents/quickstart.md). Details in [reference.md](reference.md).
