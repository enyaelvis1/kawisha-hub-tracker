export type OrderStatus = "new" | "confirmed" | "ready" | "completed" | "cancelled";
export type PaymentStatus = "unpaid" | "partial" | "paid";
export type OrderSource = "whatsapp" | "instagram" | "phone" | "in_person" | "other" | "web";
export type MovementType = "opening_stock" | "restock" | "manual_correction" | "order_confirmed" | "order_cancelled";

export type Variant = {
  id: string;
  productId: string;
  productName: string;
  category: string;
  variantName: string;
  sku: string;
  priceCents: number;
  stock: number;
  lowStockThreshold: number;
  isActive: boolean;
};

export type Product = {
  id: string;
  name: string;
  description: string;
  category: string;
  imagePath?: string | null;
  imageUrl?: string | null;
  isActive: boolean;
  variants: Variant[];
};

export type OrderLine = {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  sku: string;
  quantity: number;
  unitPriceCents: number;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone?: string;
  source: OrderSource;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lines: OrderLine[];
};

export type StockMovement = {
  id: string;
  variantId: string;
  productName: string;
  variantName: string;
  movementType: MovementType;
  quantityDelta: number;
  reason: string;
  createdAt: string;
  orderNumber?: string;
};

export type WorkspaceData = {
  businessName: string;
  currencyCode: string;
  storefrontEnabled: boolean;
  products: Product[];
  orders: Order[];
  movements: StockMovement[];
};

export type WorkspaceMode = "demo" | "live";

export type WorkspaceSnapshot = {
  mode: WorkspaceMode;
  hasMembership: boolean;
  data: WorkspaceData;
};

export type PublicStoreData = {
  businessId: string | null;
  businessName: string;
  currencyCode: string;
  isPublished: boolean;
  products: Product[];
};

export type PublicStoreSnapshot = {
  mode: WorkspaceMode;
  data: PublicStoreData;
};
