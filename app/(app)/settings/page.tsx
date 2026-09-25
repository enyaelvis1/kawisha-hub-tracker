"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { controlClass, formLabelClass } from "@/lib/ui";
import type { CheckoutMethod } from "@/lib/types";
import { useWorkspace } from "@/lib/workspace-context";

export default function SettingsPage() {
  const { snapshot, updateBusiness, isDemo } = useWorkspace();
  const [businessName, setBusinessName] = useState(snapshot.data.businessName);
  const [currencyCode, setCurrencyCode] = useState(snapshot.data.currencyCode);
  const [storefrontEnabled, setStorefrontEnabled] = useState(snapshot.data.storefrontEnabled);
  const [checkoutMethod, setCheckoutMethod] = useState<CheckoutMethod>(snapshot.data.checkoutMethod);
  const [whatsappNumber, setWhatsappNumber] = useState(snapshot.data.whatsappNumber);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setBusinessName(snapshot.data.businessName);
    setCurrencyCode(snapshot.data.currencyCode);
    setStorefrontEnabled(snapshot.data.storefrontEnabled);
    setCheckoutMethod(snapshot.data.checkoutMethod);
    setWhatsappNumber(snapshot.data.whatsappNumber);
  }, [snapshot.data.businessName, snapshot.data.currencyCode, snapshot.data.storefrontEnabled, snapshot.data.checkoutMethod, snapshot.data.whatsappNumber]);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setSaving(true);
    try {
      await updateBusiness(businessName, currencyCode.toUpperCase(), storefrontEnabled, checkoutMethod, whatsappNumber);
      setMessage("Settings saved.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save settings.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <PageHeader eyebrow="Workspace" title="Settings" description="Keep the workspace name and display currency ready for the business owner." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,640px)_minmax(0,1fr)]">
        <form onSubmit={submit} className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
          <h2 className="font-semibold tracking-tight">Business details</h2>
          <p className="mt-1 text-sm text-muted-foreground">These settings apply to the workspace and its order totals.</p>
          <div className="mt-6 space-y-5">
            <label className={formLabelClass}>Business name<input className={controlClass} value={businessName} onChange={(event) => setBusinessName(event.target.value)} required /></label>
            <label className={formLabelClass}>Currency code<input className={controlClass} maxLength={3} value={currencyCode} onChange={(event) => setCurrencyCode(event.target.value.toUpperCase())} required /><span className="mt-1 block text-xs font-normal text-muted-foreground">NGN is the default. Enter a three-letter ISO code if the business later changes currency.</span></label>
            <label className={formLabelClass}>Customer checkout method<select className={controlClass} disabled={isDemo} onChange={(event) => setCheckoutMethod(event.target.value as CheckoutMethod)} value={checkoutMethod}><option value="paystack">Paystack — online card/bank payment</option><option value="whatsapp">WhatsApp — send the order to the owner</option></select><span className="mt-1 block text-xs font-normal text-muted-foreground">Customers see only the selected option at checkout. WhatsApp requests appear in the private inbox for follow-up.</span></label>
            <label className={formLabelClass}>Business WhatsApp number <span className="font-normal text-muted-foreground">(international format)</span><input className={controlClass} disabled={isDemo} inputMode="tel" onChange={(event) => setWhatsappNumber(event.target.value)} placeholder="2348012345678" value={whatsappNumber} /><span className="mt-1 block text-xs font-normal text-muted-foreground">Used for WhatsApp checkout. Include the country code; spaces and a leading + are cleaned when saved.</span></label>
            <label className="flex items-start gap-3 rounded-lg border bg-muted/20 p-3 text-sm">
              <input checked={storefrontEnabled} className="mt-0.5 size-4 rounded border-input accent-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" disabled={isDemo} onChange={(event) => setStorefrontEnabled(event.target.checked)} type="checkbox" />
              <span>
                <span className="block font-medium">Publish the public store</span>
                <span className="mt-1 block text-xs font-normal leading-5 text-muted-foreground">{isDemo ? "The demo catalog is always visible with sample data. " : "Make active products and in-stock variants visible at "}<Link className="font-medium text-foreground underline underline-offset-4" href="/store">/store</Link>. The selected checkout method controls the public purchase path.</span>
              </span>
            </label>
          </div>
          {message ? <p role="status" className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</p> : null}
          {error ? <p role="alert" className="mt-5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{error}</p> : null}
          <div className="mt-6 flex justify-end"><Button type="submit" disabled={saving}>{saving ? "Saving…" : "Save settings"}</Button></div>
        </form>

        <div className="rounded-xl border bg-card p-5 shadow-sm md:p-6">
          <h2 className="font-semibold tracking-tight">Account & data</h2>
          <div className="mt-5 space-y-4 text-sm leading-6 text-muted-foreground">
            <p><span className="font-semibold text-foreground">Access:</span> the operations workspace remains private. The public store exposes only active catalog items and optional product photos; customer orders, stock movements, and account data remain protected.</p>
            <p><span className="font-semibold text-foreground">Online orders:</span> customer checkout creates an online order after Auth and store validation. Paystack payment state is reconciled server-side when live credentials are configured.</p>
            <p><span className="font-semibold text-foreground">Product photos:</span> upload a JPG, PNG, or WebP up to 5 MB from the product form. Business-scoped Storage policies protect writes and deletes.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
