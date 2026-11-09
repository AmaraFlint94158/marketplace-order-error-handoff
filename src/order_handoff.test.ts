import assert from "node:assert/strict";
import test from "node:test";
import { handoffRequest } from "./order_handoff.ts";

test("checkout handoff rejects malformed buyer updates", () => {
  const result = handoffRequest.safeParse({ orderId: "order-1", sellerAssetId: "asset-1", buyerEmail: "bad" });
  assert.equal(result.success, false);
});
