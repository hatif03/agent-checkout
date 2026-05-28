import {
  createPublicClient,
  createWalletClient,
  http,
  parseEther,
  formatEther,
  type Hash,
  type PublicClient,
  type WalletClient,
  type Account,
  type Chain,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import {
  Network,
  TokenType,
  PaymentRequirements,
  TransactionFailedError,
  TransactionStatus,
} from "./x402-types";

export const SOMNIA_TESTNET_CHAIN: Chain = {
  id: 50312,
  name: "Somnia Shannon Testnet",
  nativeCurrency: { name: "STT", symbol: "STT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://dream-rpc.somnia.network"] },
  },
};

export const SOMNIA_MAINNET_CHAIN: Chain = {
  id: 5031,
  name: "Somnia Mainnet",
  nativeCurrency: { name: "SOMI", symbol: "SOMI", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://api.infra.mainnet.somnia.network"] },
  },
};

const TOKEN_DECIMALS: Record<TokenType, number> = {
  STT: 18,
  SOMI: 18,
};

export function getChain(network: Network, customRpc?: string): Chain {
  const base =
    network === "somnia-mainnet" ? SOMNIA_MAINNET_CHAIN : SOMNIA_TESTNET_CHAIN;
  if (!customRpc) return base;
  return {
    ...base,
    rpcUrls: { default: { http: [customRpc] } },
  };
}

export function getRpcEndpoint(network: Network, customEndpoint?: string): string {
  if (customEndpoint) return customEndpoint;
  return network === "somnia-mainnet"
    ? "https://api.infra.mainnet.somnia.network"
    : "https://dream-rpc.somnia.network";
}

export function getChainId(network: Network): number {
  return network === "somnia-mainnet" ? 5031 : 50312;
}

export function createPublicChainClient(
  network: Network,
  customEndpoint?: string
): PublicClient {
  const chain = getChain(network, customEndpoint);
  return createPublicClient({
    chain,
    transport: http(getRpcEndpoint(network, customEndpoint)),
  });
}

export function createWalletChainClient(
  network: Network,
  privateKey: `0x${string}`,
  customEndpoint?: string
): { client: WalletClient; account: Account } {
  const chain = getChain(network, customEndpoint);
  const account = privateKeyToAccount(privateKey);
  const client = createWalletClient({
    account,
    chain,
    transport: http(getRpcEndpoint(network, customEndpoint)),
  });
  return { client, account };
}

export function amountToBaseUnits(amount: string, token: TokenType): bigint {
  const decimals = TOKEN_DECIMALS[token];
  const parts = amount.split(".");
  const whole = parts[0] || "0";
  const fraction = (parts[1] || "").padEnd(decimals, "0").slice(0, decimals);
  return BigInt(whole + fraction);
}

export function baseUnitsToAmount(baseUnits: bigint, token: TokenType): string {
  const decimals = TOKEN_DECIMALS[token];
  const str = baseUnits.toString().padStart(decimals + 1, "0");
  const whole = str.slice(0, -decimals) || "0";
  const fraction = str.slice(-decimals);
  return `${whole}.${fraction}`.replace(/\.?0+$/, "");
}

export function usdToSttWei(usdAmount: number, sttUsdRate: number): bigint {
  if (sttUsdRate <= 0) throw new Error("Invalid STT/USD rate");
  const sttAmount = usdAmount / sttUsdRate;
  return parseEther(sttAmount.toFixed(18));
}

export async function sendNativePayment(
  network: Network,
  privateKey: `0x${string}`,
  recipient: `0x${string}`,
  amountWei: bigint,
  customEndpoint?: string
): Promise<Hash> {
  const { client, account } = createWalletChainClient(
    network,
    privateKey,
    customEndpoint
  );
  const chain = getChain(network, customEndpoint);

  try {
    const hash = await client.sendTransaction({
      account,
      chain,
      to: recipient,
      value: amountWei,
    });
    return hash;
  } catch (error) {
    throw new TransactionFailedError(
      `Failed to send transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }
}

export async function confirmTransaction(
  client: PublicClient,
  txHash: Hash
): Promise<boolean> {
  try {
    const receipt = await client.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });
    return receipt.status === "success";
  } catch (error) {
    throw new TransactionFailedError(
      `Failed to confirm transaction: ${error instanceof Error ? error.message : "Unknown error"}`,
      error
    );
  }
}

export async function getTransactionStatus(
  client: PublicClient,
  txHash: Hash
): Promise<TransactionStatus> {
  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash });
    if (!receipt) return "pending";
    return receipt.status === "success" ? "confirmed" : "failed";
  } catch {
    return "pending";
  }
}

export async function verifyPaymentTransaction(
  client: PublicClient,
  txHash: Hash,
  requirements: PaymentRequirements
): Promise<boolean> {
  try {
    const receipt = await client.getTransactionReceipt({ hash: txHash });

    if (!receipt || receipt.status !== "success") {
      console.error("Transaction not found or failed:", txHash);
      return false;
    }

    const tx = await client.getTransaction({ hash: txHash });
    if (!tx) {
      console.error("Transaction details not found:", txHash);
      return false;
    }

    const expectedRecipient = requirements.recipient.toLowerCase();
    const actualRecipient = tx.to?.toLowerCase();

    if (!actualRecipient || actualRecipient !== expectedRecipient) {
      console.error(
        `Recipient mismatch: expected ${expectedRecipient}, got ${actualRecipient}`
      );
      return false;
    }

    const expectedAmount = BigInt(requirements.amount);
    if (tx.value < expectedAmount) {
      console.error(
        `Insufficient payment: expected ${expectedAmount}, got ${tx.value}`
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error verifying payment:", error);
    return false;
  }
}

export { formatEther, parseEther };
