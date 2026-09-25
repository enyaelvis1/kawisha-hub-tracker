# Security and data ownership

## Business scoping

Every tenant-owned row carries `business_id`. Products reference categories and variants through composite `(business_id, id)` foreign keys. Order lines reference both an order and a variant through the same composite scope. Stock movements carry the business, variant, and optional order/order-line references. This prevents a user from joining records from another business by guessing a UUID.

`business_members` maps a Supabase Auth user to a business and keeps an extensible `owner`/`staff` role field without building a full role-management product. The `is_business_member` security-definer helper is used by RLS policies and the transactional functions.

## RLS policies

RLS is enabled on `businesses`, `business_members`, `categories`, `products`, `product_variants`, `orders`, `order_lines`, `stock_movements`, and `whatsapp_order_requests`.

- A signed-in user can select a business only if they are a member.
- Only an owner can update business name and currency settings.
- A user can select their own membership or memberships in a business they already belong to.
- Categories, products, variants, orders, order lines, and movements are accessible only when `is_business_member(business_id)` is true.
- A business can opt into the public storefront with `businesses.storefront_enabled`. Public policies expose only that business’s active products, active variants, category names, and product image metadata; orders, order lines, stock movements, and customer data remain private.
- Composite foreign keys and `with check` policies protect inserts and updates from cross-business references.
- Product images use a public read bucket, but uploads and deletes are restricted to authenticated members whose first storage path segment is their business ID. The app validates image type and size before upload.
- Public orders require an authenticated customer account. A security-definer function validates the published business, active products, variant quantities, customer details, and business scope before inserting order lines.
- WhatsApp order requests are created through a public security-definer function that validates the published business, active products, current prices, quantities, and contact fields before saving a business-scoped request. Public users cannot read the inbox; only authenticated business members can select or update it. Requests do not reserve stock or mark payment as complete.
- Paystack initialization and verification run on the server. `PAYSTACK_SECRET_KEY` and `SUPABASE_SERVICE_ROLE_KEY` are server-only secrets and must never be exposed in client code or committed to source control. Paystack webhook requests are accepted only after HMAC SHA-512 signature verification.
- The owner-controlled `businesses.checkout_method` setting defaults to `paystack` and is constrained to `paystack` or `whatsapp`. Public checkout APIs verify that the requested path matches this setting before creating a request or payment.
- The owner-controlled `businesses.whatsapp_number` is stored as digits-only business configuration, is writable through the owner-protected settings path, and is used server-side to build WhatsApp links. It is not accepted from the public request as a destination.
- The service-role key is used only by the payment webhook/callback reconciliation path; it is not exposed to the workspace or customer browser.

The migration intentionally avoids public registration. `bootstrap_business` is an authenticated, security-definer setup function that creates one business and owner membership for a user who does not already belong to a business. The business owner should control how the initial Auth account is created/invited and when this function is run.

The public storefront migration does not grant anonymous writes or expose inventory history. The WhatsApp migration grants only execution of the narrowly validated request function to public roles; it does not grant anonymous table reads or updates. Publishing is controlled from the authenticated settings screen. Customer order history is scoped to the customer Auth user, while workspace order and inbox visibility remains business-member scoped.

## Stock invariants

`quantity_on_hand` has a non-negative check constraint. `record_stock_movement`, `confirm_order`, and `cancel_order` lock the relevant rows before changing them. Confirmation is idempotent for an already confirmed/ready/completed order, cancellation is idempotent for an already cancelled order, and partial unique indexes permit at most one confirmation and one cancellation movement per order line.

## Local verification

The Supabase CLI `2.95.4` and Docker were available. `supabase init` completed, but `supabase start` did not finish pulling the local Postgres image during validation (`public.ecr.aws/supabase/postgres:17.6.1.106`, interrupted while downloading), so live RLS execution tests are not claimed as passing. No remote project was linked. The migration is included for local execution and the automated tests assert its required RLS/index declarations are present.
