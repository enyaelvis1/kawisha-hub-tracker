import { BackLink, PageHeader } from "@/components/app-shell";
import { OrderForm } from "@/components/order-form";

export default function NewOrderPage() {
  return <div><BackLink href="/orders">Back to orders</BackLink><PageHeader eyebrow="Sales log" title="Record an order" description="Capture an order your team received through WhatsApp, Instagram, phone, in person, or another channel." /><div className="max-w-3xl rounded-xl border bg-card p-5 shadow-sm md:p-7"><OrderForm /></div></div>;
}
