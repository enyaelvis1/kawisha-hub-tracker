import { BackLink, PageHeader } from "@/components/app-shell";
import { ProductForm } from "@/components/product-form";

export default function NewProductPage() {
  return <div><BackLink href="/products">Back to products</BackLink><PageHeader eyebrow="Catalog" title="Add a product" description="Create the product and its first variant. All stock changes are recorded as movements." /><div className="max-w-3xl rounded-xl border bg-card p-5 shadow-sm md:p-7"><ProductForm /></div></div>;
}
