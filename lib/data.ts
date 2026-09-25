import { demoData } from "./demo-data";
import { hasEnvVars } from "./utils";
import { createClient } from "./supabase/server";
import { formatCurrency } from "./format";
import type { Order, OrderLine, Product, PublicStoreSnapshot, StockMovement, WhatsAppOrderLine, WhatsAppOrderRequest, WhatsAppRequestStatus, WorkspaceSnapshot } from "./types";

function numericToCents(value: string | number | null | undefined) {
  return Math.round(Number(value ?? 0) * 100);
}

function productImageUrl(imagePath: string | null | undefined) {
  if (!imagePath || !process.env.NEXT_PUBLIC_SUPABASE_URL) return null;
  const encodedPath = imagePath.split("/").map((part) => encodeURIComponent(part)).join("/");
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/$/, "")}/storage/v1/object/public/product-images/${encodedPath}`;
}

function parseWhatsAppLines(value: unknown): WhatsAppOrderLine[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item): WhatsAppOrderLine[] => {
    if (!item || typeof item !== "object") return [];
    const line = item as Record<string, unknown>;
    if (typeof line.variant_id !== "string" || typeof line.product_name !== "string" || typeof line.variant_name !== "string" || typeof line.sku !== "string") return [];
    const quantity = Number(line.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) return [];
    return [{
      variantId: line.variant_id,
      productName: line.product_name,
      variantName: line.variant_name,
      sku: line.sku,
      quantity,
      unitPriceCents: numericToCents(line.unit_price as string | number | null | undefined),
    }];
  });
}

function isMissingWhatsAppInboxTable(error: { code?: string; message?: string } | null) {
  return error?.code === "PGRST205" && error.message?.includes("whatsapp_order_requests");
}

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  if (!hasEnvVars) return { mode: "demo", hasMembership: true, data: demoData };

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("Authentication is required");

  const { data: membership, error: membershipError } = await supabase
    .from("business_members")
    .select("business_id, businesses(id, name, currency_code, storefront_enabled, checkout_method)")
    .eq("user_id", userData.user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError) throw membershipError;

  const business = Array.isArray(membership?.businesses) ? membership?.businesses[0] : membership?.businesses;
  if (!membership || !business) {
    return { mode: "live", hasMembership: false, data: { ...demoData, businessName: "Kawisha Hub NG", storefrontEnabled: false, products: [], orders: [], movements: [], whatsappRequests: [], whatsappInboxAvailable: false } };
  }

  const [{ data: rawProducts, error: productError }, { data: rawOrders, error: orderError }, { data: rawMovements, error: movementError }, { data: rawWhatsAppRequests, error: whatsappRequestError }] = await Promise.all([
    supabase.from("products").select("id,name,description,image_path,is_active,categories(name),product_variants(id,product_id,variant_name,sku,selling_price,quantity_on_hand,low_stock_threshold,is_active)").eq("business_id", membership.business_id).order("created_at", { ascending: false }),
    supabase.from("orders").select("id,order_number,customer_name,customer_phone,source,status,payment_status,notes,created_at,updated_at,order_lines(id,variant_id,quantity,unit_price,product_variants(variant_name,sku,products(name)))").eq("business_id", membership.business_id).order("created_at", { ascending: false }),
    supabase.from("stock_movements").select("id,variant_id,movement_type,quantity_delta,reason,created_at,order_id,product_variants(variant_name,products(name)),orders(order_number)").eq("business_id", membership.business_id).order("created_at", { ascending: false }).limit(50),
    supabase.from("whatsapp_order_requests").select("id,request_number,customer_name,customer_phone,customer_email,delivery_address,note,line_items,total_amount,status,created_at,updated_at").eq("business_id", membership.business_id).order("created_at", { ascending: false }).limit(100),
  ]);
  if (productError) throw productError;
  if (orderError) throw orderError;
  if (movementError) throw movementError;
  const whatsappInboxAvailable = !whatsappRequestError || !isMissingWhatsAppInboxTable(whatsappRequestError);
  if (whatsappRequestError && whatsappInboxAvailable) throw whatsappRequestError;

  const products: Product[] = (rawProducts ?? []).map((product) => {
    const categoryRelation = product.categories as unknown as { name?: string } | { name?: string }[] | null;
    const category = Array.isArray(categoryRelation) ? categoryRelation[0]?.name : categoryRelation?.name;
    const variants = (Array.isArray(product.product_variants) ? product.product_variants : []).map((variant) => ({
      id: variant.id,
      productId: variant.product_id,
      productName: product.name,
      category: category ?? "Uncategorised",
      variantName: variant.variant_name,
      sku: variant.sku,
      priceCents: numericToCents(variant.selling_price),
      stock: variant.quantity_on_hand,
      lowStockThreshold: variant.low_stock_threshold,
      isActive: variant.is_active,
    }));
    return { id: product.id, name: product.name, description: product.description ?? "", category: category ?? "Uncategorised", imagePath: product.image_path, imageUrl: productImageUrl(product.image_path), isActive: product.is_active, variants };
  });

  const orders: Order[] = (rawOrders ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerPhone: order.customer_phone ?? "",
    source: order.source,
    status: order.status,
    paymentStatus: order.payment_status,
    notes: order.notes ?? "",
    createdAt: order.created_at,
    updatedAt: order.updated_at,
    lines: (Array.isArray(order.order_lines) ? order.order_lines : []).map((line): OrderLine => {
      const variant = Array.isArray(line.product_variants) ? line.product_variants[0] : line.product_variants;
      const lineProduct = variant && (Array.isArray(variant.products) ? variant.products[0] : variant.products);
      return { id: line.id, variantId: line.variant_id, productName: lineProduct?.name ?? "Product", variantName: variant?.variant_name ?? "Variant", sku: variant?.sku ?? "", quantity: line.quantity, unitPriceCents: numericToCents(line.unit_price) };
    }),
  }));

  const movements: StockMovement[] = (rawMovements ?? []).map((movement) => {
    const variant = Array.isArray(movement.product_variants) ? movement.product_variants[0] : movement.product_variants;
    const product = variant && (Array.isArray(variant.products) ? variant.products[0] : variant.products);
    const order = Array.isArray(movement.orders) ? movement.orders[0] : movement.orders;
    return { id: movement.id, variantId: movement.variant_id, productName: product?.name ?? "Product", variantName: variant?.variant_name ?? "Variant", movementType: movement.movement_type, quantityDelta: movement.quantity_delta, reason: movement.reason, orderNumber: order?.order_number, createdAt: movement.created_at };
  });

  const whatsappRequests: WhatsAppOrderRequest[] = (whatsappInboxAvailable ? rawWhatsAppRequests ?? [] : []).map((request) => ({
    id: request.id,
    requestNumber: request.request_number,
    customerName: request.customer_name,
    customerPhone: request.customer_phone,
    customerEmail: request.customer_email ?? "",
    deliveryAddress: request.delivery_address ?? "",
    note: request.note ?? "",
    status: request.status as WhatsAppRequestStatus,
    totalCents: numericToCents(request.total_amount),
    createdAt: request.created_at,
    updatedAt: request.updated_at,
    lines: parseWhatsAppLines(request.line_items),
  }));

  return { mode: "live", hasMembership: true, data: { businessName: business.name, currencyCode: business.currency_code, storefrontEnabled: business.storefront_enabled, checkoutMethod: business.checkout_method, products, orders, movements, whatsappRequests, whatsappInboxAvailable } };
}

export async function getPublicStoreSnapshot(): Promise<PublicStoreSnapshot> {
  if (!hasEnvVars) {
    return {
      mode: "demo",
      data: {
        businessName: demoData.businessName,
        currencyCode: demoData.currencyCode,
        businessId: "demo-business",
        isPublished: true,
        checkoutMethod: demoData.checkoutMethod,
        whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
        products: demoData.products.filter((product) => product.isActive),
      },
    };
  }

  const supabase = await createClient();
  const { data: business, error: businessError } = await supabase
    .from("businesses")
    .select("id,name,currency_code,storefront_enabled,checkout_method")
    .eq("storefront_enabled", true)
    .limit(1)
    .maybeSingle();
  if (businessError) throw businessError;

  if (!business) {
    return {
      mode: "live",
      data: {
        businessId: null,
        businessName: "Kawisha Hub NG",
        currencyCode: "NGN",
        isPublished: false,
        checkoutMethod: "paystack",
        whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
        products: [],
      },
    };
  }

  const { data: rawProducts, error: productError } = await supabase
    .from("products")
    .select("id,name,description,image_path,is_active,categories(name),product_variants(id,product_id,variant_name,sku,selling_price,quantity_on_hand,low_stock_threshold,is_active)")
    .eq("business_id", business.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });
  if (productError) throw productError;

  const products: Product[] = (rawProducts ?? []).map((product) => {
    const categoryRelation = product.categories as unknown as { name?: string } | { name?: string }[] | null;
    const category = Array.isArray(categoryRelation) ? categoryRelation[0]?.name : categoryRelation?.name;
    const variants = (Array.isArray(product.product_variants) ? product.product_variants : [])
      .filter((variant) => variant.is_active)
      .map((variant) => ({
        id: variant.id,
        productId: variant.product_id,
        productName: product.name,
        category: category ?? "Uncategorised",
        variantName: variant.variant_name,
        sku: variant.sku,
        priceCents: numericToCents(variant.selling_price),
        stock: variant.quantity_on_hand,
        lowStockThreshold: variant.low_stock_threshold,
        isActive: variant.is_active,
      }));
    return { id: product.id, name: product.name, description: product.description ?? "", category: category ?? "Uncategorised", imagePath: product.image_path, imageUrl: productImageUrl(product.image_path), isActive: product.is_active, variants };
  }).filter((product) => product.variants.length > 0);

  return {
    mode: "live",
    data: {
      businessId: business.id,
      businessName: business.name,
      currencyCode: business.currency_code,
      isPublished: true,
      checkoutMethod: business.checkout_method,
      whatsappNumber: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "",
      products,
    },
  };
}

export async function getCustomerOrderSummaries() {
  if (!hasEnvVars) return [];
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) return [];
  const { data, error } = await supabase
    .from("orders")
    .select("id,order_number,total_amount,status,payment_status,created_at")
    .eq("customer_user_id", userData.user.id)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((order) => ({
    id: order.id,
    orderNumber: order.order_number,
    total: formatCurrency(numericToCents(order.total_amount)),
    status: order.status,
    paymentStatus: order.payment_status,
    createdAt: order.created_at,
  }));
}
