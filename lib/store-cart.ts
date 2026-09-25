export const STORE_CART_KEY = "kawisha-store-cart-v1";

export type StoreCartLine = {
  variantId: string;
  productId: string;
  productName: string;
  variantName: string;
  sku: string;
  unitPriceCents: number;
  quantity: number;
  imageUrl?: string | null;
};

export function cartTotalCents(lines: StoreCartLine[]) {
  return lines.reduce((total, line) => total + line.unitPriceCents * line.quantity, 0);
}

export function parseStoreCart(value: string | null): StoreCartLine[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((line): StoreCartLine[] => {
      if (!line || typeof line !== "object") return [];
      const candidate = line as Partial<StoreCartLine>;
      const unitPriceCents = candidate.unitPriceCents;
      const quantity = candidate.quantity;
      if (typeof candidate.variantId !== "string" || typeof candidate.productId !== "string" || typeof candidate.productName !== "string" || typeof candidate.variantName !== "string" || typeof candidate.sku !== "string" || typeof unitPriceCents !== "number" || !Number.isInteger(unitPriceCents) || unitPriceCents < 0 || typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) return [];
      return [{ variantId: candidate.variantId, productId: candidate.productId, productName: candidate.productName, variantName: candidate.variantName, sku: candidate.sku, unitPriceCents, quantity, imageUrl: typeof candidate.imageUrl === "string" ? candidate.imageUrl : null }];
    });
  } catch {
    return [];
  }
}
