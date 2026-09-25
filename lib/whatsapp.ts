import { formatCurrency } from "./format";
import type { WhatsAppOrderLine } from "./types";

export function normalizeWhatsAppNumber(value: string) {
  return value.replace(/\D/g, "");
}

export function buildWhatsAppMessage({
  businessName,
  requestNumber,
  customerName,
  customerPhone,
  deliveryAddress,
  note,
  lines,
  totalCents,
  currencyCode,
}: {
  businessName: string;
  requestNumber: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  note: string;
  lines: WhatsAppOrderLine[];
  totalCents: number;
  currencyCode: string;
}) {
  const itemLines = lines.map((line) => `• ${line.quantity} × ${line.productName} (${line.variantName}) — ${formatCurrency(line.quantity * line.unitPriceCents, currencyCode)}`);
  return [
    `Hello ${businessName}, I would like to place an order.`,
    "",
    `Request: ${requestNumber}`,
    `Name: ${customerName}`,
    `WhatsApp: ${customerPhone}`,
    deliveryAddress ? `Delivery address: ${deliveryAddress}` : "Delivery address: To be confirmed",
    "",
    "Items:",
    ...itemLines,
    `Total: ${formatCurrency(totalCents, currencyCode)}`,
    note ? `Note: ${note}` : "",
  ].filter(Boolean).join("\n");
}

export function buildWhatsAppUrl(number: string, message: string) {
  const normalized = normalizeWhatsAppNumber(number);
  if (!normalized) return "";
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
