import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Order received · Kawisha Hub NG" };
export const instant = false;

export default async function StoreCheckoutSuccessPage({ searchParams }: { searchParams: Promise<{ reference?: string }> }) {
  const params = await searchParams;
  return <main className="flex min-h-svh items-center justify-center bg-muted/30 p-6"><div className="w-full max-w-lg rounded-2xl border bg-card p-7 text-center shadow-sm"><div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">✓</div><p className="mt-6 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">Payment submitted</p><h1 className="mt-3 text-3xl font-semibold tracking-tight">Thanks for your order.</h1><p className="mt-3 text-sm leading-6 text-muted-foreground">Your payment is being confirmed securely. {params.reference ? `Reference: ${params.reference}` : ""} You can review the order from your customer account once confirmation is complete.</p><div className="mt-7 flex flex-col gap-2 sm:flex-row sm:justify-center"><Button asChild><Link href="/account">View account</Link></Button><Button asChild variant="outline"><Link href="/store">Continue browsing</Link></Button></div></div></main>;
}
