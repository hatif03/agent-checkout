# Agent Checkout Frontend

Next.js merchant UI for registering Shopify stores, selecting agent-enabled products, and monitoring orders on Somnia.

## Pages

- `/` — Landing
- `/register` — Connect Shopify store
- `/products` — Select products to expose to agents
- `/dashboard` — Orders and payment intents (with Shannon explorer tx links)

## Run

```bash
pnpm dev
# http://localhost:3000
```

Requires backend at `http://localhost:3001`.
