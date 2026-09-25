"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { decimalToCents } from "@/lib/format";
import { controlClass, formLabelClass } from "@/lib/ui";
import { useWorkspace } from "@/lib/workspace-context";

export function VariantAddForm({ productId }: { productId: string }) {
  const router = useRouter();
  const { addVariant, isDemo } = useWorkspace();
  const [form, setForm] = useState({ variantName: "", sku: "", price: "", stock: "0", threshold: "0" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const priceCents = decimalToCents(form.price);
    const stock = Number(form.stock);
    const lowStockThreshold = Number(form.threshold);
    if (priceCents === null || ![stock, lowStockThreshold].every((value) => Number.isInteger(value) && value >= 0)) return setError("Enter a valid price, stock count, and threshold.");
    setSaving(true);
    try {
      await addVariant({ productId, variantName: form.variantName, sku: form.sku, priceCents, stock, lowStockThreshold });
      setForm({ variantName: "", sku: "", price: "", stock: "0", threshold: "0" });
      if (!isDemo) router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not add variant.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div><h2 className="font-semibold tracking-tight">Add another variant</h2><p className="mt-1 text-sm text-muted-foreground">Use this for another size, colour, or option. Opening stock is recorded as a movement.</p></div>
      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <label className={formLabelClass}>Variant name<input className={controlClass} value={form.variantName} onChange={(event) => set("variantName", event.target.value)} placeholder="e.g. Black / Large" required /></label>
        <label className={formLabelClass}>SKU<input className={controlClass} value={form.sku} onChange={(event) => set("sku", event.target.value.toUpperCase())} placeholder="e.g. TOTE-BLK-L" required /></label>
        <label className={formLabelClass}>Selling price <span className="font-normal text-muted-foreground">(NGN)</span><input className={controlClass} inputMode="decimal" value={form.price} onChange={(event) => set("price", event.target.value)} placeholder="1950.00" required /></label>
        <label className={formLabelClass}>Opening stock<input className={controlClass} type="number" min="0" step="1" value={form.stock} onChange={(event) => set("stock", event.target.value)} required /></label>
        <label className={formLabelClass}>Low-stock threshold<input className={controlClass} type="number" min="0" step="1" value={form.threshold} onChange={(event) => set("threshold", event.target.value)} required /></label>
      </div>
      {error ? <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      <div className="mt-6 flex justify-end"><Button disabled={saving} type="submit" variant="outline">{saving ? "Adding…" : "Add variant"}</Button></div>
    </form>
  );
}
