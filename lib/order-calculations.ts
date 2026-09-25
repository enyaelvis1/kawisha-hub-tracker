import type { OrderLine } from "./types";

export function calculateOrderTotalCents(lines: Pick<OrderLine, "quantity" | "unitPriceCents">[]) {
  return lines.reduce((total, line) => total + line.quantity * line.unitPriceCents, 0);
}

export function canConfirmOrder(
  lines: Pick<OrderLine, "variantId" | "quantity">[],
  stockByVariant: ReadonlyMap<string, number>,
) {
  return lines.every((line) => line.quantity > 0 && (stockByVariant.get(line.variantId) ?? 0) >= line.quantity);
}

export function applyStockDelta(stock: number, delta: number) {
  const next = stock + delta;
  if (next < 0) throw new Error("Stock cannot become negative");
  return next;
}
