import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CustomerLogoutButton } from "@/components/customer-logout-button";
import { Button } from "@/components/ui/button";
import { getCustomerOrderSummaries } from "@/lib/data";
import { hasEnvVars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const metadata: Metadata = { title: "Customer account · Kawisha Hub NG" };
export const instant = false;

export default async function CustomerAccountPage() {
  if (!hasEnvVars) return <div className="flex min-h-svh items-center justify-center p-6"><div className="max-w-md text-center"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Demo mode</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Customer accounts activate with live Supabase.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">The demo store supports a temporary checkout preview without saving account or payment data.</p><Button asChild className="mt-6"><Link href="/store">Back to store</Link></Button></div></div>;
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/account/login");
  const orders = await getCustomerOrderSummaries();
  return <div className="min-h-svh bg-muted/30 p-6"><div className="mx-auto max-w-3xl"><div className="flex items-center justify-between gap-4"><div><Link className="text-sm text-muted-foreground hover:text-foreground" href="/store">← Store</Link><h1 className="mt-3 text-3xl font-semibold tracking-tight">Your account</h1><p className="mt-2 text-sm text-muted-foreground">{data.user.email}</p></div><CustomerLogoutButton /></div><section className="mt-8 rounded-xl border bg-card p-5 shadow-sm"><h2 className="font-semibold">Order history</h2>{orders.length ? <div className="mt-4 divide-y">{orders.map((order) => <div className="flex flex-wrap items-center justify-between gap-3 py-4 first:pt-0 last:pb-0" key={order.id}><div><p className="font-medium">{order.orderNumber}</p><p className="mt-1 text-xs text-muted-foreground">{new Intl.DateTimeFormat("en-NG", { dateStyle: "medium" }).format(new Date(order.createdAt))}</p></div><div className="text-right"><p className="font-semibold tabular-nums">{order.total}</p><p className="mt-1 text-xs capitalize text-muted-foreground">{order.paymentStatus} · {order.status}</p></div></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">Your paid store orders will appear here.</p>}</section></div></div>;
}
