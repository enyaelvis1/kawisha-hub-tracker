"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ClipboardList, Search } from "lucide-react";

import { PageHeader, QuickCreateLink, StatusPill } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, paymentLabels, sourceLabels, statusLabels } from "@/lib/format";
import { getOrderTotal, useWorkspace } from "@/lib/workspace-context";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

function statusTone(status: OrderStatus) {
  if (status === "confirmed" || status === "completed") return "green" as const;
  if (status === "cancelled") return "red" as const;
  if (status === "ready") return "blue" as const;
  return "amber" as const;
}

function paymentTone(status: PaymentStatus) {
  return status === "paid" ? "green" as const : status === "partial" ? "amber" as const : "slate" as const;
}

export default function OrdersPage() {
  const { snapshot } = useWorkspace();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [source, setSource] = useState("all");
  const orders = useMemo(
    () => snapshot.data.orders.filter((order) => {
      const haystack = `${order.orderNumber} ${order.customerName} ${order.customerPhone ?? ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase()) && (status === "all" || order.status === status) && (source === "all" || order.source === source);
    }),
    [snapshot.data.orders, search, status, source],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Sales log"
        title="Orders"
        description="Search manually recorded orders, review their payment state, and open the status controls for each order."
        action={<QuickCreateLink href="/orders/new">Record an order</QuickCreateLink>}
      />

      <div className="mb-4 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm md:flex-row md:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search orders</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order number, customer, or phone" className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" />
        </label>
        <label className="md:w-44">
          <span className="sr-only">Filter by order status</span>
          <select value={status} onChange={(event) => setStatus(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">All statuses</option>{Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
        <label className="md:w-44">
          <span className="sr-only">Filter by order source</span>
          <select value={source} onChange={(event) => setSource(event.target.value)} className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="all">All sources</option>{Object.entries(sourceLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
        </label>
      </div>

      <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[1050px] text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <tr className="border-b">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3">Payment</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3.5"><Link href={`/orders/${order.id}`} className="font-semibold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{order.orderNumber}</Link><span className="mt-1 block text-xs text-muted-foreground">{order.lines.reduce((sum, line) => sum + line.quantity, 0)} item(s)</span></td>
                  <td className="px-4 py-3.5 font-medium">{order.customerName}</td>
                  <td className="px-4 py-3.5 text-muted-foreground">{sourceLabels[order.source]}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{formatDateTime(order.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{formatCurrency(getOrderTotal(order), snapshot.data.currencyCode)}</td>
                  <td className="px-4 py-3.5"><StatusPill tone={paymentTone(order.paymentStatus)}>{paymentLabels[order.paymentStatus]}</StatusPill></td>
                  <td className="px-4 py-3.5"><StatusPill tone={statusTone(order.status)}>{statusLabels[order.status]}</StatusPill></td>
                  <td className="px-4 py-3.5 text-right"><Button asChild variant="ghost" size="sm"><Link href={`/orders/${order.id}`}>View</Link></Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="divide-y md:hidden">
          {orders.map((order) => (
            <div key={order.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><Link href={`/orders/${order.id}`} className="font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{order.orderNumber}</Link><p className="mt-1 truncate text-sm text-muted-foreground">{order.customerName}</p></div>
                <p className="shrink-0 font-semibold tabular-nums">{formatCurrency(getOrderTotal(order), snapshot.data.currencyCode)}</p>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2"><StatusPill tone={statusTone(order.status)}>{statusLabels[order.status]}</StatusPill><StatusPill tone={paymentTone(order.paymentStatus)}>{paymentLabels[order.paymentStatus]}</StatusPill></div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground"><div><p>Source</p><p className="mt-1 text-sm text-foreground">{sourceLabels[order.source]}</p></div><div className="text-right"><p>Date</p><p className="mt-1 text-sm text-foreground">{formatDateTime(order.createdAt)}</p></div></div>
              <div className="mt-4 flex justify-end"><Button asChild variant="outline" size="sm"><Link href={`/orders/${order.id}`}>View order</Link></Button></div>
            </div>
          ))}
        </div>

        {orders.length === 0 ? <div className="px-5 py-16 text-center"><ClipboardList className="mx-auto size-8 text-muted-foreground/50" aria-hidden="true" /><p className="mt-3 text-sm font-semibold">{snapshot.data.orders.length ? "No matching orders" : "No orders recorded yet"}</p><p className="mt-1 text-sm text-muted-foreground">{snapshot.data.orders.length ? "Try a different search or filter." : "Record an order when a customer places one through your usual channels."}</p>{snapshot.data.orders.length === 0 ? <Button asChild variant="outline" size="sm" className="mt-4"><Link href="/orders/new">Record an order</Link></Button> : null}</div> : null}
      </div>
    </div>
  );
}
