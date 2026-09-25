"use client";

import { useState } from "react";
import { Check, CircleAlert, PackageCheck, XCircle } from "lucide-react";

import { BackLink, PageHeader, StatusPill } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime, paymentLabels, sourceLabels, statusLabels } from "@/lib/format";
import { controlClass } from "@/lib/ui";
import { getOrderTotal, useWorkspace } from "@/lib/workspace-context";
import type { OrderStatus, PaymentStatus } from "@/lib/types";

function statusTone(status: OrderStatus) {
  if (status === "confirmed" || status === "completed") return "green" as const;
  if (status === "cancelled") return "red" as const;
  if (status === "ready") return "blue" as const;
  return "amber" as const;
}

export function OrderDetail({ orderId }: { orderId: string }) {
  const { snapshot, updateOrderStatus, updatePaymentStatus } = useWorkspace();
  const order = snapshot.data.orders.find((item) => item.id === orderId);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!order) return null;

  const nextStatus: Partial<Record<OrderStatus, { label: string; status: OrderStatus; icon: typeof Check }>> = {
    new: { label: "Confirm order", status: "confirmed", icon: Check },
    confirmed: { label: "Mark ready", status: "ready", icon: PackageCheck },
    ready: { label: "Mark completed", status: "completed", icon: Check },
  };
  const NextIcon = nextStatus[order.status]?.icon;

  async function changeStatus(status: OrderStatus) {
    setError("");
    setSaving(true);
    try {
      await updateOrderStatus(orderId, status);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update order.");
    } finally {
      setSaving(false);
    }
  }

  async function changePayment(event: React.ChangeEvent<HTMLSelectElement>) {
    try {
      await updatePaymentStatus(orderId, event.target.value as PaymentStatus);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update payment status.");
    }
  }

  return (
    <div>
      <BackLink href="/orders">Back to orders</BackLink>
      <PageHeader eyebrow="Order detail" title={order.orderNumber} description={`Recorded ${formatDateTime(order.createdAt)} · ${sourceLabels[order.source]}`} action={<StatusPill tone={statusTone(order.status)}>{statusLabels[order.status]}</StatusPill>} />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
            <div className="flex items-start justify-between gap-3"><div><h2 className="font-semibold tracking-tight">Items</h2><p className="mt-1 text-sm text-muted-foreground">Prices captured at the time this order was entered.</p></div><p className="text-lg font-bold tabular-nums">{formatCurrency(getOrderTotal(order), snapshot.data.currencyCode)}</p></div>
            <div className="mt-5 divide-y">{order.lines.map((line) => <div key={line.id} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"><div className="min-w-0"><p className="truncate text-sm font-semibold">{line.productName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{line.variantName} · {line.sku}</p></div><div className="shrink-0 text-right"><p className="text-sm font-semibold tabular-nums">{line.quantity} × {formatCurrency(line.unitPriceCents, snapshot.data.currencyCode)}</p><p className="mt-1 text-xs text-muted-foreground tabular-nums">{formatCurrency(line.quantity * line.unitPriceCents, snapshot.data.currencyCode)}</p></div></div>)}</div>
          </section>
          {order.notes ? <section className="rounded-xl border border-amber-200 bg-amber-50 p-5"><div className="flex gap-3"><CircleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" /><div><h2 className="text-sm font-semibold text-amber-950">Order notes</h2><p className="mt-1 text-sm leading-6 text-amber-900/80">{order.notes}</p></div></div></section> : null}
        </div>

        <aside className="space-y-4">
          <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="font-semibold tracking-tight">Customer</h2><p className="mt-4 text-sm font-semibold">{order.customerName}</p>{order.customerPhone ? <p className="mt-1 text-sm text-muted-foreground">{order.customerPhone}</p> : <p className="mt-1 text-xs text-muted-foreground">No phone number recorded</p>}<div className="mt-5 border-t pt-4"><label className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Payment<select value={order.paymentStatus} onChange={changePayment} className={controlClass}><option value="unpaid">{paymentLabels.unpaid}</option><option value="partial">{paymentLabels.partial}</option><option value="paid">{paymentLabels.paid}</option></select></label></div></section>
          <section className="rounded-xl border bg-card p-5 shadow-sm"><h2 className="font-semibold tracking-tight">Progress</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">Stock is deducted when you confirm this order.</p>{NextIcon ? <Button disabled={saving} type="button" onClick={() => changeStatus(nextStatus[order.status]!.status)} className="mt-5 w-full"><NextIcon className="size-4" />{saving ? "Updating…" : nextStatus[order.status]!.label}</Button> : null}{order.status !== "cancelled" && order.status !== "completed" ? <Button disabled={saving} type="button" variant="outline" onClick={() => changeStatus("cancelled")} className="mt-3 w-full border-rose-200 text-rose-800 hover:bg-rose-50 hover:text-rose-900"><XCircle className="size-4" />Cancel order</Button> : null}{order.status === "confirmed" || order.status === "ready" || order.status === "completed" ? <p className="mt-4 rounded-lg bg-emerald-50 px-3 py-2.5 text-xs leading-5 text-emerald-800">Stock was deducted on confirmation. Cancelling restores it exactly once.</p> : null}{error ? <p role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs leading-5 text-rose-800">{error}</p> : null}</section>
        </aside>
      </div>
    </div>
  );
}
