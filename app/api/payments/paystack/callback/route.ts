import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference")?.trim();
  const checkoutUrl = new URL("/store/checkout", request.url);
  if (!reference) {
    checkoutUrl.searchParams.set("error", "missing_reference");
    return NextResponse.redirect(checkoutUrl);
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    checkoutUrl.searchParams.set("error", "payment_not_configured");
    return NextResponse.redirect(checkoutUrl);
  }

  const response = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });
  const result = await response.json() as { status?: boolean; data?: { status?: string } };
  if (!response.ok || !result.status || result.data?.status !== "success") {
    checkoutUrl.searchParams.set("error", "payment_not_confirmed");
    return NextResponse.redirect(checkoutUrl);
  }

  try {
    const admin = createAdminClient();
    const { error } = await admin.rpc("complete_public_payment", { p_reference: reference });
    if (error) throw error;
  } catch {
    // The webhook remains the source of truth and can complete this payment asynchronously.
  }

  const successUrl = new URL("/store/checkout/success", request.url);
  successUrl.searchParams.set("reference", reference);
  return NextResponse.redirect(successUrl);
}
