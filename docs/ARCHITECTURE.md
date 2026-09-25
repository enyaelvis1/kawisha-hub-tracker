# Architecture

## Runtime shape

- Next.js App Router with the official `with-supabase` starter’s cookie-based Supabase SSR helpers.
- `app/(app)/layout.tsx` is the private workspace boundary. It checks the signed-in user when Supabase variables exist, loads the live snapshot, then renders the client workspace provider and shell.
- When both Supabase variables are blank, `lib/data.ts` returns fictional demo data. This is the only demo fallback. Live Supabase query errors throw and are not silently replaced by fixtures.
- `app/store/page.tsx` is a public server-rendered route. In demo mode it uses the clearly labelled sample catalog; in live mode it reads only from businesses with `storefront_enabled = true` through the public read-only RLS policies.
- `/store` hydrates a versioned browser cart. Checkout requires a customer Auth session, creates a business-scoped online order through `create_public_order`, and redirects to Paystack when server credentials are configured.
- Product photos use the public `product-images` Storage bucket for reads; authenticated business members upload through a server action with file type/size validation and business-scoped Storage RLS.
- Paystack callbacks verify the transaction server-side, while signed `charge.success` webhooks call the service-role-only reconciliation function. Successful payment deducts stock atomically or leaves a paid order flagged for owner review when stock is insufficient.
- The UI is a small responsive shell with a desktop sidebar and a mobile navigation drawer. It uses the starter’s Tailwind/shadcn foundation and Lucide icons already present in the starter.

## Data flow

1. A page reads the workspace snapshot through `useWorkspace()`.
2. In demo mode, mutations update an in-memory client snapshot and are labelled as temporary.
3. In live mode, client forms call authenticated server actions in `app/(app)/actions.ts`; those actions use the server Supabase client and revalidate affected routes.
4. The database remains the authority for tenant ownership, SKU uniqueness, monetary numeric values, stock availability, and order state transitions.

The public store reads active products, active variants, category labels, and optional public product photo URLs. It does not expose customer, payment, or stock-movement data. Customer order history is visible only to the matching Auth user; workspace staff see the online order through the normal business-scoped order view.

## Manual order workflow

`new → confirmed → ready → completed` is the happy path. A staff member records the customer, source, payment status, line items, and captured prices. Confirming an order calls the `confirm_order` database function, which locks the order and variants, verifies availability, deducts stock, writes one `order_confirmed` movement per line, and updates the order in one transaction. A cancellation calls `cancel_order`; it restores stock only when a confirmation movement exists and the unique movement index prevents a second restore.

Order sources are labels entered by staff or assigned by checkout: WhatsApp, Instagram, phone, in person, online store, or other. Online store payment is verified through the Paystack server callback/webhook path when enabled.

## Money and stock

PostgreSQL stores `numeric(12,2)` for prices and recomputes the stored order `total_amount` from order lines with a database trigger. The browser represents prices as integer cents for demo calculations and formats through `lib/format.ts`; it does not add uncontrolled floating-point amounts. Stock is integer quantity and every non-zero change has a movement type, reason, and actor.
