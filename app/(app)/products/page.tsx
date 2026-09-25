"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Package, Search } from "lucide-react";

import { PageHeader, QuickCreateLink, StatusPill } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { useWorkspace } from "@/lib/workspace-context";

function ProductThumbnail({ product, className }: { product: { name: string; imageUrl?: string | null }; className: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center overflow-hidden bg-muted text-muted-foreground ${className}`}>
      {product.imageUrl ? <img alt={`${product.name} preview`} className="size-full object-cover" loading="lazy" src={product.imageUrl} /> : <Package aria-hidden="true" className="size-4" />}
    </span>
  );
}

export default function ProductsPage() {
  const { snapshot, categories } = useWorkspace();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const rows = useMemo(
    () => snapshot.data.products.flatMap((product) => product.variants.map((variant) => ({ product, variant }))).filter(({ product, variant }) => {
      const haystack = `${product.name} ${product.category} ${variant.variantName} ${variant.sku}`.toLowerCase();
      return haystack.includes(search.toLowerCase()) && (category === "all" || product.category === category);
    }),
    [snapshot.data.products, search, category],
  );

  function getStatus(variant: (typeof rows)[number]["variant"], productActive: boolean) {
    if (!productActive || !variant.isActive) return { label: "Inactive", tone: "slate" as const };
    if (variant.stock <= variant.lowStockThreshold) return { label: "Low stock", tone: "amber" as const };
    return { label: "In stock", tone: "green" as const };
  }

  return (
    <div>
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Search product variants, review stock status, and jump straight to the edit or stock workflow."
        action={<QuickCreateLink href="/products/new">Add product</QuickCreateLink>}
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm sm:flex-row sm:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product, variant, or SKU" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
        <label className="sm:w-52">
          <span className="sr-only">Filter by category</span>
          <select value={category} onChange={(event) => setCategory(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring">
            <option value="all">All categories</option>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3">Product / variant</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">On hand</th>
                <th className="px-4 py-3 text-right">Threshold</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ product, variant }) => {
                const status = getStatus(variant, product.isActive);
                return (
                  <tr key={variant.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3.5">
                      <div className="flex min-w-0 items-center gap-3">
                        <ProductThumbnail className="size-10 rounded-lg" product={product} />
                        <div className="min-w-0">
                          <Link href={`/products/${product.id}/edit`} className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{product.name}</Link>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{variant.variantName} · {product.category}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">{variant.sku}</td>
                    <td className="px-4 py-3.5 text-right font-medium tabular-nums">{formatCurrency(variant.priceCents, snapshot.data.currencyCode)}</td>
                    <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{variant.stock}</td>
                    <td className="px-4 py-3.5 text-right text-muted-foreground tabular-nums">{variant.lowStockThreshold}</td>
                    <td className="px-4 py-3.5"><StatusPill tone={status.tone}>{status.label}</StatusPill></td>
                    <td className="px-4 py-3.5 text-right"><Button asChild variant="ghost" size="sm"><Link href={`/products/${product.id}/edit`}>Edit</Link></Button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y md:hidden">
          {rows.map(({ product, variant }) => {
            const status = getStatus(variant, product.isActive);
            return (
              <div key={variant.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <ProductThumbnail className="size-14 rounded-xl" product={product} />
                    <div className="min-w-0">
                      <Link href={`/products/${product.id}/edit`} className="font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{product.name}</Link>
                      <p className="mt-1 truncate text-sm text-muted-foreground">{variant.variantName}</p>
                    </div>
                  </div>
                  <StatusPill tone={status.tone}>{status.label}</StatusPill>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">SKU</p><p className="mt-1 font-mono text-xs">{variant.sku}</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Price</p><p className="mt-1 font-medium">{formatCurrency(variant.priceCents, snapshot.data.currencyCode)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Quantity on hand</p><p className="mt-1 font-semibold tabular-nums">{variant.stock} units</p></div>
                  <div className="text-right"><p className="text-xs text-muted-foreground">Low-stock threshold</p><p className="mt-1 tabular-nums">{variant.lowStockThreshold}</p></div>
                </div>
                <div className="mt-4 flex justify-end"><Button asChild variant="outline" size="sm"><Link href={`/products/${product.id}/edit`}>Edit product</Link></Button></div>
              </div>
            );
          })}
        </div>

        {rows.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <Package className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" />
            <p className="mt-3 text-sm font-semibold">{snapshot.data.products.length ? "No matching variants" : "No products yet"}</p>
            <p className="mt-1 text-sm text-muted-foreground">{snapshot.data.products.length ? "Try another search or category." : "Add your first product to start tracking stock."}</p>
            {snapshot.data.products.length === 0 ? <Button asChild variant="outline" size="sm" className="mt-4"><Link href="/products/new">Add a product</Link></Button> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
