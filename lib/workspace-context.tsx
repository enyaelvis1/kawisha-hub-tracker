"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { demoData } from "./demo-data";
import { calculateOrderTotalCents } from "./order-calculations";
import type { Order, OrderLine, Product, StockMovement, WorkspaceSnapshot } from "./types";

type ProductInput = {
  name: string;
  category: string;
  description: string;
  variantName: string;
  sku: string;
  priceCents: number;
  stock: number;
  lowStockThreshold: number;
};

type StockInput = {
  variantId: string;
  quantityDelta: number;
  movementType: StockMovement["movementType"];
  reason: string;
};

type ProductEditInput = ProductInput & { productId: string; variantId: string; isActive: boolean };
type VariantInput = { productId: string; variantName: string; sku: string; priceCents: number; stock: number; lowStockThreshold: number };

type OrderInput = {
  customerName: string;
  customerPhone: string;
  source: Order["source"];
  paymentStatus: Order["paymentStatus"];
  notes: string;
  lines: Array<{ variantId: string; quantity: number }>;
};

type WorkspaceContextValue = {
  snapshot: WorkspaceSnapshot;
  isDemo: boolean;
  variants: Product["variants"];
  categories: string[];
  addProduct: (input: ProductInput) => Promise<string>;
  updateProduct: (input: ProductEditInput) => Promise<void>;
  addVariant: (input: VariantInput) => Promise<void>;
  recordStock: (input: StockInput) => Promise<void>;
  createOrder: (input: OrderInput) => Promise<void>;
  updateOrderStatus: (orderId: string, status: Order["status"]) => Promise<void>;
  updatePaymentStatus: (orderId: string, status: Order["paymentStatus"]) => Promise<void>;
  updateBusiness: (businessName: string, currencyCode: string, storefrontEnabled: boolean) => Promise<void>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

function withUpdatedVariant(snapshot: WorkspaceSnapshot, variantId: string, stock: number) {
  return {
    ...snapshot,
    data: {
      ...snapshot.data,
      products: snapshot.data.products.map((product) => ({
        ...product,
        variants: product.variants.map((variant) => (variant.id === variantId ? { ...variant, stock } : variant)),
      })),
    },
  };
}

export function WorkspaceProvider({ initialSnapshot, children }: { initialSnapshot: WorkspaceSnapshot; children: React.ReactNode }) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  useEffect(() => { setSnapshot(initialSnapshot); }, [initialSnapshot]);
  const isDemo = snapshot.mode === "demo";
  const variants = useMemo(() => snapshot.data.products.flatMap((product) => product.variants), [snapshot.data.products]);
  const categories = useMemo(
    () => Array.from(new Set(snapshot.data.products.map((product) => product.category))).sort(),
    [snapshot.data.products],
  );

  async function addProduct(input: ProductInput) {
    if (!isDemo) {
      const { createProduct } = await import("@/app/(app)/actions");
      const productId = await createProduct(input);
      router.refresh();
      return productId;
    }
    const id = `demo-product-${Date.now()}`;
    const variantId = `demo-variant-${Date.now()}`;
    const variant = {
      id: variantId,
      productId: id,
      productName: input.name,
      category: input.category,
      variantName: input.variantName,
      sku: input.sku,
      priceCents: input.priceCents,
      stock: input.stock,
      lowStockThreshold: input.lowStockThreshold,
      isActive: true,
    };
    const product: Product = { id, name: input.name, category: input.category, description: input.description, isActive: true, variants: [variant] };
    setSnapshot((current) => ({ ...current, data: { ...current.data, products: [product, ...current.data.products] } }));
    return id;
  }

  async function recordStock(input: StockInput) {
    if (!isDemo) {
      const { recordStockMovement } = await import("@/app/(app)/actions");
      await recordStockMovement(input);
      router.refresh();
      return;
    }
    const variant = variants.find((item) => item.id === input.variantId);
    if (!variant || variant.stock + input.quantityDelta < 0) throw new Error("Stock cannot become negative");
    const movement: StockMovement = {
      id: `demo-movement-${Date.now()}`,
      variantId: variant.id,
      productName: variant.productName,
      variantName: variant.variantName,
      movementType: input.movementType,
      quantityDelta: input.quantityDelta,
      reason: input.reason,
      createdAt: new Date().toISOString(),
    };
    setSnapshot((current) => {
      const updated = withUpdatedVariant(current, input.variantId, variant.stock + input.quantityDelta);
      return { ...updated, data: { ...updated.data, movements: [movement, ...updated.data.movements] } };
    });
  }

  async function updateProduct(input: ProductEditInput) {
    if (!isDemo) {
      const { updateProduct: updateLiveProduct } = await import("@/app/(app)/actions");
      await updateLiveProduct(input);
      router.refresh();
      return;
    }
    setSnapshot((current) => ({
      ...current,
      data: {
        ...current.data,
        products: current.data.products.map((product) => product.id !== input.productId ? product : {
          ...product,
          name: input.name,
          category: input.category,
          description: input.description,
          isActive: input.isActive,
          variants: product.variants.map((variant) => variant.id !== input.variantId ? variant : { ...variant, productName: input.name, category: input.category, variantName: input.variantName, sku: input.sku, priceCents: input.priceCents, lowStockThreshold: input.lowStockThreshold, isActive: input.isActive }),
        }),
      },
    }));
  }

  async function addVariant(input: VariantInput) {
    if (!isDemo) {
      const { addVariant: addLiveVariant } = await import("@/app/(app)/actions");
      await addLiveVariant(input);
      router.refresh();
      return;
    }
    const product = snapshot.data.products.find((item) => item.id === input.productId);
    if (!product) throw new Error("Product not found");
    const variant = { id: `demo-variant-${Date.now()}`, productId: product.id, productName: product.name, category: product.category, variantName: input.variantName, sku: input.sku, priceCents: input.priceCents, stock: input.stock, lowStockThreshold: input.lowStockThreshold, isActive: true };
    setSnapshot((current) => ({ ...current, data: { ...current.data, products: current.data.products.map((item) => item.id === product.id ? { ...item, variants: [...item.variants, variant] } : item) } }));
  }

  async function createOrder(input: OrderInput) {
    const lines: OrderLine[] = input.lines.map((line, index) => {
      const variant = variants.find((item) => item.id === line.variantId);
      if (!variant) throw new Error("Choose a valid product variant");
      if (!Number.isInteger(line.quantity) || line.quantity < 1) throw new Error("Order quantities must be positive whole numbers");
      return {
        id: `demo-line-${Date.now()}-${index}`,
        variantId: variant.id,
        productName: variant.productName,
        variantName: variant.variantName,
        sku: variant.sku,
        quantity: line.quantity,
        unitPriceCents: variant.priceCents,
      };
    });
    if (!isDemo) {
      const { createOrder: createLiveOrder } = await import("@/app/(app)/actions");
      await createLiveOrder({ ...input, lines: input.lines });
      router.refresh();
      return;
    }
    const order: Order = {
      id: `demo-order-${Date.now()}`,
      orderNumber: `KH-DEMO-${String(snapshot.data.orders.length + 15).padStart(3, "0")}`,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      source: input.source,
      status: "new",
      paymentStatus: input.paymentStatus,
      notes: input.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lines,
    };
    setSnapshot((current) => ({ ...current, data: { ...current.data, orders: [order, ...current.data.orders] } }));
  }

  async function updateOrderStatus(orderId: string, status: Order["status"]) {
    if (!isDemo) {
      const { updateOrderStatus: updateLiveOrderStatus } = await import("@/app/(app)/actions");
      await updateLiveOrderStatus(orderId, status);
      router.refresh();
      return;
    }
    setSnapshot((current) => {
      const order = current.data.orders.find((item) => item.id === orderId);
      if (!order || order.status === status) return current;
      let next = current;
      if (status === "confirmed" && order.status !== "confirmed") {
        for (const line of order.lines) {
          const variant = next.data.products.flatMap((product) => product.variants).find((item) => item.id === line.variantId);
          if (!variant || variant.stock < line.quantity) throw new Error(`${line.productName} does not have enough stock`);
          next = withUpdatedVariant(next, line.variantId, variant.stock - line.quantity);
        }
      }
      if (status === "cancelled" && order.status !== "cancelled" && order.status !== "new") {
        for (const line of order.lines) {
          const variant = next.data.products.flatMap((product) => product.variants).find((item) => item.id === line.variantId);
          if (variant) next = withUpdatedVariant(next, line.variantId, variant.stock + line.quantity);
        }
      }
      const updatedOrder = { ...order, status, updatedAt: new Date().toISOString() };
      return { ...next, data: { ...next.data, orders: next.data.orders.map((item) => item.id === orderId ? updatedOrder : item) } };
    });
  }

  async function updatePaymentStatus(orderId: string, status: Order["paymentStatus"]) {
    if (!isDemo) {
      const { updatePaymentStatus: updateLivePaymentStatus } = await import("@/app/(app)/actions");
      await updateLivePaymentStatus(orderId, status);
      router.refresh();
      return;
    }
    setSnapshot((current) => ({
      ...current,
      data: { ...current.data, orders: current.data.orders.map((order) => order.id === orderId ? { ...order, paymentStatus: status, updatedAt: new Date().toISOString() } : order) },
    }));
  }

  async function updateBusiness(businessName: string, currencyCode: string, storefrontEnabled: boolean) {
    if (!isDemo) {
      const { updateBusinessSettings } = await import("@/app/(app)/actions");
      await updateBusinessSettings({ businessName, currencyCode, storefrontEnabled });
      router.refresh();
      return;
    }
    setSnapshot((current) => ({ ...current, data: { ...current.data, businessName, currencyCode, storefrontEnabled } }));
  }

  return <WorkspaceContext.Provider value={{ snapshot, isDemo, variants, categories, addProduct, updateProduct, addVariant, recordStock, createOrder, updateOrderStatus, updatePaymentStatus, updateBusiness }}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("useWorkspace must be used within WorkspaceProvider");
  return value;
}

export function getOrderTotal(order: Order) {
  return calculateOrderTotalCents(order.lines);
}

export { demoData };
