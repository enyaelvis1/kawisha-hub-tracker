import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import { demoData } from "../lib/demo-data";
import { applyStockDelta, calculateOrderTotalCents, canConfirmOrder } from "../lib/order-calculations";
import { buildWhatsAppMessage, buildWhatsAppUrl } from "../lib/whatsapp";

describe("order totals", () => {
  it("calculates totals from integer cents without floating point drift", () => {
    assert.equal(calculateOrderTotalCents([{ quantity: 3, unitPriceCents: 1999 }, { quantity: 2, unitPriceCents: 250 }]), 6497);
  });
});

describe("stock rules", () => {
  it("allows confirmation only when every line has enough stock", () => {
    assert.equal(canConfirmOrder([{ variantId: "a", quantity: 2 }, { variantId: "b", quantity: 1 }], new Map([["a", 2], ["b", 1]])), true);
    assert.equal(canConfirmOrder([{ variantId: "a", quantity: 3 }], new Map([["a", 2]])), false);
  });

  it("rejects negative stock and returns exact restoration values", () => {
    assert.equal(applyStockDelta(10, -4), 6);
    assert.throws(() => applyStockDelta(2, -3), /negative/);
  });
});

describe("database guardrails", () => {
  it("ships a 50-product demo catalogue for storefront review", () => {
    assert.equal(demoData.products.length, 50);
    assert.equal(new Set(demoData.products.map((product) => product.id)).size, 50);
    assert.ok(demoData.products.every((product) => product.variants.length > 0));
  });

  it("declares tenant RLS and one-time order movement constraints", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202609240001_initial_tracker.sql", import.meta.url), "utf8");
    assert.match(sql, /alter table public\.orders enable row level security/);
    assert.match(sql, /create policy orders_member_all/);
    assert.match(sql, /one_confirmed_movement_per_line/);
    assert.match(sql, /one_cancelled_movement_per_line/);
    assert.match(sql, /quantity_on_hand < line_row\.quantity/);
  });

  it("declares opt-in public catalog RLS", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202609240002_public_storefront.sql", import.meta.url), "utf8");
    assert.match(sql, /storefront_enabled boolean not null default false/);
    assert.match(sql, /create policy businesses_public_store_select/);
    assert.match(sql, /create policy products_public_store_select/);
    assert.match(sql, /create policy variants_public_store_select/);
    assert.match(sql, /to anon, authenticated/);
  });

  it("declares product media, customer order, and payment reconciliation guardrails", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202609240003_store_checkout.sql", import.meta.url), "utf8");
    assert.match(sql, /add column if not exists image_path text/);
    assert.match(sql, /create policy product_images_member_insert/);
    assert.match(sql, /create policy orders_customer_select/);
    assert.match(sql, /create or replace function public\.create_public_order/);
    assert.match(sql, /create or replace function public\.complete_public_payment/);
    assert.match(sql, /grant execute on function public\.complete_public_payment\(text\) to service_role/);
  });

  it("declares a validated WhatsApp request inbox without public reads", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202609250004_whatsapp_order_inbox.sql", import.meta.url), "utf8");
    assert.match(sql, /create table public\.whatsapp_order_requests/);
    assert.match(sql, /create or replace function public\.create_whatsapp_order_request/);
    assert.match(sql, /grant execute on function public\.create_whatsapp_order_request\(uuid, text, text, text, text, text, jsonb\) to anon, authenticated/);
    assert.match(sql, /create policy whatsapp_requests_member_select/);
    assert.match(sql, /create policy whatsapp_requests_member_update/);
    assert.match(sql, /does not have enough stock/);
  });

  it("declares an owner-controlled checkout method with Paystack as the default", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202609250005_checkout_method.sql", import.meta.url), "utf8");
    assert.match(sql, /add column if not exists checkout_method text not null default 'paystack'/);
    assert.match(sql, /checkout_method in \('paystack', 'whatsapp'\)/);
  });

  it("declares an owner-managed WhatsApp number without exposing a public destination", () => {
    const sql = readFileSync(new URL("../supabase/migrations/202609250006_business_whatsapp_number.sql", import.meta.url), "utf8");
    assert.match(sql, /add column if not exists whatsapp_number text not null default ''/);
    assert.match(sql, /whatsapp_number ~ '\^\[0-9\]\*\$'/);
  });

  it("builds a pre-filled WhatsApp order message", () => {
    const message = buildWhatsAppMessage({
      businessName: "Kawisha Hub NG",
      requestNumber: "KH-WA-001",
      customerName: "A shopper",
      customerPhone: "0800 000 0000",
      deliveryAddress: "Lagos",
      note: "Call first",
      lines: [{ variantId: "variant-1", productName: "Tote", variantName: "Natural", sku: "TOTE-1", quantity: 2, unitPriceCents: 100000 }],
      totalCents: 200000,
      currencyCode: "NGN",
    });
    assert.match(message, /KH-WA-001/);
    assert.match(message, /2 × Tote/);
    assert.match(buildWhatsAppUrl("+234 800 000 0000", message), /^https:\/\/wa\.me\/2348000000000\?text=/);
  });
});
