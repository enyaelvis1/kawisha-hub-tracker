# Kawisha Hub NG tracker — MVP plan

## Goal

Ship a small private operations workspace for products, variants, stock movements, and manually recorded customer orders, plus an optional public storefront with product photos, customer accounts, cart, and Paystack checkout.

## Build sequence

1. Start from the official `with-supabase` Next.js App Router template and keep its cookie-based server auth helpers.
2. Replace the public starter landing page with a private workspace shell. When Supabase variables are absent, expose an unmistakably labelled fictional demo mode so the interface can be reviewed locally.
3. Add a tenant-aware PostgreSQL migration with business membership, products, variants, orders, order lines, and stock movements. Enforce business-scoped foreign keys, RLS, and atomic RPCs for stock adjustments, order confirmation, and cancellation.
4. Build the dashboard, products, stock history, orders, and settings screens with responsive navigation, accessible forms, useful empty states, and NGN formatting centralized in one utility.
5. Add unit tests for decimal-safe order totals and the stock state-machine rules. Run typecheck, lint, tests, production build, and `git diff --check`.

## Deliberate MVP boundaries

- No public owner registration, supplier procurement, automated messaging, or complex staff/branch roles.
- Customer registration is limited to the storefront account flow. Paystack checkout remains disabled until the owner configures live provider credentials and verifies the deployment environment.
- The app reads real business data only after Supabase is configured and a signed-in user is a member of a business. A real database error is never replaced with demo fixtures.
