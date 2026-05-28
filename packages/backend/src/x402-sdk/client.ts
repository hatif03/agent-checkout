/**
 * x402 Somnia SDK - Client Module
 */

import {
  Network,
  PaymentRequirements,
  PaymentRequirementsSchema,
  PaymentProof,
  PaymentRequiredError,
  SDKConfig,
  TransactionFailedError,
} from "./x402-types";
import {
  createPublicChainClient,
  sendNativePayment,
  confirmTransaction,
} from "./evm-utils";

export type Signer = `0x${string}`;

export interface X402ClientConfig extends SDKConfig {
  signer?: Signer;
}

export interface X402FetchOptions extends RequestInit {
  autoPayment?: boolean;
  signer?: Signer;
  onPaymentRequired?: (requirements: PaymentRequirements) => Promise<PaymentProof>;
}

export class X402Client {
  private config: X402ClientConfig;

  constructor(config: X402ClientConfig) {
    this.config = { ...config };
  }

  async fetch(url: string, options: X402FetchOptions = {}): Promise<Response> {
    const { autoPayment = true, signer, onPaymentRequired, ...fetchOptions } =
      options;
    const requestSigner = signer || this.config.signer;

    const response = await fetch(url, fetchOptions);

    if (response.status === 402 && autoPayment) {
      if (!requestSigner) {
        throw new PaymentRequiredError(
          await this.parsePaymentRequirements(response),
          "Payment required but no signer provided"
        );
      }

      const requirements = await this.parsePaymentRequirements(response);
      const paymentProof = onPaymentRequired
        ? await onPaymentRequired(requirements)
        : await this.executePayment(requirements, requestSigner);

      return this.retryWithPayment(url, fetchOptions, paymentProof);
    }

    return response;
  }

  private async parsePaymentRequirements(
    response: Response
  ): Promise<PaymentRequirements> {
    const body = await response.json();
    return PaymentRequirementsSchema.parse(body);
  }

  private async executePayment(
    requirements: PaymentRequirements,
    privateKey: Signer
  ): Promise<PaymentProof> {
    try {
      const txHash = await sendNativePayment(
        requirements.network,
        privateKey,
        requirements.recipient as `0x${string}`,
        BigInt(requirements.amount),
        this.config.rpcEndpoint
      );

      const client = createPublicChainClient(
        requirements.network,
        this.config.rpcEndpoint
      );
      const confirmed = await confirmTransaction(client, txHash);

      if (!confirmed) {
        throw new TransactionFailedError("Transaction failed to confirm");
      }

      return {
        txHash,
        network: requirements.network,
        chainId: requirements.chainId ?? this.config.chainId,
        requestId: requirements.requestId,
        timestamp: Date.now(),
      };
    } catch (error) {
      throw new TransactionFailedError(
        `Payment execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        error
      );
    }
  }

  private async retryWithPayment(
    url: string,
    options: RequestInit,
    proof: PaymentProof
  ): Promise<Response> {
    const headers = new Headers(options.headers);
    headers.set("X-Payment", JSON.stringify(proof));
    headers.set("Content-Type", "application/json");
    return fetch(url, { ...options, headers });
  }

  getConfig(): X402ClientConfig {
    return { ...this.config };
  }
}

export interface X402FetchWrapperOptions
  extends Omit<X402ClientConfig, "network">,
    Omit<X402FetchOptions, "signer" | "autoPayment"> {
  network: Network;
  autoPayment?: boolean;
}

export async function x402Fetch(
  url: string,
  options: X402FetchWrapperOptions
): Promise<Response> {
  const { network, chainId, signer, rpcEndpoint, autoPayment, ...fetchOptions } =
    options;

  const client = new X402Client({ network, chainId, signer, rpcEndpoint });
  return client.fetch(url, { ...fetchOptions, autoPayment });
}

export async function createPaymentProof(
  requirements: PaymentRequirements,
  privateKey: `0x${string}`,
  config: SDKConfig
): Promise<PaymentProof> {
  const txHash = await sendNativePayment(
    requirements.network,
    privateKey,
    requirements.recipient as `0x${string}`,
    BigInt(requirements.amount),
    config.rpcEndpoint
  );

  const client = createPublicChainClient(requirements.network, config.rpcEndpoint);
  await confirmTransaction(client, txHash);

  return {
    txHash,
    network: requirements.network,
    chainId: requirements.chainId ?? config.chainId,
    requestId: requirements.requestId,
    timestamp: Date.now(),
  };
}
