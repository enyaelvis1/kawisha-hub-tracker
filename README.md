# Kawisha Hub NG tracker

Private operations app for tracking products, stock, and customer orders recorded by Kawisha Hub NG staff, with an optional public storefront at `/store`.

The storefront supports product photos, a browser cart, authenticated customer accounts, and an optional Paystack checkout. The private workspace remains the source of truth for products, stock, and fulfilment status.

## Local setup

Requirements: Node.js 20+, npm, and (for live data) a Supabase project owned by the business.

```bash
npm install
npm run dev
```

Open `http://localhost:3000` for the product overview, `/store` for the public catalog, or select “Open the tracker” to enter the private workspace at `/dashboard`. With blank Supabase variables, the app opens in clearly labelled fictional demo mode. Demo changes are not saved. The demo fixtures are placeholders and must not be treated as Kawisha Hub NG’s real business results.

For a live workspace, copy `.env.example` to `.env.local` and add the project URL and publishable/anon key:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
PAYSTACK_SECRET_KEY=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Apply the migrations in `supabase/migrations/` in filename order to a local Supabase instance or to the owner’s Supabase SQL editor. This task does not create or connect to a remote project. After an owner creates a private Auth account through an approved setup flow, call `bootstrap_business('Kawisha Hub NG', 'NGN')` from a signed-in setup client, or use a controlled SQL setup process to insert the business and owner membership using that Auth user’s UUID. The owner can then publish the storefront from Settings. For live checkout, set `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, and the public site URL only in the server environment; never expose either secret to the client or commit them.

## Scripts

- `npm run dev` — local development server
- `npm run typecheck` — TypeScript check without emit
- `npm run lint` — ESLint
- `npm test` — order and schema unit tests
- `npm run build` — production build

## Honest feature status

Completed in this milestone: private login route, demo mode with a 50-product sample catalogue, public storefront, owner-controlled storefront publishing, generated demo product photography, live product photo uploads with Storage RLS, product and first-variant creation, search/category filtering, browser cart, customer sign-up/login and order history, Paystack initialization/verification/webhook reconciliation, stock dashboard and movement history, manual customer orders, online order ingestion, order filters/detail/status/payment updates, atomic confirmation stock deduction, atomic cancellation stock restoration, configurable business name/currency, RLS migrations, and documentation.

Deferred: staff invitations UI, complex roles, branches/warehouses, supplier purchasing, external channel imports, notifications, analytics beyond basic summaries, fulfilment/shipping integrations, and deployment. Paystack checkout is intentionally disabled until the owner supplies live credentials and completes payment-provider configuration.

Production Supabase and Vercel accounts, billing, domains, and credentials must be owned and supplied by the business owner. They are intentionally not created or committed here.

## Project documentation

Start with [`docs/README.md`](docs/README.md) for the short setup and operating guide. See `docs/ARCHITECTURE.md` for runtime and data flow, `docs/SECURITY.md` for the ownership model and RLS notes, and `docs/UPSTREAM.md` for the inspected starter and MIT-licensed reference repositories.
