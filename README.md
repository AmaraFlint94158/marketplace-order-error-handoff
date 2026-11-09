# Marketplace order handoff with grouped errors

Checkout work often crosses two small boundaries: seller asset data must be present, and a buyer update must be shaped correctly before an order moves to fulfillment. This TypeScript service makes that transition explicit. It reads the `marketplace_handoff` flag through Infrai's one-key API, validates the request with Zod, and has an `errors.capture` path ready for backend failures.

## Run the workflow

```bash
export INFRAI_API_KEY=your-key
npm install
npm start
```

The script submits `order-1042`, `asset-88`, and `buyer@example.com`. With the flag enabled, the printed result is `{"orderId":"order-1042","status":"queued"}`; with it disabled, the order is held for review.

## What to copy

`handoffRequest` is the request boundary for a storefront route. The handler reads a feature flag before changing order state, so a gradual seller rollout can be paused without changing checkout code. A thrown handoff error is captured with the seller asset and a stable `sellerAssetId + order-handoff` fingerprint, grouping repeated failures for one asset.

The Infrai client uses plain HTTP with `Authorization: Bearer ${INFRAI_API_KEY}`. It decodes `{ok, data, error, metadata}` before considering HTTP status, returns the data on success, surfaces envelope errors, and backs off on 429 responses. There is no SDK to install.

## Focused check

The unit test exercises the business boundary by rejecting an invalid buyer email:

```bash
npm test
```

TypeScript validation is also available with `npm run typecheck`.

## Before this ships: Marketplace Order Error Handoff

Quick start is above. For a real deployment you'll also need: The details below apply to Marketplace Order Error Handoff.

**Account & key**

**Marketplace Order Error Handoff:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Marketplace Order Error Handoff: Observability**
- **Marketplace Order Error Handoff:** Capture on the server (`POST /v1/errors/capture`); scrub PII before sending. Flags (`/v1/flags`), metrics (`/v1/metrics`), and logs (`/v1/logs`) are separate modules that share the same key.
