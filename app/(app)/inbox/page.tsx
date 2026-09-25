"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ExternalLink, MessageCircle, Search } from "lucide-react";

import { PageHeader, StatusPill } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { normalizeWhatsAppNumber } from "@/lib/whatsapp";
import { useWorkspace } from "@/lib/workspace-context";
import type { WhatsAppOrderRequest, WhatsAppRequestStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const statusOptions: Array<{ value: WhatsAppRequestStatus; label: string }> = [
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "converted", label: "Converted to order" },
  { value: "closed", label: "Closed" },
];

const statusLabels = Object.fromEntries(statusOptions.map((option) => [option.value, option.label])) as Record<WhatsAppRequestStatus, string>;

function statusTone(status: WhatsAppRequestStatus) {
  if (status === "converted") return "green" as const;
  if (status === "closed") return "slate" as const;
  if (status === "contacted") return "blue" as const;
  return "amber" as const;
}

function customerWhatsAppUrl(phone: string) {
  const number = normalizeWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}` : "";
}

function itemSummary(request: WhatsAppOrderRequest) {
  return request.lines.map((line) => `${line.quantity} × ${line.productName}`).join(", ");
}

export default function InboxPage() {
  const { snapshot, isDemo } = useWorkspace();
  const [requests, setRequests] = useState(snapshot.data.whatsappRequests);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<WhatsAppRequestStatus | "all">("all");
  const [savingId, setSavingId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => setRequests(snapshot.data.whatsappRequests), [snapshot.data.whatsappRequests]);

  const filteredRequests = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => {
      const haystack = `${request.requestNumber} ${request.customerName} ${request.customerPhone} ${itemSummary(request)}`.toLowerCase();
      return haystack.includes(query) && (status === "all" || request.status === status);
    });
  }, [requests, search, status]);

  const newCount = requests.filter((request) => request.status === "new").length;
  const contactedCount = requests.filter((request) => request.status === "contacted").length;

  async function changeStatus(requestId: string, nextStatus: WhatsAppRequestStatus) {
    setError("");
    setSavingId(requestId);
    try {
      if (!isDemo) {
        const { updateWhatsAppRequestStatus } = await import("@/app/(app)/actions");
        await updateWhatsAppRequestStatus(requestId, nextStatus);
      }
      setRequests((current) => current.map((request) => request.id === requestId ? { ...request, status: nextStatus, updatedAt: new Date().toISOString() } : request));
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not update the request.");
    } finally {
      setSavingId("");
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Customer enquiries"
        title="WhatsApp inbox"
        description="Review cart requests sent from the public store, reply in WhatsApp, and mark the handoff as it progresses. Requests do not reserve stock until you record and confirm an order."
        action={<Button asChild variant="outline"><Link href="/store">Open public store <ExternalLink aria-hidden="true" /></Link></Button>}
      />

      {!snapshot.data.whatsappInboxAvailable && !isDemo ? <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-950"><p className="font-semibold">WhatsApp inbox migration still needs to be applied.</p><p className="mt-1">Run <code className="rounded bg-amber-100 px-1 py-0.5 text-xs">supabase/migrations/202609250004_whatsapp_order_inbox.sql</code> in the connected Supabase project, then refresh this page.</p></div> : null}

      <section aria-label="WhatsApp inbox summary" className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">New requests</p><p className="mt-2 text-2xl font-semibold tabular-nums">{newCount}</p><p className="mt-1 text-xs text-muted-foreground">Needs a first reply</p></div>
        <div className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">Being followed up</p><p className="mt-2 text-2xl font-semibold tabular-nums">{contactedCount}</p><p className="mt-1 text-xs text-muted-foreground">Marked as contacted</p></div>
        <div className="rounded-xl border bg-card p-4 shadow-sm"><p className="text-sm text-muted-foreground">All requests</p><p className="mt-2 text-2xl font-semibold tabular-nums">{requests.length}</p><p className="mt-1 text-xs text-muted-foreground">Including converted and closed</p></div>
      </section>

      <div className="mt-6 flex flex-col gap-3 rounded-xl border bg-card p-3 shadow-sm md:flex-row md:items-center">
        <label className="relative block min-w-0 flex-1">
          <span className="sr-only">Search WhatsApp requests</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setSearch(event.target.value)} placeholder="Search request, customer, phone, or product" value={search} />
        </label>
        <label className="md:w-52">
          <span className="sr-only">Filter WhatsApp requests by status</span>
          <select className="h-10 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" onChange={(event) => setStatus(event.target.value as WhatsAppRequestStatus | "all")} value={status}>
            <option value="all">All statuses</option>
            {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>
      </div>

      {error ? <p className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800" role="alert">{error}</p> : null}

      <div className="mt-4 overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-muted/40 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              <tr className="border-b"><th className="px-4 py-3">Request</th><th className="px-4 py-3">Customer</th><th className="px-4 py-3">Items</th><th className="px-4 py-3">Date</th><th className="px-4 py-3 text-right">Total</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Contact</th></tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => {
                const contactUrl = customerWhatsAppUrl(request.customerPhone);
                return <tr className="border-b last:border-0 hover:bg-muted/30" key={request.id}>
                  <td className="px-4 py-3.5"><p className="font-semibold">{request.requestNumber}</p><p className="mt-1 text-xs text-muted-foreground">{request.note || "No note"}</p></td>
                  <td className="px-4 py-3.5"><p className="font-medium">{request.customerName}</p><p className="mt-1 text-xs text-muted-foreground">{request.customerPhone}</p></td>
                  <td className="max-w-[260px] px-4 py-3.5 text-muted-foreground">{itemSummary(request)}</td>
                  <td className="whitespace-nowrap px-4 py-3.5 text-muted-foreground">{formatDateTime(request.createdAt)}</td>
                  <td className="px-4 py-3.5 text-right font-semibold tabular-nums">{formatCurrency(request.totalCents, snapshot.data.currencyCode)}</td>
                  <td className="px-4 py-3.5"><div className="grid gap-2"><StatusPill tone={statusTone(request.status)}>{statusLabels[request.status]}</StatusPill><select aria-label={`Update ${request.requestNumber} status`} className="h-8 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring" disabled={savingId === request.id} onChange={(event) => changeStatus(request.id, event.target.value as WhatsAppRequestStatus)} value={request.status}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></div></td>
                  <td className="px-4 py-3.5 text-right">{contactUrl ? <Button asChild size="sm" variant="outline"><a href={contactUrl} rel="noreferrer" target="_blank"><MessageCircle aria-hidden="true" /> Reply</a></Button> : <span className="text-xs text-muted-foreground">No phone</span>}</td>
                </tr>;
              })}
            </tbody>
          </table>
        </div>

        <div className="divide-y md:hidden">
          {filteredRequests.map((request) => {
            const contactUrl = customerWhatsAppUrl(request.customerPhone);
            return <article className="p-4" key={request.id}>
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="font-semibold">{request.requestNumber}</p><p className="mt-1 text-sm text-muted-foreground">{request.customerName} · {request.customerPhone}</p></div><p className="shrink-0 font-semibold tabular-nums">{formatCurrency(request.totalCents, snapshot.data.currencyCode)}</p></div>
              <p className="mt-3 text-sm leading-5 text-muted-foreground">{itemSummary(request)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2"><StatusPill tone={statusTone(request.status)}>{statusLabels[request.status]}</StatusPill><span className="text-xs text-muted-foreground">{formatDateTime(request.createdAt)}</span></div>
              {request.deliveryAddress ? <p className="mt-3 rounded-lg bg-muted/40 px-3 py-2 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Delivery:</span> {request.deliveryAddress}</p> : null}
              {request.note ? <p className="mt-2 text-xs leading-5 text-muted-foreground"><span className="font-semibold text-foreground">Note:</span> {request.note}</p> : null}
              <div className="mt-4 flex items-center gap-2"><select aria-label={`Update ${request.requestNumber} status`} className={cn("h-9 min-w-0 flex-1 rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring", savingId === request.id && "opacity-60")} disabled={savingId === request.id} onChange={(event) => changeStatus(request.id, event.target.value as WhatsAppRequestStatus)} value={request.status}>{statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{contactUrl ? <Button asChild size="sm" variant="outline"><a href={contactUrl} rel="noreferrer" target="_blank"><MessageCircle aria-hidden="true" /> Reply</a></Button> : null}</div>
            </article>;
          })}
        </div>

        {filteredRequests.length === 0 ? <div className="px-5 py-16 text-center"><MessageCircle aria-hidden="true" className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-semibold">{requests.length ? "No matching requests" : "No WhatsApp requests yet"}</p><p className="mt-1 text-sm text-muted-foreground">{requests.length ? "Try a different search or status filter." : "Requests from the public store will appear here after a shopper submits their cart."}</p></div> : null}
      </div>
    </div>
  );
}
