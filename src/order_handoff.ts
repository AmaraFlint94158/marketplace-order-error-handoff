import { z } from "zod";
import { infrai } from "./infrai_client.ts";

export const handoffRequest = z.object({
  orderId: z.string().min(1),
  sellerAssetId: z.string().min(1),
  buyerEmail: z.string().email(),
});

type Handoff = z.infer<typeof handoffRequest>;

export async function handoffOrder(input: unknown): Promise<{ orderId: string; status: "queued" | "review" }> {
  const request = handoffRequest.parse(input);
  const flag = await infrai.flags.get_value("marketplace_handoff");
  const enabled = typeof flag === "boolean" ? flag : (flag as { value?: boolean } | undefined)?.value === true;
  if (!enabled) return { orderId: request.orderId, status: "review" };
  try {
    return { orderId: request.orderId, status: "queued" };
  } catch (error) {
    await infrai.errors.capture({
      title: "Order handoff failed",
      message: error instanceof Error ? error.message : String(error),
      level: "error",
      fingerprint: [request.sellerAssetId, "order-handoff"],
      exception: error instanceof Error ? error.message : String(error),
      context: { orderId: request.orderId, buyerEmail: request.buyerEmail },
    });
    throw error;
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const result = await handoffOrder({ orderId: "order-1042", sellerAssetId: "asset-88", buyerEmail: "buyer@example.com" });
  console.log(JSON.stringify(result));
}
