import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

type CheckoutBody = {
  businessId?: unknown;
  customerName?: unknown;
  customerEmail?: unknown;
  customerPhone?: unknown;
  shippingAddress?: unknown;
  lines?: unknown;
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: Request) {
  if (!hasEnvVars) return NextResponse.json({ error: "Live checkout is not enabled in demo mode." }, { status: 400 });

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) return NextResponse.json({ error: "Payment checkout is not configured yet." }, { status: 503 });

  let body: CheckoutBody;
  try {
    body = await request.json() as CheckoutBody;
  } catch {
    return NextResponse.json({ error: "Checkout details were not valid." }, { status: 400 });
  }

  const businessId = textValue(body.businessId);
  const customerName = textValue(body.customerName);
  const customerEmail = textValue(body.customerEmail).toLowerCase();
  const customerPhone = textValue(body.customerPhone);
  const shippingAddress = textValue(body.shippingAddress);
  const rawLines = Array.isArray(body.lines) ? body.lines : [];
  const lines = rawLines.map((line) => {
    if (!line || typeof line !== "object") return null;
    const candidate = line as { variantId?: unknown; quantity?: unknown };
    const variantId = textValue(candidate.variantId);
    const quantity = Number(candidate.quantity);
    return variantId && Number.isInteger(quantity) && quantity > 0 && quantity <= 999 ? { variant_id: variantId, quantity } : null;
  });

  if (!businessId || !customerName || !/^\S+@\S+\.\S+$/.test(customerEmail) || !customerPhone || !shippingAddress || !lines.length || lines.some((line) => !line) || lines.length > 50) {
    return NextResponse.json({ error: "Enter your name, email, phone, delivery address, and at least one valid item." }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) return NextResponse.json({ error: "Could not verify your account." }, { status: 401 });
  if (!userData.user) return NextResponse.json({ error: "Sign in before checking out." }, { status: 401 });

  const { data: orderData, error: orderError } = await supabase.rpc("create_public_order", {
    p_business_id: businessId,
    p_customer_name: customerName,
    p_customer_email: customerEmail,
    p_customer_phone: customerPhone,
    p_shipping_address: shippingAddress,
    p_lines: lines,
  });
  if (orderError) return NextResponse.json({ error: orderError.message }, { status: 400 });

  const order = Array.isArray(orderData) ? orderData[0] : orderData;
  if (!order?.order_id || !order.order_number || !order.total_amount) return NextResponse.json({ error: "Could not create the order." }, { status: 500 });

  const reference = `${order.order_number}-${crypto.randomUUID().replaceAll("-", "").slice(0, 10)}`;
  const { error: referenceError } = await supabase.rpc("set_public_payment_reference", {
    p_order_id: order.order_id,
    p_reference: reference,
  });
  if (referenceError) return NextResponse.json({ error: "Could not prepare the payment." }, { status: 500 });

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || new URL(request.url).origin;
  const callbackUrl = new URL("/api/payments/paystack/callback", siteUrl).toString();
  const paystackResponse = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: { Authorization: `Bearer ${secretKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      email: customerEmail,
      amount: String(Math.round(Number(order.total_amount) * 100)),
      currency: "NGN",
      reference,
      callback_url: callbackUrl,
      metadata: { order_id: order.order_id, order_number: order.order_number },
    }),
  });
  const paystackResult = await paystackResponse.json() as { status?: boolean; data?: { authorization_url?: string } };
  if (!paystackResponse.ok || !paystackResult.status || !paystackResult.data?.authorization_url) {
    return NextResponse.json({ error: "Payment could not be started. Please try again." }, { status: 502 });
  }

  return NextResponse.json({ authorizationUrl: paystackResult.data.authorization_url, reference });
}
