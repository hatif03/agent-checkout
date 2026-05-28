import { parseEther, formatEther } from "viem";
import { x402Config } from "./x402-config";
import { Amounts } from "../types";
import crypto from "crypto";

const STT_USD_RATE = parseFloat(process.env.STT_USD_RATE || "0.01");

export function usdToSttWei(usdAmount: number, rate = STT_USD_RATE): string {
  if (rate <= 0) throw new Error("Invalid STT/USD rate");
  const sttAmount = usdAmount / rate;
  return parseEther(sttAmount.toFixed(18)).toString();
}

export function sttWeiToDisplay(wei: string): string {
  return formatEther(BigInt(wei));
}

/**
 * Creates x402 payment requirements for the checkout flow
 */
export function createPaymentRequirements(
  orderIntentId: string,
  amounts: Amounts,
  expiresAt: Date,
  amountWei?: string
) {
  const usdAmount = parseFloat(amounts.total);
  const sttWei = amountWei ?? usdToSttWei(usdAmount);

  return [
    {
      scheme: "x402-somnia-stt-v1",
      network: x402Config.network,
      chainId: x402Config.chainId,
      asset: "STT",
      amount: sttWei,
      payTo: x402Config.recipientAddress,
      expiresAt: expiresAt.toISOString(),
      metadata: {
        orderIntentId,
        amounts,
        sttWei,
        usdTotal: amounts.total,
      },
    },
  ];
}

export function deepSortObject(obj: unknown): unknown {
  if (Array.isArray(obj)) {
    return obj.map(deepSortObject);
  } else if (obj !== null && typeof obj === "object") {
    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj as object).sort();
    for (const key of keys) {
      sorted[key] = deepSortObject((obj as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return obj;
}

export function validateOrderIntentMatch(
  savedIntent: { body_hash: string },
  currentRequest: Record<string, unknown>
): boolean {
  const { orderIntentId: _, ...requestWithoutIntentId } = currentRequest;
  const normalizedRequest = deepSortObject(requestWithoutIntentId);
  const currentBodyHash = crypto
    .createHash("sha256")
    .update(JSON.stringify(normalizedRequest))
    .digest("hex");
  return currentBodyHash === savedIntent.body_hash;
}

export function isOrderIntentExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt).getTime() < Date.now();
}

export function parsePaymentHeader(headerValue: string): Record<string, unknown> {
  try {
    return JSON.parse(headerValue);
  } catch {
    throw new Error("Invalid X-PAYMENT header format");
  }
}

export function extractTxHashFromVerification(
  verificationResponse: Record<string, unknown>
): string {
  return (
    (verificationResponse.txHash as string) ||
    (verificationResponse.transaction_hash as string) ||
    (verificationResponse.tx_hash as string) ||
    (verificationResponse.signature as string) ||
    ""
  );
}
