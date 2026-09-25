"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cartTotalCents, parseStoreCart, STORE_CART_KEY, type StoreCartLine } from "@/lib/store-cart";
import type { PublicStoreSnapshot } from "@/lib/types";

export function StoreCheckout({ snapshot, userEmail }: { snapshot: PublicStoreSnapshot; userEmail: string }) {
  const [cart, setCart] = useState<StoreCartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState(userEmail);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      setCart(parseStoreCart(window.localStorage.getItem(STORE_CART_KEY)));
    } catch {
      setCart([]);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (userEmail) setEmail(userEmail);
  }, [userEmail]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORE_CART_KEY, JSON.stringify(cart));
    } catch {
      // Checkout remains usable when storage is unavailable or full.
    }
  }, [cart, hydrated]);

  const total = useMemo(() => cartTotalCents(cart), [cart]);

  function changeQuantity(line: StoreCartLine, delta: number) {
    const available = snapshot.data.products.flatMap((product) => product.variants).find((variant) => variant.id === line.variantId)?.stock ?? line.quantity;
    setCart((current) => current.flatMap((item) => {
      if (item.variantId !== line.variantId) return [item];
      const quantity = Math.min(item.quantity + delta, available);
      return quantity > 0 ? [{ ...item, quantity }] : [];
    }));
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!cart.length) return setError("Your cart is empty.");
    setLoading(true);
    try {
      if (snapshot.mode === "demo") {
        window.localStorage.removeItem(STORE_CART_KEY);
        setCart([]);
        setSuccess("Demo order captured. No payment was processed and nothing was saved.");
        return;
      }
      const response = await fetch("/api/payments/paystack/initialize", { body: JSON.stringify({ businessId: snapshot.data.businessId, customerName: name, customerEmail: email, customerPhone: phone, shippingAddress: address, lines: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity })) }), headers: { "Content-Type": "application/json" }, method: "POST" });
      const result = await response.json() as { authorizationUrl?: string; error?: string };
      if (!response.ok || !result.authorizationUrl) throw new Error(result.error ?? "Could not start payment.");
      window.location.assign(result.authorizationUrl);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not start checkout.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-muted/30 text-foreground">
      <header className="border-b bg-background"><div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4"><Link className="inline-flex items-center gap-2 text-sm font-semibold" href="/store"><ArrowLeft aria-hidden="true" className="size-4" /> Back to store</Link><Link className="text-sm text-muted-foreground hover:text-foreground" href="/account">Your account</Link></div></header>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:py-16">
        <div className="grid gap-6 lg:grid-cols-[1fr_390px] lg:items-start">
          <Card className="p-5 shadow-sm sm:p-7">
            <div className="flex items-start gap-3 border-b pb-5"><span className="flex size-10 items-center justify-center rounded-xl bg-muted"><ShoppingBag aria-hidden="true" className="size-5" /></span><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Checkout</p><h1 className="mt-1 text-2xl font-semibold tracking-tight">Complete your order</h1><p className="mt-1 text-sm text-muted-foreground">Your account keeps the order history private and accessible to you.</p></div></div>
            <form className="mt-6 space-y-5" onSubmit={submit}><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-2 text-sm font-medium">Full name<Input autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} /></label><label className="grid gap-2 text-sm font-medium">Phone number<Input autoComplete="tel" onChange={(event) => setPhone(event.target.value)} required value={phone} /></label></div><label className="grid gap-2 text-sm font-medium">Email<Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></label><label className="grid gap-2 text-sm font-medium">Delivery address<textarea className="min-h-28 rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setAddress(event.target.value)} placeholder="Where should we deliver this order?" required value={address} /></label>{snapshot.mode === "demo" ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-sm leading-5 text-amber-900">Demo checkout only. This will not charge a card or create a saved order.</p> : <p className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm leading-5 text-muted-foreground">You will be redirected to Paystack to complete payment securely. The secret payment key stays on the server.</p>}{error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">{error}</p> : null}{success ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm text-emerald-800">{success}</p> : null}<Button className="w-full" disabled={loading || !cart.length} size="lg" type="submit">{loading ? "Starting secure checkout…" : snapshot.mode === "demo" ? "Place demo order" : "Continue to Paystack"}<ArrowRight aria-hidden="true" /></Button></form>
          </Card>

          <Card className="p-5 shadow-sm lg:sticky lg:top-6"><div className="flex items-center justify-between gap-3 border-b pb-4"><h2 className="font-semibold">Order summary</h2><span className="text-xs text-muted-foreground">{cart.length} lines</span></div>{cart.length ? <div className="divide-y">{cart.map((line) => <div className="py-4 first:pt-0 last:pb-0" key={line.variantId}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{line.productName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{line.variantName}</p></div><button aria-label={`Remove ${line.productName}`} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setCart((current) => current.filter((item) => item.variantId !== line.variantId))} type="button"><Trash2 aria-hidden="true" className="size-4" /></button></div><div className="mt-3 flex items-center justify-between gap-3"><span className="text-sm font-medium tabular-nums">{formatCurrency(line.unitPriceCents * line.quantity, snapshot.data.currencyCode)}</span><div className="flex items-center gap-1 rounded-lg border"><Button aria-label={`Decrease ${line.productName} quantity`} onClick={() => changeQuantity(line, -1)} size="icon" variant="ghost"><Minus aria-hidden="true" /></Button><span className="w-7 text-center text-sm tabular-nums">{line.quantity}</span><Button aria-label={`Increase ${line.productName} quantity`} onClick={() => changeQuantity(line, 1)} size="icon" variant="ghost"><Plus aria-hidden="true" /></Button></div></div></div>)}</div> : <p className="py-8 text-sm text-muted-foreground">Your cart is empty. <Link className="font-medium text-foreground underline underline-offset-4" href="/store">Browse the store.</Link></p>}<div className="mt-5 flex items-center justify-between gap-3 border-t pt-4"><span className="text-sm text-muted-foreground">Total</span><span className="text-xl font-semibold tabular-nums">{formatCurrency(total, snapshot.data.currencyCode)}</span></div></Card>
        </div>
      </main>
    </div>
  );
}
