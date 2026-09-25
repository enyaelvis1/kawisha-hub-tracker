import { Suspense } from "react";
import { OrderDetail } from "@/components/order-detail";

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<div className="min-h-[50vh] rounded-2xl bg-white" aria-label="Loading order" />}><OrderDetailWithParams params={params} /></Suspense>;
}

async function OrderDetailWithParams({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <OrderDetail orderId={id} />;
}
