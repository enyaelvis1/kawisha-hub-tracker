import { Suspense } from "react";
import { ProductEditForm } from "@/components/product-edit-form";
import { VariantAddForm } from "@/components/variant-add-form";
import { PageHeader } from "@/components/app-shell";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="min-h-[50vh] rounded-xl border bg-card" aria-label="Loading product" />}><EditProductWithParams params={params} /></Suspense>;
}

async function EditProductWithParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div><PageHeader eyebrow="Catalog" title="Edit product" description="Update product details or archive it. Stock quantity changes stay in Stock control." /><div className="max-w-3xl space-y-6"><div className="rounded-xl border bg-card p-5 shadow-sm md:p-7"><ProductEditForm productId={id} /></div><div className="rounded-xl border bg-card p-5 shadow-sm md:p-7"><VariantAddForm productId={id} /></div></div></div>;
}
