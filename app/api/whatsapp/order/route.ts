import { NextResponse } from "next/server";

import { buildWhatsAppMessage, buildWhatsAppUrl, normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

type WhatsAppOrderBody = {
  businessId?: unknown;
  customerName?: unknown;
  customerPhone?: unknown;
  customerEmail?: unknown;
  deliveryAddress?: unknown;
  note?: unknown;
  lines?: unknown;
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (!hasEnvVars) return NextResponse.json({ error: "WhatsApp ordering is available after live Supabase setup." }, { status: 400 });

  const whatsappNumber = normalizeWhatsAppNumber(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");
  if (!whatsappNumber) return NextResponse.json({ error: "WhatsApp ordering is not configured yet. Add the business WhatsApp number first." }, { status: 503 });

  let body: WhatsAppOrderBody;
  try {
    body = await request.json() as WhatsAppOrderBody;
  } catch {
    return NextResponse.json({ error: "Order details were not valid." }, { status: 400 });
  }

  const businessId = textValue(body.businessId);
  const customerName = textValue(body.customerName);
  const customerPhone = textValue(body.customerPhone);
  const customerEmail = textValue(body.customerEmail).toLowerCase();
  const deliveryAddress = textValue(body.deliveryAddress);
  const note = textValue(body.note);
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  const lines = rawLines.map((line) => {
    if (!line || typeof line !== "object") return null;
    const candidate = line as { variantId?: unknown; quantity?: unknown };
    const variantId = textValue(candidate.variantId);
    const quantity = Number(candidate.quantity);
    return variantId && Number.isInteger(quantity) && quantity > 0 && quantity <= 999 ? { variant_id: variantId, quantity } : null;
  });

  if (!businessId || !customerName || customerName.length > 160 || !customerPhone || customerPhone.length > 40 || (customerEmail && !/^\S+@\S+\.\S+$/.test(customerEmail)) || deliveryAddress.length > 500 || note.length > 500 || !lines.length || lines.some((line) => !line) || lines.length > 50) {
    return NextResponse.json({ error: "Enter your name, WhatsApp number, and at least one valid item." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("name,currency_code,checkout_method")
    .eq("id", businessId)
    .eq("storefront_enabled", true)
    .maybeSingle();
  if (businessError) return NextResponse.json({ error: "Could not load the storefront." }, { status: 500 });
  if (!business) return NextResponse.json({ error: "This storefront is not available." }, { status: 400 });
  if (business.checkout_method !== "whatsapp") return NextResponse.json({ error: "WhatsApp checkout is not enabled for this store." }, { status: 409 });

  const { data: requestData, error: requestError } = await supabase.rpc("create_whatsapp_order_request", {
    p_business_id: businessId,
    p_customer_name: customerName,
    p_customer_phone: customerPhone,
    p_customer_email: customerEmail,
    p_delivery_address: deliveryAddress,
    p_note: note,
    p_lines: lines,
  });
  if (requestError) return NextResponse.json({ error: requestError.message }, { status: 400 });

  const savedRequest = Array.isArray(requestData) ? requestData[0] : requestData;
  if (!savedRequest?.request_id || !savedRequest.request_number || savedRequest.total_amount === null || savedRequest.total_amount === undefined || !Array.isArray(savedRequest.line_items)) {
    return NextResponse.json({ error: "Could not save the WhatsApp order request." }, { status: 500 });
  }

  const linesForMessage = savedRequest.line_items.flatMap((line: unknown) => {
    if (!line || typeof line !== "object") return [];
    const item = line as Record<string, unknown>;
    if (typeof item.variant_id !== "string" || typeof item.product_name !== "string" || typeof item.variant_name !== "string" || typeof item.sku !== "string") return [];
    return [{
      variantId: item.variant_id,
      productName: item.product_name,
      variantName: item.variant_name,
      sku: item.sku,
      quantity: Number(item.quantity),
      unitPriceCents: Math.round(Number(item.unit_price) * 100),
    }];
  });
  const totalCents = Math.round(Number(savedRequest.total_amount) * 100);
  const message = buildWhatsAppMessage({ businessName: business.name, requestNumber: savedRequest.request_number, customerName, customerPhone, deliveryAddress, note, lines: linesForMessage, totalCents, currencyCode: business.currency_code });

  return NextResponse.json({ requestNumber: savedRequest.request_number, totalCents, whatsappUrl: buildWhatsAppUrl(whatsappNumber, message) });
}
