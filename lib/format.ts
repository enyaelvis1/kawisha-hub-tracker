import type { OrderSource, OrderStatus, PaymentStatus } from "./types";

export function formatCurrency(cents: number, currencyCode = "NGN") {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currencyCode,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-NG", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function decimalToCents(value: string) {
  const normalized = value.trim().replace(/,/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [whole, fraction = ""] = normalized.split(".");
  return Number.parseInt(whole, 10) * 100 + Number.parseInt(fraction.padEnd(2, "0"), 10);
}

export function centsToDecimal(cents: number) {
  return (cents / 100).toFixed(2);
}

export const sourceLabels: Record<OrderSource, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  phone: "Phone",
  in_person: "In person",
  other: "Other",
  web: "Online store",
};

export const statusLabels: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  ready: "Ready",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const paymentLabels: Record<PaymentStatus, string> = {
  unpaid: "Unpaid",
  partial: "Partial",
  paid: "Paid",
};

export function titleCase(value: string) {
  return value.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}
