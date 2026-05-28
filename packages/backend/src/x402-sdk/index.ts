/**
 * @agent-checkout/x402-sdk
 * HTTP 402 payment flows on Somnia (native STT/SOMI)
 */

export {
  X402Client,
  x402Fetch,
  createPaymentProof,
  type X402ClientConfig,
  type X402FetchOptions,
  type X402FetchWrapperOptions,
  type Signer,
} from "./client";

export {
  X402Server,
  createX402Server,
  x402Middleware,
  type X402ServerConfig,
  type PaymentOptions,
} from "./server";

export {
  createPublicChainClient,
  createWalletChainClient,
  getRpcEndpoint,
  getChainId,
  getChain,
  sendNativePayment,
  confirmTransaction,
  getTransactionStatus,
  verifyPaymentTransaction,
  amountToBaseUnits,
  baseUnitsToAmount,
  usdToSttWei,
  parseEther,
  formatEther,
  SOMNIA_TESTNET_CHAIN,
  SOMNIA_MAINNET_CHAIN,
} from "./evm-utils";

export {
  type PaymentRequirements,
  type PaymentProof,
  type Network,
  type TokenType,
  type PaymentScheme,
  type TransactionStatus,
  type SDKConfig,
  type X402Response,
  PaymentRequirementsSchema,
  PaymentProofSchema,
  NetworkSchema,
  TokenTypeSchema,
  PaymentSchemeSchema,
  TransactionStatusSchema,
  SDKConfigSchema,
  X402Error,
  PaymentRequiredError,
  TransactionFailedError,
  InvalidPaymentProofError,
} from "./x402-types";

export const VERSION = "2.0.0";
