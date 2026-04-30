# Baefikra — Frontend (Next.js 16)

Customer storefront. After backend integration this repo is a **pure consumer** of the NestJS backend at `../baefikra-backend` — no MongoDB, no Razorpay/S3/Algolia/Delhivery/Resend SDK, no business logic. All data flows through GraphQL/REST proxies in `lib/api/`.

## Architecture

```
┌─────────── Next.js (this repo) ─────────────┐
│  app/                                       │
│   ├─ (public)/(account)/(checkout)/(admin)/(auth) — pages
│   └─ api/* — thin Next.js routes that proxy → backend
│  lib/api/                                   │
│   ├─ client.ts   — fetch + GraphQL helper, auto refresh on 401
│   ├─ tokens.ts   — HttpOnly cookie management
│   ├─ auth.ts | products.ts | cart.ts | checkout.ts |
│       orders.ts | users.ts | wishlist.ts | reviews.ts |
│       content.ts | media.ts
│   └─ types.ts    — DTOs mirroring backend's @ObjectType
│  contexts/       — cart-context (typed against CartDto)
│  lib/auth.ts     — NextAuth (Credentials → backend loginWithEmail mutation)
└─────────────────────────────────────────────┘
                         ▼
┌──────── NestJS backend (../baefikra-backend) ───────┐
│  /graphql, /webhooks/*, /auth/google, /uploads/presign │
└────────────────────────────────────────────────────────┘
```

## Setup

```bash
# 1. Start the backend first
cd ../baefikra-backend
pnpm infra:up
pnpm db:migrate
pnpm db:seed
pnpm dev          # api on :4000, worker connected to Kafka

# 2. Then the frontend
cd ../baefikra-frontent
cp env.template .env.local
# fill NEXTAUTH_SECRET (32+ bytes random) + NEXT_PUBLIC_RAZORPAY_KEY_ID
pnpm install
pnpm dev          # next.js on :3000
```

## Auth flow

| Method | Path |
| --- | --- |
| Email/password | NextAuth `signIn("credentials")` → backend `loginWithEmail` mutation → JWT cookies + NextAuth session |
| Google OAuth | `/api/auth/google` → backend `/auth/google` → backend callback → 302 to `/auth/callback#tokens` → cookies set |
| Register | `POST /api/auth/register` → `registerWithEmail` |
| Forgot password | `POST /api/auth/forgot-password` → `requestPasswordReset` |
| Reset | `POST /api/auth/reset-password` → `resetPassword` |
| Verify email | `POST /api/auth/verify` → `verifyEmail` |

## Data flow examples

```ts
// Server component
import { productsApi } from "@/lib/api";
const product = await productsApi.getProductBySlug(params.slug);

// Client component (uses Next.js proxy → backend)
import { clientFetch } from "@/lib/api/client";
import type { CartDto } from "@/lib/api/types";
const cart = await clientFetch<CartDto>("/api/cart");

// Checkout
import { checkoutApi } from "@/lib/api";
const session = await checkoutApi.startCheckout();
await checkoutApi.setCheckoutAddress(session.sessionId, addressId);
await checkoutApi.setCheckoutShipping(session.sessionId, "delhivery_surface");
const intent = await checkoutApi.initiatePayment(session.sessionId);
// → open Razorpay widget with intent.providerOrderId / publicKey
```

## Money / IDs

- **IDs** are UUIDv7 strings, not Mongo ObjectIds. Use `id`, not `_id`.
- **Money** is `priceMinor: string` (paise as string, bigint-safe). Use `minorToRupees()` / `formatINR()` from `lib/api/config.ts` for display.

## What's removed

Backend owns these now and they are no longer in the frontend:
- Mongoose models, MongoDB connection, bcrypt
- Razorpay SDK + webhook verification
- AWS S3 SDK + presign logic
- Algolia search SDK
- Delhivery SDK + custom shipping logic
- Resend email SDK + templates
- PDF invoice / QR code generation
- All cron routes (`app/api/cron/*`), inventory, marketing, banners, blog, offers, testimonials, support, wallet, rewards, referral, analytics — these are in the backend now

## Tooling notes

- ESLint: `pnpm lint`
- Build: `pnpm build` (requires backend running for getStaticProps SSG fallbacks)
