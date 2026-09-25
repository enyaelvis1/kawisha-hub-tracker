"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Boxes, Search } from "lucide-react";

import { PageHeader, QuickCreateLink, StatusPill } from "@/components/app-shell";
import { formatDateTime, titleCase } from "@/lib/format";
import { useWorkspace } from "@/lib/workspace-context";
import type { MovementType } from "@/lib/types";

const movementTypes: Array<MovementType | "all"> = ["all", "opening_stock", "restock", "manual_correction", "order_confirmed", "order_cancelled"];

function movementTone(type: MovementType) {
  if (type === "order_confirmed" || type === "manual_correction") return "slate" as const;
  if (type === "order_cancelled") return "blue" as const;
  return "green" as const;
}

export default function StockPage() {
  const { snapshot, variants } = useWorkspace();
  const [search, setSearch] = useState("");
  const [movementType, setMovementType] = useState<MovementType | "all">("all");
  const filteredMovements = useMemo(
    () => snapshot.data.movements.filter((movement) => {
      const haystack = `${movement.productName} ${movement.variantName} ${movement.reason} ${movement.orderNumber ?? ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase()) && (movementType === "all" || movement.movementType === movementType);
    }),
    [snapshot.data.movements, search, movementType],
  );
  const totalUnits = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const lowStockCount = variants.filter((variant) => variant.stock <= variant.lowStockThreshold).length;

  return (
    <div>
      <PageHeader
        eyebrow="Inventory"
        title="Stock"
        description="Review current quantities and keep every stock change traceable to a movement and reason."
        action={<QuickCreateLink href="/stock/new">Record movement</QuickCreateLink>}
      />

      <section aria-label="Stock summary" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Tracked variants</p><p className="mt-2 text-2xl font-semibold tabular-nums">{variants.length}</p><p className="mt-1 text-xs text-muted-foreground">Across active products</p></div>
        <div className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Units on hand</p><p className="mt-2 text-2xl font-semibold tabular-nums">{totalUnits}</p><p className="mt-1 text-xs text-muted-foreground">Current available stock</p></div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 shadow-sm"><p className="text-sm text-amber-800">Low-stock alerts</p><p className="mt-2 text-2xl font-semibold tabular-nums text-amber-950">{lowStockCount}</p><p className="mt-1 text-xs text-amber-800/70">At or below threshold</p></div>
      </section>

      <section className="mt-6 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex flex-col gap-3 border-b p-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold tracking-tight">Movement history</h2>
            <p className="mt-1 text-sm text-muted-foreground">Stock is deducted only when an order is confirmed.</p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block sm:w-64">
              <span className="sr-only">Search stock movements</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search product or reason" className="h-9 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            </label>
            <label className="sm:w-44">
              <span className="sr-only">Filter by movement type</span>
              <select value={movementType} onChange={(event) => setMovementType(event.target.value as MovementType | "all")} className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {movementTypes.map((type) => <option key={type} value={type}>{type === "all" ? "All movements" : titleCase(type)}</option>)}
              </select>
            </label>
          </div>
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product / variant</th>
                <th className="px-4 py-3">Movement type</th>
                <th className="px-4 py-3 text-right">Change</th>
                <th className="px-4 py-3">Reason</th>
              </tr>
            </thead>
            <tbody>
              {filteredMovements.map((movement) => (
                <tr key={movement.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{formatDateTime(movement.createdAt)}</td>
                  <td className="px-4 py-3.5"><p className="font-semibold">{movement.productName}</p><p className="mt-0.5 text-xs text-muted-foreground">{movement.variantName}</p></td>
                  <td className="px-4 py-3.5"><StatusPill tone={movementTone(movement.movementType)}>{titleCase(movement.movementType)}</StatusPill></td>
                  <td className={`px-4 py-3.5 text-right font-bold tabular-nums ${movement.quantityDelta > 0 ? "text-emerald-700" : "text-rose-700"}`}>{movement.quantityDelta > 0 ? "+" : ""}{movement.quantityDelta}</td>
                  <td className="max-w-[320px] px-4 py-3.5 text-muted-foreground">{movement.reason}{movement.orderNumber ? <span className="mt-1 block text-xs">{movement.orderNumber}</span> : null}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y md:hidden">
          {filteredMovements.map((movement) => (
            <div key={movement.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${movement.quantityDelta > 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>{movement.quantityDelta > 0 ? <ArrowUpRight className="size-4" aria-hidden="true" /> : <ArrowDownLeft className="size-4" aria-hidden="true" />}</span>
                  <div className="min-w-0"><p className="truncate font-semibold">{movement.productName}</p><p className="mt-1 truncate text-sm text-muted-foreground">{movement.variantName}</p></div>
                </div>
                <span className={`shrink-0 text-sm font-bold tabular-nums ${movement.quantityDelta > 0 ? "text-emerald-700" : "text-rose-700"}`}>{movement.quantityDelta > 0 ? "+" : ""}{movement.quantityDelta}</span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><StatusPill tone={movementTone(movement.movementType)}>{titleCase(movement.movementType)}</StatusPill><span className="text-xs text-muted-foreground">{formatDateTime(movement.createdAt)}</span></div>
              <p className="mt-3 text-sm leading-5 text-muted-foreground">{movement.reason}{movement.orderNumber ? ` · ${movement.orderNumber}` : ""}</p>
            </div>
          ))}
        </div>

        {filteredMovements.length === 0 ? <div className="px-5 py-16 text-center"><Boxes className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" /><p className="mt-3 text-sm font-semibold">{snapshot.data.movements.length ? "No matching movements" : "No stock movements recorded yet"}</p><p className="mt-1 text-sm text-muted-foreground">{snapshot.data.movements.length ? "Try another search or movement type." : "Record a movement when stock arrives or needs correction."}</p>{snapshot.data.movements.length === 0 ? <Link href="/stock/new" className="mt-4 inline-flex text-sm font-semibold text-foreground underline-offset-4 hover:underline">Record a movement</Link> : null}</div> : null}
      </section>
    </div>
  );
}
