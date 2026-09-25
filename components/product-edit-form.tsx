"use client";

/* eslint-disable @next/next/no-img-element */

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { centsToDecimal, decimalToCents } from "@/lib/format";
import { controlClass, formLabelClass, textareaClass } from "@/lib/ui";
import { useWorkspace } from "@/lib/workspace-context";
import { uploadProductImage } from "@/app/(app)/actions";

export function ProductEditForm({ productId }: { productId: string }) {
  const router = useRouter();
  const { snapshot, updateProduct, deleteProduct, isDemo } = useWorkspace();
  const product = snapshot.data.products.find((item) => item.id === productId);
  const [variantId, setVariantId] = useState(product?.variants[0]?.id ?? "");
  const variant = product?.variants.find((item) => item.id === variantId) ?? product?.variants[0];
  const [form, setForm] = useState({ name: product?.name ?? "", category: product?.category ?? "", description: product?.description ?? "", variantName: variant?.variantName ?? "", sku: variant?.sku ?? "", price: variant ? centsToDecimal(variant.priceCents) : "", threshold: String(variant?.lowStockThreshold ?? 0), isActive: product?.isActive ?? true });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);

  useEffect(() => {
    if (!variant || !product) return;
    setForm({ name: product.name, category: product.category, description: product.description, variantName: variant.variantName, sku: variant.sku, price: centsToDecimal(variant.priceCents), threshold: String(variant.lowStockThreshold), isActive: product.isActive });
  }, [product, variant]);

  if (!product || !variant) return <div className="rounded-lg border bg-muted/30 p-8 text-sm text-muted-foreground">Product not found.</div>;

  const savedProduct = product;
  const savedVariant = variant;
  const set = (key: keyof typeof form, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    const priceCents = decimalToCents(form.price);
    const threshold = Number(form.threshold);
    if (priceCents === null || !Number.isInteger(threshold) || threshold < 0) return setError("Enter a valid price and whole-number threshold.");
    setSaving(true);
    try {
      await updateProduct({ productId: savedProduct.id, variantId: savedVariant.id, name: form.name, category: form.category, description: form.description, variantName: form.variantName, sku: form.sku, priceCents, stock: savedVariant.stock, lowStockThreshold: threshold, isActive: form.isActive });
      if (imageFile && !isDemo) {
        const imageData = new FormData();
        imageData.set("productId", savedProduct.id);
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

  async function removeProduct() {
    if (!window.confirm(`Delete ${savedProduct.name}? Products with stock or order history can only be archived.`)) return;
    setError("");
    setDeleting(true);
    try {
      await deleteProduct(savedProduct.id);
      router.push("/products");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete product.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-7">
      <div className="rounded-lg border bg-muted/40 p-4"><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">Current stock</p><p className="mt-2 text-2xl font-semibold tabular-nums">{variant.stock} <span className="text-sm font-normal text-muted-foreground">units</span></p><p className="mt-1 text-xs text-muted-foreground">Use Stock control to change quantity so every change has a movement record.</p></div>
      {product.variants.length > 1 ? <label className={formLabelClass}>Variant to edit<select className={controlClass} value={variantId} onChange={(event) => setVariantId(event.target.value)}>{product.variants.map((item) => <option key={item.id} value={item.id}>{item.variantName} · {item.sku}</option>)}</select></label> : null}
      <div className="grid gap-5 md:grid-cols-2">
        <label className={formLabelClass}>Product name<input className={controlClass} value={form.name} onChange={(event) => set("name", event.target.value)} required /></label>
        <label className={formLabelClass}>Category<input className={controlClass} value={form.category} onChange={(event) => set("category", event.target.value)} required /></label>
        <label className={`${formLabelClass} md:col-span-2`}>Description<textarea className={textareaClass} value={form.description} onChange={(event) => set("description", event.target.value)} /></label>
      <label className={`${formLabelClass} md:col-span-2`}>Product photo <span className="font-normal text-muted-foreground">(optional)</span>{savedProduct.imageUrl ? <span className="mb-2 block overflow-hidden rounded-lg border bg-muted/30"><img alt={`${savedProduct.name} current product photo`} className="h-32 w-full object-cover" src={savedProduct.imageUrl} /></span> : null}<input accept="image/jpeg,image/png,image/webp" className={controlClass} disabled={isDemo} onChange={(event) => setImageFile(event.target.files?.[0] ?? null)} type="file" /><span className="mt-1 block text-xs font-normal text-muted-foreground">JPG, PNG, or WebP up to 5 MB. {isDemo ? "Connect Supabase to upload live product photos." : "A new upload replaces the current public photo."}</span></label>
        <label className={formLabelClass}>Variant name<input className={controlClass} value={form.variantName} onChange={(event) => set("variantName", event.target.value)} required /></label>
        <label className={formLabelClass}>SKU<input className={controlClass} value={form.sku} onChange={(event) => set("sku", event.target.value.toUpperCase())} required /></label>
        <label className={formLabelClass}>Selling price <span className="font-normal text-muted-foreground">(NGN)</span><input className={controlClass} inputMode="decimal" value={form.price} onChange={(event) => set("price", event.target.value)} required /></label>
        <label className={formLabelClass}>Low-stock threshold<input className={controlClass} type="number" min="0" step="1" value={form.threshold} onChange={(event) => set("threshold", event.target.value)} required /></label>
      </div>
      <label className="flex items-start gap-3 rounded-lg border px-4 py-3 text-sm"><Checkbox checked={form.isActive} onCheckedChange={(checked) => set("isActive", checked === true)} /><span><span className="font-semibold">Active product</span><span className="mt-1 block text-xs text-muted-foreground">Uncheck to archive this product from normal operations.</span></span></label>
      {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
      <div className="flex flex-col-reverse gap-2 border-t pt-5 sm:flex-row sm:items-center sm:justify-between"><Button disabled={saving || deleting} onClick={removeProduct} type="button" variant="destructive">{deleting ? "Deleting…" : "Delete product"}</Button><div className="flex flex-col-reverse gap-2 sm:flex-row"><Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button><Button disabled={saving || deleting} type="submit">{saving ? "Saving…" : "Save changes"}</Button></div></div>
    </form>
  );
}
