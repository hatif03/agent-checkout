/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";
import {
  sendNativePayment,
  confirmTransaction,
  createPublicChainClient,
  getChainId,
} from "../x402-sdk";
import type { Network } from "../x402-sdk";
import { z } from "zod";

let mcpPaymentInstance: any = null;

async function initializeMCPPaymentServer(): Promise<any> {
  if (mcpPaymentInstance) {
    return mcpPaymentInstance;
  }

  const { McpServer } = await import("@modelcontextprotocol/sdk/server/mcp.js");

  const server = new McpServer({
    name: "agent-checkout-payment-agent",
    version: "2.0.0",
  });

  server.tool(
    "make_stt_payment",
    "Send native STT payment on Somnia and return payment proof for checkout finalization",
    {
      recipientAddress: z
        .string()
        .describe("EVM address to receive STT"),
      amountWei: z
        .string()
        .describe("Amount in wei (18 decimals)"),
      network: z
        .string()
        .default("somnia-testnet")
        .describe("Somnia network (somnia-testnet or somnia-mainnet)"),
    },
    async (args) => {
      return await handleMakeSttPayment(args as any);
    }
  );

  mcpPaymentInstance = server;
  return server;
}

export async function handleMCPPaymentRequest(req: Request, res: Response) {
  const requestId = `mcp_payment_${Date.now()}_${Math.random()
    .toString(36)
    .substring(7)}`;

  try {
    const body = req.body;
    const server = await initializeMCPPaymentServer();
    void server;
    const jsonRpcRequest = body;
    const method = jsonRpcRequest.method;
    const params = jsonRpcRequest.params || {};
    const id = jsonRpcRequest.id;

    let jsonRpcResponse: any;

    if (method === "initialize") {
      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2025-06-18",
          capabilities: { tools: {}, resources: { subscribe: false }, prompts: {} },
          serverInfo: {
            name: "agent-checkout-payment-agent",
            version: "2.0.0",
          },
        },
      };
    } else if (method === "tools/list") {
      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: {
          tools: [
            {
              name: "make_stt_payment",
              description:
                "Send native STT payment on Somnia and return payment proof",
              inputSchema: {
                type: "object",
                properties: {
                  recipientAddress: { type: "string" },
                  amountWei: { type: "string" },
                  network: {
                    type: "string",
                    default: "somnia-testnet",
                  },
                },
                required: ["recipientAddress", "amountWei"],
              },
            },
          ],
        },
      };
    } else if (method === "tools/call") {
      const toolName = params.name;
      const toolArgs = params.arguments || {};
      let toolResult;

      switch (toolName) {
        case "make_stt_payment":
          toolResult = await handleMakeSttPayment(toolArgs);
          break;
        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        result: {
          content: [{ type: "text", text: JSON.stringify(toolResult, null, 2) }],
        },
      };
    } else {
      jsonRpcResponse = {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
    }

    return res.status(200).json(jsonRpcResponse);
  } catch (error: any) {
    console.error(`[${requestId}] MCP payment error:`, error.message);
    return res.status(200).json({
      jsonrpc: "2.0",
      id: req.body?.id || null,
      error: {
        code: -32603,
        message: "Internal server error",
        data: error.message,
      },
    });
  }
}

async function handleMakeSttPayment(args: any): Promise<any> {
  const {
    recipientAddress,
    amountWei,
    network = "somnia-testnet",
  } = args;

  if (!recipientAddress) {
    throw new Error("Missing required parameter: recipientAddress");
  }
  if (!amountWei) {
    throw new Error("Missing required parameter: amountWei");
  }

  try {
    const privateKey = process.env.EVM_PRIVATE_KEY as `0x${string}` | undefined;
    if (!privateKey) {
      throw new Error("EVM_PRIVATE_KEY environment variable not set");
    }

    const somniaNetwork = network as Network;
    const chainId = getChainId(somniaNetwork);

    const txHash = await sendNativePayment(
      somniaNetwork,
      privateKey,
      recipientAddress as `0x${string}`,
      BigInt(amountWei),
      process.env.SOMNIA_RPC_URL
    );

    const client = createPublicChainClient(
      somniaNetwork,
      process.env.SOMNIA_RPC_URL
    );
    const confirmed = await confirmTransaction(client, txHash);

    if (!confirmed) {
      throw new Error("Transaction failed to confirm");
    }

    const paymentProof = {
      txHash,
      network: somniaNetwork,
      chainId,
      timestamp: Date.now(),
    };

    return {
      success: true,
      paymentProof,
      details: {
        txHash,
        recipientAddress,
        amountWei,
        network: somniaNetwork,
        chainId,
        confirmedAt: new Date().toISOString(),
        message: `Payment of ${amountWei} wei STT sent. Use paymentProof to finalize checkout.`,
      },
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message,
      details: {
        message: "Payment failed. Ensure wallet has sufficient STT balance.",
      },
    };
  }
}
