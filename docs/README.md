# Kawisha Hub NG project guide

Kawisha Hub NG is a small private workspace for products, stock, and orders, with an optional public storefront.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. With blank Supabase variables, the app runs in clearly labelled demo mode. Demo data is fictional, changes are temporary, and the storefront contains 50 sample products.

Useful routes:

- `/` — landing page
- `/store` — public storefront
- `/dashboard` — private operations overview
- `/products` — product and variant management
- `/stock` — stock adjustments and movement history
- `/orders` — order management
- `/inbox` — WhatsApp order requests from the public store
- `/settings` — business and storefront settings
- `/account` — customer account and order history

## Live setup

Copy `.env.example` to `.env.local` and add the owner-managed Supabase values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_WHATSAPP_NUMBER=2348012345678
```

Apply the migrations in `supabase/migrations/` in filename order. Create or invite the owner through Supabase Auth, then run the documented `bootstrap_business('Kawisha Hub NG', 'NGN')` setup function from an approved signed-in setup flow.

Product photos use Supabase Storage. WhatsApp order requests additionally require the public business number in international digits-only format. Public checkout additionally requires server-only `SUPABASE_SERVICE_ROLE_KEY`, `PAYSTACK_SECRET_KEY`, and `NEXT_PUBLIC_SITE_URL`. Never expose or commit either secret.

## Operating notes

- The private workspace is business-member scoped through Supabase RLS.
- The public store shows only active products and variants after the owner publishes it.
- Customer checkout requires a customer Auth account.
- Shoppers can send a cart through the public store’s WhatsApp handoff without creating an account; the request appears in the private `/inbox` view before the pre-filled WhatsApp chat opens.
- WhatsApp requests are enquiries, not confirmed orders: the owner should reply, confirm availability/payment, and record or convert the order through the existing order workflow.
- Demo checkout never charges a card or saves an order.
- Online payment reconciliation is disabled until Paystack is configured.
- The fallback product icon is used only when a live product has no uploaded photo.

## Checks

```bash
npm run typecheck
npm run lint
npm test
npm run build
git diff --check
```

## More detail

- [Architecture](./ARCHITECTURE.md) — runtime and data flow
- [Security](./SECURITY.md) — ownership, RLS, storage, and payment boundaries
- [MVP plan](./MVP_PLAN.md) — scope and product boundaries
- [Roadmap](./ROADMAP.md) — intentionally small follow-up batches
- [Implementation checklist](./IMPLEMENTATION_CHECKLIST.md) — scoped work and deferred items
- [Project progress tracker](./PROJECT_PROGRESS_TRACKER.md) — how the private `/progress` review page works
- [Upstream references](./UPSTREAM.md) — inspected templates and MIT attribution context
