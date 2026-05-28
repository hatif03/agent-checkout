import { createX402Server, getChainId } from "../x402-sdk";
import type { Network } from "../x402-sdk";

let x402ServerInstance: ReturnType<typeof createX402Server> | null = null;

function resolveNetwork(): Network {
  const env = process.env.SOMNIA_NETWORK || "testnet";
  return env === "mainnet" ? "somnia-mainnet" : "somnia-testnet";
}

async function initializeX402Server() {
  if (x402ServerInstance) {
    return x402ServerInstance;
  }

  const network = resolveNetwork();
  const recipientAddress = process.env.X402_RECIPIENT_ADDRESS;

  if (!recipientAddress) {
    throw new Error(
      "X402_RECIPIENT_ADDRESS environment variable is required for x402 payments"
    );
  }

  x402ServerInstance = createX402Server({
    network,
    chainId: Number(process.env.SOMNIA_CHAIN_ID) || getChainId(network),
    recipientAddress,
    rpcEndpoint: process.env.SOMNIA_RPC_URL,
  });

  return x402ServerInstance;
}

export { initializeX402Server };

const network = resolveNetwork();

export const x402Config = {
  network,
  chainId: Number(process.env.SOMNIA_CHAIN_ID) || getChainId(network),
  recipientAddress: process.env.X402_RECIPIENT_ADDRESS || "",
  rpcUrl: process.env.SOMNIA_RPC_URL || "https://dream-rpc.somnia.network",
};
