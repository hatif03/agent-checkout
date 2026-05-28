/**
 * x402 Somnia SDK - Server Module
 */

import { Request, Response, NextFunction } from "express";
import {
  Network,
  PaymentRequirements,
  PaymentProof,
  PaymentProofSchema,
  TokenType,
  InvalidPaymentProofError,
} from "./x402-types";
import {
  createPublicChainClient,
  verifyPaymentTransaction,
  getTransactionStatus,
  getChainId,
} from "./evm-utils";
import type { PublicClient } from "viem";

export interface X402ServerConfig {
  network: Network;
  chainId: number;
  recipientAddress: string;
  rpcEndpoint?: string;
  enableCache?: boolean;
  cacheTTL?: number;
}

export interface PaymentOptions {
  amount: string;
  token: TokenType;
  /** When true, amount is already in wei/base units */
  baseUnits?: boolean;
  memo?: string;
  deadline?: number;
  requestId?: string;
}

declare global {
  namespace Express {
    interface Request {
      payment?: {
        proof: PaymentProof;
        verified: boolean;
        amount: string;
        token: TokenType;
      };
    }
  }
}

class PaymentCache {
  private cache = new Map<string, { verified: boolean; timestamp: number }>();
  private ttl: number;

  constructor(ttl: number = 300) {
    this.ttl = ttl * 1000;
  }

  set(txHash: string, verified: boolean): void {
    this.cache.set(txHash, { verified, timestamp: Date.now() });
  }

  get(txHash: string): boolean | null {
    const entry = this.cache.get(txHash);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(txHash);
      return null;
    }
    return entry.verified;
  }
}

export class X402Server {
  private client: PublicClient;
  private config: X402ServerConfig;
  private cache?: PaymentCache;

  constructor(config: X402ServerConfig) {
    this.config = config;
    this.client = createPublicChainClient(config.network, config.rpcEndpoint);
    if (config.enableCache) {
      this.cache = new PaymentCache(config.cacheTTL);
    }
  }

  createPaymentRequirements(options: PaymentOptions): PaymentRequirements {
    const decimals = 18;
    let baseUnits: string;

    if (options.baseUnits) {
      baseUnits = options.amount;
    } else {
      const [whole, fraction = ""] = options.amount.split(".");
      const paddedFraction = fraction.padEnd(decimals, "0");
      baseUnits = whole + paddedFraction;
    }

    return {
      scheme: "exact",
      network: this.config.network,
      amount: baseUnits,
      token: options.token,
      recipient: this.config.recipientAddress,
      chainId: this.config.chainId,
      memo: options.memo,
      deadline: options.deadline,
      requestId: options.requestId || this.generateRequestId(),
    };
  }

  async verifyPayment(
    proof: PaymentProof,
    requirements: PaymentRequirements
  ): Promise<boolean> {
    try {
      if (this.cache) {
        const cached = this.cache.get(proof.txHash);
        if (cached !== null) return cached;
      }

      if (proof.network !== requirements.network) return false;
      if (proof.chainId !== getChainId(requirements.network)) return false;

      if (requirements.deadline && proof.timestamp > requirements.deadline) {
        return false;
      }

      const verified = await verifyPaymentTransaction(
        this.client,
        proof.txHash as `0x${string}`,
        requirements
      );

      if (this.cache) {
        this.cache.set(proof.txHash, verified);
      }

      return verified;
    } catch (error) {
      console.error("Payment verification error:", error);
      return false;
    }
  }

  requirePayment(options: PaymentOptions) {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        const paymentHeader = req.headers["x-payment"];

        if (!paymentHeader) {
          const requirements = this.createPaymentRequirements(options);
          res.status(402).json(requirements);
          return;
        }

        let proof: PaymentProof;
        try {
          const parsed =
            typeof paymentHeader === "string"
              ? JSON.parse(paymentHeader)
              : paymentHeader;
          proof = PaymentProofSchema.parse(parsed);
        } catch (error) {
          throw new InvalidPaymentProofError(
            "Invalid payment proof format",
            error
          );
        }

        const requirements = this.createPaymentRequirements(options);
        const verified = await this.verifyPayment(proof, requirements);

        if (!verified) {
          res.status(402).json({
            error: "Payment verification failed",
            requirements,
          });
          return;
        }

        req.payment = {
          proof,
          verified: true,
          amount: options.amount,
          token: options.token,
        };

        next();
      } catch (error) {
        console.error("Payment middleware error:", error);
        res.status(500).json({
          error: "Payment processing error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    };
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  async getTransactionStatus(txHash: string) {
    return getTransactionStatus(this.client, txHash as `0x${string}`);
  }

  getClient(): PublicClient {
    return this.client;
  }
}

export function createX402Server(config: X402ServerConfig): X402Server {
  return new X402Server(config);
}

export function x402Middleware(
  config: X402ServerConfig,
  paymentOptions: PaymentOptions
) {
  const server = new X402Server(config);
  return server.requirePayment(paymentOptions);
}
