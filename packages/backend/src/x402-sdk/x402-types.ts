import { z } from "zod";

/**
 * x402 Protocol Type Definitions
 * HTTP 402 Payment Required — Somnia EVM (native STT/SOMI)
 */

export const PaymentSchemeSchema = z.enum(["exact", "upto"]);
export type PaymentScheme = z.infer<typeof PaymentSchemeSchema>;

export const NetworkSchema = z.enum(["somnia-testnet", "somnia-mainnet"]);
export type Network = z.infer<typeof NetworkSchema>;

export const TokenTypeSchema = z.enum(["STT", "SOMI"]);
export type TokenType = z.infer<typeof TokenTypeSchema>;

export const PaymentRequirementsSchema = z.object({
  scheme: PaymentSchemeSchema,
  network: NetworkSchema,
  amount: z.string(),
  token: TokenTypeSchema,
  recipient: z.string(),
  chainId: z.number().optional(),
  memo: z.string().optional(),
  deadline: z.number().optional(),
  requestId: z.string().optional(),
});

export type PaymentRequirements = z.infer<typeof PaymentRequirementsSchema>;

export const PaymentProofSchema = z.object({
  txHash: z.string(),
  network: NetworkSchema,
  chainId: z.number(),
  requestId: z.string().optional(),
  timestamp: z.number(),
});

export type PaymentProof = z.infer<typeof PaymentProofSchema>;

export interface X402Response {
  status: 402;
  headers: {
    "content-type": "application/json";
    "www-authenticate"?: string;
  };
  body: PaymentRequirements;
}

export const TransactionStatusSchema = z.enum([
  "pending",
  "confirmed",
  "finalized",
  "failed",
]);

export type TransactionStatus = z.infer<typeof TransactionStatusSchema>;

export const SDKConfigSchema = z.object({
  network: NetworkSchema,
  chainId: z.number(),
  rpcEndpoint: z.string().url().optional(),
});

export type SDKConfig = z.infer<typeof SDKConfigSchema>;

export class X402Error extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "X402Error";
  }
}

export class PaymentRequiredError extends X402Error {
  constructor(
    public paymentRequirements: PaymentRequirements,
    message = "Payment required to access this resource"
  ) {
    super(message, "PAYMENT_REQUIRED", paymentRequirements);
    this.name = "PaymentRequiredError";
  }
}

export class TransactionFailedError extends X402Error {
  constructor(message: string, details?: unknown) {
    super(message, "TRANSACTION_FAILED", details);
    this.name = "TransactionFailedError";
  }
}

export class InvalidPaymentProofError extends X402Error {
  constructor(message: string, details?: unknown) {
    super(message, "INVALID_PAYMENT_PROOF", details);
    this.name = "InvalidPaymentProofError";
  }
}
