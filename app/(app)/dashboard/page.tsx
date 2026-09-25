"use client";

import Link from "next/link";
import { Boxes, ChevronRight, ClipboardList, Package, ShoppingCart, TriangleAlert } from "lucide-react";

import { PageHeader, QuickCreateLink, StatusPill } from "@/components/app-shell";
import { formatCurrency, formatDateTime, sourceLabels, statusLabels } from "@/lib/format";
import { getOrderTotal, useWorkspace } from "@/lib/workspace-context";
import type { OrderStatus } from "@/lib/types";

function statusTone(status: OrderStatus) {
  if (status === "confirmed" || status === "completed") return "green" as const;
  if (status === "cancelled") return "red" as const;
  if (status === "ready") return "blue" as const;
  return "amber" as const;
}

export default function DashboardPage() {
  const { snapshot } = useWorkspace();
  const { data } = snapshot;
  const variants = data.products.flatMap((product) => product.variants);
  const lowStock = variants.filter((variant) => variant.stock <= variant.lowStockThreshold);
  const ordersRequiringAttention = data.orders.filter(
    (order) => !["completed", "cancelled"].includes(order.status) || order.paymentStatus !== "paid",
  );
  const totalUnits = variants.reduce((total, variant) => total + variant.stock, 0);
  const recentOrders = data.orders.slice(0, 5);
  const recordedSales = data.orders
    .filter((order) => ["confirmed", "ready", "completed"].includes(order.status))
    .reduce((total, order) => total + getOrderTotal(order), 0);

  const metrics = [
    { label: "Products tracked", value: data.products.filter((product) => product.isActive).length, hint: `${variants.length} active variants`, icon: Package, tone: "text-slate-700 bg-slate-100" },
    { label: "Units in stock", value: totalUnits, hint: "Across all active variants", icon: Boxes, tone: "text-sky-700 bg-sky-50" },
    { label: "Low-stock variants", value: lowStock.length, hint: lowStock.length ? "Review replenishment" : "Stock levels look good", icon: TriangleAlert, tone: "text-amber-700 bg-amber-50" },
    { label: "Orders requiring attention", value: ordersRequiringAttention.length, hint: "Open or not fully paid", icon: ClipboardList, tone: "text-violet-700 bg-violet-50" },
  ];

  return (
    <div>
      <PageHeader
        eyebrow="Overview"
        title={`Welcome back, ${data.businessName}`}
        description="A compact view of product coverage, stock health, and the orders your team is working through."
        action={<QuickCreateLink href="/orders/new">Record an order</QuickCreateLink>}
      />

      <section aria-label="Workspace summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(({ label, value, hint, icon: Icon, tone }) => (
          <div key={label} className="rounded-xl border bg-card p-4 shadow-sm transition hover:shadow-md">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
              </div>
              <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${tone}`}><Icon className="size-4" aria-hidden="true" /></span>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">{hint}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.6fr)]">
        <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b px-4 py-4 md:px-5">
            <div>
              <h2 className="font-semibold tracking-tight">Recent orders</h2>
              <p className="mt-1 text-sm text-muted-foreground">Latest manual entries from your team.</p>
            </div>
            <Link href="/orders" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              View all <ChevronRight className="size-4" aria-hidden="true" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                <tr className="border-b">
                  <th className="px-5 py-3">Order</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Source</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-5 py-3.5">
                      <Link href={`/orders/${order.id}`} className="font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{order.orderNumber}</Link>
                      <span className="mt-1 block text-xs text-muted-foreground">{formatDateTime(order.createdAt)}</span>
                    </td>
                    <td className="px-5 py-3.5 text-muted-foreground">{order.customerName}</td>
                    <td className="px-5 py-3.5 text-muted-foreground">{sourceLabels[order.source]}</td>
                    <td className="px-5 py-3.5"><StatusPill tone={statusTone(order.status)}>{statusLabels[order.status]}</StatusPill></td>
                    <td className="px-5 py-3.5 text-right font-semibold tabular-nums">{formatCurrency(getOrderTotal(order), data.currencyCode)}</td>
                  </tr>
                ))}
                {recentOrders.length === 0 ? <tr><td colSpan={5} className="px-5 py-12 text-center text-muted-foreground">No orders recorded yet.</td></tr> : null}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border bg-card shadow-sm">
          <div className="flex items-start justify-between gap-4 border-b px-4 py-4 md:px-5">
            <div>
              <h2 className="font-semibold tracking-tight">Stock watch</h2>
              <p className="mt-1 text-sm text-muted-foreground">Variants at or below threshold.</p>
            </div>
            <TriangleAlert className="size-4 text-amber-600" aria-hidden="true" />
          </div>
          <div className="space-y-2 p-4 md:p-5">
            {lowStock.slice(0, 5).map((variant) => (
              <Link href="/stock" key={variant.id} className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition hover:border-amber-300 hover:bg-amber-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{variant.productName}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">{variant.variantName} · {variant.sku}</p>
                </div>
                <span className="shrink-0 text-right"><span className="block text-sm font-bold text-amber-700">{variant.stock} left</span><span className="block text-[11px] text-muted-foreground">threshold {variant.lowStockThreshold}</span></span>
              </Link>
            ))}
            {lowStock.length === 0 ? <div className="rounded-lg bg-emerald-50 px-4 py-6 text-center"><p className="text-sm font-semibold text-emerald-800">All clear</p><p className="mt-1 text-xs text-emerald-700/70">No variants need a restock right now.</p></div> : null}
            {lowStock.length > 5 ? <Link href="/stock" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground">See all {lowStock.length} alerts <ChevronRight className="size-4" /></Link> : null}
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-3 md:grid-cols-3">
        <Link href="/products/new" className="group rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Package className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 font-semibold">Add a product</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Create a product and its first variant.</p>
          <ChevronRight className="mt-4 size-4 text-muted-foreground transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/stock" className="group rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Boxes className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 font-semibold">Update stock</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">Record a restock or correction with a reason.</p>
          <ChevronRight className="mt-4 size-4 text-muted-foreground transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
        <Link href="/orders" className="group rounded-xl border bg-card p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <ShoppingCart className="size-5 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 font-semibold">Recorded sales</p>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{formatCurrency(recordedSales, data.currencyCode)} from confirmed orders.</p>
          <ChevronRight className="mt-4 size-4 text-muted-foreground transition group-hover:translate-x-1" aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
