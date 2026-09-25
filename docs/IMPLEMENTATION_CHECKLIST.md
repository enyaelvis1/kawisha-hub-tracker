# Kawisha Hub NG implementation checklist

**Scope:** the current lightweight product, stock, order, and public-store tracker  
**Snapshot:** 25 September 2026  
**Source of truth:** this file is the checklist used by the private `/progress` page.

## Status legend

- `[ ]` Not started
- `[~]` In progress, or live verification is still required
- `[p]` Partial
- `[x]` Complete for the current scope
- `[!]` Blocked; record the reason below the item

Items are only complete when the implementation and its relevant validation are documented. Live Supabase, Paystack, browser, role, and production checks must not be marked complete from code inspection alone.

## 01. Foundation and access

- [x] Keep the existing Next.js, TypeScript, Tailwind, and npm project setup
- [x] Document required Supabase and server-only environment variables
- [x] Provide Supabase Auth login, sign-up, confirmation, recovery, and password update routes
- [x] Scope live workspace reads and writes through business membership and RLS policies
- [x] Keep blank-environment demo mode available with a visible fictional-data notice
- [x] Document architecture, security, MVP scope, roadmap, and upstream attribution
- [~] Complete owner-controlled production deployment and environment setup

## 02. Private workspace shell

- [x] Provide the private workspace shell with shared page headers and content spacing
- [x] Keep navigation clearly separated into Overview, Products, Stock, Orders, Store, and Settings
- [x] Provide a desktop sidebar collapse/expand toggler
- [x] Provide mobile navigation with an overlay and close control
- [x] Show the current page title and demo/live workspace state
- [x] Keep keyboard focus states and semantic navigation labels visible
- [x] Add a lightweight project progress page without adding a second UI framework

## 03. Landing page and public store

- [x] Present a clear landing page for the Kawisha Hub NG product and order tracker
- [x] Use generated marketing imagery and restrained motion without inventing a new brand identity
- [x] Provide a public `/store` route for published products
- [x] Provide up to 50 clearly labelled fictional demo products
- [x] Use neutral demo product photography and live Supabase Storage product photos when available
- [x] Provide store search and category filtering
- [x] Respect the owner-controlled storefront publish setting
- [x] Keep the fallback product preview visible when a live product has no photo

## 04. Products, variants, and stock

- [x] Create products with a first variant, SKU, price, opening quantity, and low-stock threshold
- [x] Edit products and add additional variants
- [x] Upload product photos through the existing Supabase Storage boundary
- [x] Record restocks and manual stock corrections with a reason
- [x] Show current quantities, thresholds, low-stock alerts, and movement history
- [x] Keep product, stock, and order screens usable on narrow phone layouts
- [x] Prevent negative stock in demo actions and live database functions
- [x] Deduct stock once when an order is confirmed and restore it once when a confirmed order is cancelled

## 05. Orders, checkout, and customers

- [x] Record manual orders with customer, source, payment status, notes, and line items
- [x] Accept public-store orders through the existing checkout flow
- [x] Search, filter, inspect, and update order status and payment status
- [x] Show order details and totals using the captured line-item prices
- [x] Provide customer sign-up, login, and order history for public-store customers
- [x] Provide a browser cart and checkout review flow
- [x] Validate order quantities and stock before confirmation
- [~] Verify live Paystack initialization, callback, webhook, and reconciliation with owner credentials

## 06. Verification and handover

- [x] Run the repository typecheck
- [x] Run the repository lint check
- [x] Run the repository tests
- [x] Run the production build
- [x] Run `git diff --check` after changes
- [~] Complete a live Supabase role/RLS, Storage, storefront, and payment-provider walkthrough
- [~] Complete an owner-approved deployment and rollback handover

## 07. Deliberately deferred backlog

- [ ] Staff invitation and advanced role-management screens
- [ ] Multiple branches, warehouses, and supplier purchasing
- [ ] External WhatsApp, Instagram, marketplace, or POS imports
- [ ] Transactional notifications and messaging integrations
- [ ] Advanced analytics, campaign reporting, and customer segmentation
- [ ] Shipping and fulfilment-provider integrations
- [ ] Refund operations beyond the current payment boundaries
- [ ] Production deployment, domain, billing, and monitoring setup

## Updating this checklist

1. Change the marker when work starts or is completed.
2. Add a short note below an item when the status needs context.
3. Run the automated checks listed in `docs/README.md` before marking implementation complete.
4. Keep live-provider and production claims pending until the owner-approved manual scenario is finished.
5. Do not use the browser ticks on `/progress` as a replacement for updating this file.
