"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { controlClass, formLabelClass, textareaClass } from "@/lib/ui";
import { useWorkspace } from "@/lib/workspace-context";
import type { MovementType } from "@/lib/types";

export function StockForm() {
  const router = useRouter();
  const { variants, recordStock } = useWorkspace();
  const [variantId, setVariantId] = useState(variants[0]?.id ?? "");
  const [movementType, setMovementType] = useState<MovementType>("restock");
  const [direction, setDirection] = useState<"add" | "remove">("add");
  const [quantity, setQuantity] = useState("1");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const selected = variants.find((variant) => variant.id === variantId);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const count = Number(quantity);
    if (!selected) return setError("Choose a variant first.");
    if (!Number.isInteger(count) || count < 1) return setError("Quantity must be a whole number of at least 1.");
    if (!reason.trim()) return setError("Add a reason so the movement is auditable.");
    setSaving(true);
    try {
      await recordStock({ variantId, quantityDelta: direction === "add" ? count : -count, movementType, reason });
      router.push("/stock");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not record movement.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="rounded-lg border bg-muted/40 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Selected variant</p><p className="mt-2 font-semibold">{selected ? `${selected.productName} · ${selected.variantName}` : "No variants yet"}</p><p className="mt-1 text-sm text-muted-foreground">Current stock: <span className="font-semibold text-foreground">{selected?.stock ?? 0}</span></p></div>
      <label className={formLabelClass}>Product variant<select className={controlClass} value={variantId} onChange={(event) => setVariantId(event.target.value)} required>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.productName} · {variant.variantName} ({variant.sku})</option>)}</select></label>
      <div className="grid gap-5 md:grid-cols-2">
        <label className={formLabelClass}>Movement type<select className={controlClass} value={movementType} onChange={(event) => setMovementType(event.target.value as MovementType)}><option value="restock">Restock</option><option value="opening_stock">Opening stock</option><option value="manual_correction">Manual correction</option></select></label>
        <label className={formLabelClass}>Direction<select className={controlClass} value={direction} onChange={(event) => setDirection(event.target.value as "add" | "remove")}><option value="add">Add stock</option><option value="remove">Remove stock</option></select></label>
      </div>
      <label className={formLabelClass}>Quantity<input className={controlClass} type="number" min="1" step="1" value={quantity} onChange={(event) => setQuantity(event.target.value)} required /></label>
      <label className={formLabelClass}>Reason<textarea className={textareaClass} value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Received delivery of 12 units" required /></label>
      {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button disabled={saving || variants.length === 0} type="submit">{saving ? "Recording…" : "Record movement"}</Button></div>
    </form>
  );
}
