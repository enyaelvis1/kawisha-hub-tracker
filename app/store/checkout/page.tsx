import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { StoreCheckout } from "@/components/store-checkout";
import { getPublicStoreSnapshot } from "@/lib/data";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

export const metadata: Metadata = { title: "Checkout · Kawisha Hub NG" };
export const instant = false;

export default async function StoreCheckoutPage() {
  let userEmail = "";
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/account/login?next=/store/checkout");
    userEmail = data.user.email ?? "";
  }
  return <StoreCheckout snapshot={await getPublicStoreSnapshot()} userEmail={userEmail} />;
}
