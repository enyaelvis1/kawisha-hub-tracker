"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { decimalToCents } from "@/lib/format";
import { controlClass, formLabelClass, textareaClass } from "@/lib/ui";
import { useWorkspace } from "@/lib/workspace-context";
import { uploadProductImage } from "@/app/(app)/actions";

export function ProductForm() {
  const router = useRouter();
  const { addProduct, isDemo } = useWorkspace();
  const [form, setForm] = useState({ name: "", category: "", description: "", variantName: "", sku: "", price: "", stock: "0", threshold: "0" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const priceCents = decimalToCents(form.price);
    const stock = Number(form.stock);
    const lowStockThreshold = Number(form.threshold);
    if (priceCents === null || priceCents < 0) return setError("Enter a valid selling price, such as 1850 or 1850.50.");
    if (![stock, lowStockThreshold].every((value) => Number.isInteger(value) && value >= 0)) return setError("Stock and threshold must be whole numbers.");
    setSaving(true);
    try {
      const productId = await addProduct({ name: form.name, category: form.category, description: form.description, variantName: form.variantName, sku: form.sku, priceCents, stock, lowStockThreshold });
      if (imageFile && !isDemo) {
        const imageData = new FormData();
        imageData.set("productId", productId);
        imageData.set("image", imageFile);
        await uploadProductImage(imageData);
      }
      router.push("/products");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <section>
        <div className="mb-4"><h2 className="font-semibold tracking-tight">Product details</h2><p className="mt-1 text-sm text-muted-foreground">Give the team enough context to find this item quickly.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className={formLabelClass}>Product name<input className={controlClass} value={form.name} onChange={(event) => set("name", event.target.value)} placeholder="e.g. Everyday tote" required /></label>
          <label className={formLabelClass}>Category<input className={controlClass} value={form.category} onChange={(event) => set("category", event.target.value)} placeholder="e.g. Bags" required /></label>
          <label className={`${formLabelClass} md:col-span-2`}>Description <span className="font-normal text-muted-foreground">(optional)</span><textarea className={textareaClass} value={form.description} onChange={(event) => set("description", event.target.value)} placeholder="Short internal description" /></label>
          <label className={`${formLabelClass} md:col-span-2`}>Product photo <span className="font-normal text-muted-foreground">(optional)</span><input accept="image/jpeg,image/png,image/webp" className={controlClass} disabled={isDemo} onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} type="file" /><span className="mt-1 block text-xs font-normal text-muted-foreground">JPG, PNG, or WebP up to 5 MB. {isDemo ? "Connect Supabase to upload live product photos." : "The photo is shown on the public store when published."}</span></label>
        </div>
      </section>

      <section className="border-t pt-6">
        <div className="mb-4"><h2 className="font-semibold tracking-tight">First variant</h2><p className="mt-1 text-sm text-muted-foreground">Add the first size, colour, or option. More variants can be added later.</p></div>
        <div className="grid gap-5 md:grid-cols-2">
          <label className={formLabelClass}>Variant name<input className={controlClass} value={form.variantName} onChange={(event) => set("variantName", event.target.value)} placeholder="e.g. Natural / Standard" required /></label>
          <label className={formLabelClass}>SKU<input className={controlClass} value={form.sku} onChange={(event) => set("sku", event.target.value.toUpperCase())} placeholder="e.g. TOTE-NAT-STD" required /></label>
          <label className={formLabelClass}>Selling price <span className="font-normal text-muted-foreground">(NGN)</span><input className={controlClass} inputMode="decimal" value={form.price} onChange={(event) => set("price", event.target.value)} placeholder="1850.00" required /></label>
          <label className={formLabelClass}>Opening stock<input className={controlClass} inputMode="numeric" type="number" min="0" step="1" value={form.stock} onChange={(event) => set("stock", event.target.value)} required /></label>
          <label className={formLabelClass}>Low-stock threshold<input className={controlClass} inputMode="numeric" type="number" min="0" step="1" value={form.threshold} onChange={(event) => set("threshold", event.target.value)} required /><span className="mt-1 block text-xs font-normal text-muted-foreground">You&apos;ll see an alert at or below this count.</span></label>
        </div>
      </section>

      {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button disabled={saving} type="submit">{saving ? "Saving…" : "Save product"}</Button>
      </div>
    </form>
  );
}
