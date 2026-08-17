# Stripe Connect Removal (July 2026)

## What was removed

In `apps/order-service/src/controllers/order.controller.ts`, the `createPaymentIntent` function was stripped of Stripe Connect-specific parameters:

| Removed lines | Purpose |
|---|---|
| `sellerStripeAccountId` from `req.body` destructuring | Seller's Connect account ID sent from frontend |
| `const platformFee = Math.floor(customerAmount * 0.1)` | 10% admin fee calculation |
| `application_fee_amount: platformFee` | Stripe Connect parameter to split the fee |
| `on_behalf_of: sellerStripeAccountId` | Stripe Connect parameter |
| `transfer_data: { destination: sellerStripeAccountId }` | Stripe Connect parameter to route funds to seller |

## Why

The Stripe API key was rotated, which created a new Stripe account. The old seller Connect accounts became orphaned, and creating new ones failed because Stripe Connect wasn't fully set up on the platform account. Removing Connect was the fastest fix to unblock order payments.

## What this means for the app

- All payments go directly to the **platform Stripe account**
- Stripe processing fees are deducted from the full amount
- The **10% admin fee is NOT being collected** — there is no alternative fee-splitting mechanism in place. This needs to be implemented separately if required.
- Seller payouts are no longer handled by Stripe Connect — sellers will need to be paid manually or via a future feature.

## How to restore Stripe Connect

When you're ready to re-enable Connect:

1. **Enable Connect on your platform**
   - Go to https://dashboard.stripe.com/connect and complete the platform registration.
   - Choose Express account type.

2. **Create new Connect accounts for sellers**
   ```bash
   stripe accounts create --type=express --email=<seller-email> --country=<COUNTRY>
   ```
   Enable transfers:
   ```bash
   stripe accounts update <acct_id> --capabilities.transfers.requested=true
   ```

3. **Update seller `stripeId` in database**
   ```ts
   await prisma.sellers.update({
     where: { email: '<seller-email>' },
     data: { stripeId: '<acct_id>' },
   });
   ```

4. **Restore the code in `order.controller.ts`**

   In the `createPaymentIntent` function, add these back inside the `stripe.paymentIntents.create()` call:

   ```ts
   application_fee_amount: Math.floor(customerAmount * 0.1),
   on_behalf_of: sellerStripeAccountId,
   transfer_data: {
     destination: sellerStripeAccountId,
   },
   ```

   And add back the destructuring and fee calculation:
   ```ts
   const { amount, sellerStripeAccountId, sessionId } = req.body;
   const platformFee = Math.floor(customerAmount * 0.1);
   ```

## Files affected

| File | Change |
|---|---|
| `apps/order-service/src/controllers/order.controller.ts` | 6 lines removed from `createPaymentIntent` |
| `docs/stripe-connect-removal.md` | This file |

## What was NOT changed

- The frontend (`user-ui/src/app/(routes)/checkout/page.tsx`) still sends `sellerStripeAccountId` in the request body — the backend simply ignores it. No frontend changes needed.
- The seller's `stripeId` field in the database still exists — it's just unused by the payment flow.
- No other services (auth, product, seller, admin, etc.) were touched.
