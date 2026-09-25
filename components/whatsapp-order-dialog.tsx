"use client";

import { useEffect, useMemo, useState } from "react";
import { LoaderCircle, MessageCircle, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cartTotalCents, type StoreCartLine } from "@/lib/store-cart";
import { formatCurrency } from "@/lib/format";
import type { PublicStoreSnapshot } from "@/lib/types";

export function WhatsAppOrderDialog({
  open,
  onOpenChange,
  snapshot,
  cart,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  snapshot: PublicStoreSnapshot;
  cart: StoreCartLine[];
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [whatsappUrl, setWhatsappUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const total = useMemo(() => cartTotalCents(cart), [cart]);

  useEffect(() => {
    if (!open) {
      setError("");
      setSuccess("");
      setWhatsappUrl("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onOpenChange, open]);

  if (!open) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSuccess("");
    if (!cart.length) {
      setError("Add at least one product before sending an order.");
      return;
    }
    if (snapshot.mode === "demo") {
      setSuccess("Demo preview only. Connect Supabase and add the business WhatsApp number to send real requests to the owner inbox.");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/whatsapp/order", {
        body: JSON.stringify({
          businessId: snapshot.data.businessId,
          customerName: name,
          customerPhone: phone,
          customerEmail: email,
          deliveryAddress: address,
          note,
          lines: cart.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
        }),
        headers: { "Content-Type": "application/json" },
        method: "POST",
      });
      const result = await response.json() as { requestNumber?: string; whatsappUrl?: string; error?: string };
      if (!response.ok || !result.requestNumber || !result.whatsappUrl) throw new Error(result.error ?? "Could not prepare the WhatsApp order.");
      setWhatsappUrl(result.whatsappUrl);
      setSuccess(`Request ${result.requestNumber} was saved. WhatsApp is ready with your order details—tap Send in the chat to finish.`);
      window.open(result.whatsappUrl, "_blank", "noopener,noreferrer");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not prepare the WhatsApp order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div aria-labelledby="whatsapp-order-title" aria-modal="true" className="fixed inset-0 z-[60] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) onOpenChange(false); }} role="dialog">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-2xl border bg-card p-5 shadow-2xl sm:rounded-2xl sm:p-6">
        <div className="flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-700"><MessageCircle aria-hidden="true" className="size-5" /><p className="text-xs font-bold uppercase tracking-[0.16em]">WhatsApp order</p></div>
            <h2 className="mt-2 text-xl font-semibold tracking-tight" id="whatsapp-order-title">Send your cart to the owner</h2>
            <p className="mt-1 text-sm leading-5 text-muted-foreground">Your request is saved in the owner inbox first, then WhatsApp opens with a pre-filled message.</p>
          </div>
          <Button aria-label="Close WhatsApp order dialog" onClick={() => onOpenChange(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button>
        </div>

        <div className="mt-4 rounded-xl border bg-muted/35 px-3 py-2.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between gap-3"><span>{cart.length} {cart.length === 1 ? "item" : "items"} in your request</span><span className="font-bold text-foreground">{formatCurrency(total, snapshot.data.currencyCode)}</span></div>
          <p className="mt-1">The owner will confirm availability, delivery, and payment with you in chat.</p>
        </div>

        <form className="mt-5 space-y-4" onSubmit={submit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium">Full name<Input autoFocus autoComplete="name" onChange={(event) => setName(event.target.value)} required value={name} /></label>
            <label className="grid gap-2 text-sm font-medium">WhatsApp number<Input autoComplete="tel" onChange={(event) => setPhone(event.target.value)} placeholder="e.g. 0802 123 4567" required value={phone} /></label>
          </div>
          <label className="grid gap-2 text-sm font-medium">Email <span className="font-normal text-muted-foreground">(optional)</span><Input autoComplete="email" onChange={(event) => setEmail(event.target.value)} type="email" value={email} /></label>
          <label className="grid gap-2 text-sm font-medium">Delivery address <span className="font-normal text-muted-foreground">(optional)</span><textarea className="min-h-20 rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setAddress(event.target.value)} placeholder="Share it now or confirm it in WhatsApp" value={address} /></label>
          <label className="grid gap-2 text-sm font-medium">Note <span className="font-normal text-muted-foreground">(optional)</span><textarea className="min-h-16 rounded-md border bg-transparent px-3 py-2 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setNote(event.target.value)} placeholder="Colour, size, or delivery preference" value={note} /></label>
          {snapshot.mode === "demo" ? <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs leading-5 text-amber-900">Demo mode: this form does not save or send a real request.</p> : null}
          {error ? <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">{error}</p> : null}
          {success ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm leading-5 text-emerald-800" role="status"><p>{success}</p>{whatsappUrl ? <a className="mt-2 inline-flex font-semibold underline underline-offset-4" href={whatsappUrl} rel="noreferrer" target="_blank">Open WhatsApp again</a> : null}</div> : null}
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={() => onOpenChange(false)} type="button" variant="outline">Cancel</Button>
            <Button className="bg-emerald-600 text-white hover:bg-emerald-700" disabled={loading || !cart.length} type="submit">{loading ? <><LoaderCircle aria-hidden="true" className="animate-spin" /> Preparing request…</> : <><MessageCircle aria-hidden="true" /> Send via WhatsApp</>}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
