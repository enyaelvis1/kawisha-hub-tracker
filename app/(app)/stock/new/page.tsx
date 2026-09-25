import { BackLink, PageHeader } from "@/components/app-shell";
import { StockForm } from "@/components/stock-form";

export default function NewStockMovementPage() {
  return <div><BackLink href="/stock">Back to stock</BackLink><PageHeader eyebrow="Inventory" title="Record a stock movement" description="Record the change and reason so stock history stays trustworthy." /><div className="max-w-2xl rounded-xl border bg-card p-5 shadow-sm md:p-7"><StockForm /></div></div>;
}
