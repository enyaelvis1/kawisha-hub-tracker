"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { formatCurrency, sourceLabels } from "@/lib/format";
import { controlClass, formLabelClass, textareaClass } from "@/lib/ui";
import { calculateOrderTotalCents } from "@/lib/order-calculations";
import { useWorkspace } from "@/lib/workspace-context";
import type { OrderLine, OrderSource, PaymentStatus } from "@/lib/types";

const inlineControlClass = controlClass.replace("mt-2 ", "");

export function OrderForm() {
  const router = useRouter();
  const { variants, snapshot, createOrder } = useWorkspace();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [source, setSource] = useState<OrderSource>("whatsapp");
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>("unpaid");
  const [notes, setNotes] = useState("");
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const [selectedQuantity, setSelectedQuantity] = useState("1");
  const [lines, setLines] = useState<Array<{ variantId: string; quantity: number }>>([]);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId);
  const previewLines: OrderLine[] = useMemo(() => lines.flatMap((line, index) => {
    const variant = variants.find((item) => item.id === line.variantId);
    return variant ? [{ id: `preview-${index}`, variantId: variant.id, productName: variant.productName, variantName: variant.variantName, sku: variant.sku, quantity: line.quantity, unitPriceCents: variant.priceCents }] : [];
  }), [lines, variants]);

  function addLine() {
    const quantity = Number(selectedQuantity);
    if (!selectedVariant || !Number.isInteger(quantity) || quantity < 1) return setError("Choose a variant and a positive quantity.");
    setError("");
    setLines((current) => {
      const existing = current.find((line) => line.variantId === selectedVariant.id);
      return existing ? current.map((line) => line.variantId === selectedVariant.id ? { ...line, quantity: line.quantity + quantity } : line) : [...current, { variantId: selectedVariant.id, quantity }];
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    if (!customerName.trim() || lines.length === 0) return setError("Add the customer name and at least one item.");
    setSaving(true);
    try {
      await createOrder({ customerName, customerPhone, source, paymentStatus, notes, lines });
      router.push("/orders");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <section>
        <div className="mb-4"><h2 className="font-semibold tracking-tight">Customer details</h2><p className="mt-1 text-sm text-muted-foreground">Record what the customer shared with your team. Nothing is imported or verified automatically.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className={formLabelClass}>Customer name<input className={controlClass} value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="e.g. Amina Yusuf" required /></label>
          <label className={formLabelClass}>Phone <span className="font-normal text-muted-foreground">(optional)</span><input className={controlClass} value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="080…" /></label>
          <label className={formLabelClass}>Order source<select className={controlClass} value={source} onChange={(event) => setSource(event.target.value as OrderSource)}>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
          <label className={formLabelClass}>Payment status<select className={controlClass} value={paymentStatus} onChange={(event) => setPaymentStatus(event.target.value as PaymentStatus)}><option value="unpaid">Unpaid</option><option value="partial">Partial</option><option value="paid">Paid</option></select></label>
        </div>
      </section>

      <section className="border-t pt-6">
        <div className="mb-4"><h2 className="font-semibold tracking-tight">Items</h2><p className="mt-1 text-sm text-muted-foreground">Prices are captured now and remain attached to this order.</p></div>
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_120px_auto]">
          <select aria-label="Product variant" className={inlineControlClass} value={selectedVariantId} onChange={(event) => setSelectedVariantId(event.target.value)}>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.productName} · {variant.variantName} — {formatCurrency(variant.priceCents, snapshot.data.currencyCode)}</option>)}</select>
          <input aria-label="Quantity" className={inlineControlClass} type="number" min="1" step="1" value={selectedQuantity} onChange={(event) => setSelectedQuantity(event.target.value)} />
          <Button type="button" variant="outline" onClick={addLine}>Add item</Button>
        </div>
        <div className="mt-4 divide-y rounded-lg border">
          {previewLines.map((line) => <div key={line.id} className="flex items-center justify-between gap-3 px-4 py-3"><div className="min-w-0"><p className="truncate text-sm font-semibold">{line.productName} · {line.variantName}</p><p className="mt-0.5 text-xs text-muted-foreground">{line.quantity} × {formatCurrency(line.unitPriceCents, snapshot.data.currencyCode)}</p></div><div className="flex items-center gap-3"><p className="text-sm font-semibold tabular-nums">{formatCurrency(line.quantity * line.unitPriceCents, snapshot.data.currencyCode)}</p><button type="button" onClick={() => setLines((current) => current.filter((item) => item.variantId !== line.variantId))} className="text-xs font-semibold text-rose-700 underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Remove</button></div></div>)}
          {previewLines.length === 0 ? <p className="px-4 py-8 text-center text-sm text-muted-foreground">No items added yet.</p> : <div className="flex items-center justify-between bg-muted/40 px-4 py-3.5"><span className="text-sm font-semibold text-muted-foreground">Order total</span><span className="text-lg font-bold tabular-nums">{formatCurrency(calculateOrderTotalCents(previewLines), snapshot.data.currencyCode)}</span></div>}
        </div>
      </section>

      <label className={formLabelClass}>Notes <span className="font-normal text-muted-foreground">(optional)</span><textarea className={textareaClass} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Delivery notes, follow-up, or context" /></label>
      {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button disabled={saving || variants.length === 0} type="submit">{saving ? "Saving…" : "Save order"}</Button></div>
    </form>
  );
}
