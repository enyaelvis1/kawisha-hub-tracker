"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CheckoutMethod, OrderSource, OrderStatus, PaymentStatus, MovementType, WhatsAppRequestStatus } from "@/lib/types";

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

type ProductEditInput = ProductInput & { productId: string; variantId: string; isActive: boolean };
type VariantInput = { productId: string; variantName: string; sku: string; priceCents: number; stock: number; lowStockThreshold: number };

type StockInput = {
  variantId: string;
  quantityDelta: number;
  movementType: MovementType;
  reason: string;
};

type OrderInput = {
  customerName: string;
  customerPhone: string;
  source: OrderSource;
  paymentStatus: PaymentStatus;
  notes: string;
  lines: Array<{ variantId: string; quantity: number }>;
};

async function getBusinessContext() {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error("You must be signed in");
  const { data: membership, error } = await supabase.from("business_members").select("business_id").eq("user_id", userData.user.id).limit(1).maybeSingle();
  if (error) throw error;
  if (!membership) throw new Error("No business is connected to this account yet");
  return { supabase, userId: userData.user.id, businessId: membership.business_id };
}

function requireWholeNumber(value: number, label: string, minimum = 0) {
  if (!Number.isInteger(value) || value < minimum) throw new Error(`${label} must be a whole number of at least ${minimum}`);
}

export async function createProduct(input: ProductInput) {
  const { supabase, businessId } = await getBusinessContext();
  requireWholeNumber(input.priceCents, "Price");
  requireWholeNumber(input.stock, "Opening stock");
  requireWholeNumber(input.lowStockThreshold, "Low-stock threshold");
  if (!input.name.trim() || !input.variantName.trim() || !input.sku.trim() || !input.category.trim()) throw new Error("Name, category, variant, and SKU are required");

  const categoryResult = await supabase.from("categories").select("id").eq("business_id", businessId).eq("name", input.category.trim()).maybeSingle();
  let category = categoryResult.data;
  if (categoryResult.error) throw categoryResult.error;
  if (!category) {
    const result = await supabase.from("categories").insert({ business_id: businessId, name: input.category.trim() }).select("id").single();
    if (result.error) throw result.error;
    category = result.data;
  }
  const productResult = await supabase.from("products").insert({ business_id: businessId, category_id: category.id, name: input.name.trim(), description: input.description.trim() }).select("id").single();
  if (productResult.error) throw productResult.error;
  const variantResult = await supabase.from("product_variants").insert({ business_id: businessId, product_id: productResult.data.id, variant_name: input.variantName.trim(), sku: input.sku.trim(), selling_price: (input.priceCents / 100).toFixed(2), quantity_on_hand: 0, low_stock_threshold: input.lowStockThreshold }).select("id").single();
  if (variantResult.error) {
    await supabase.from("products").delete().eq("id", productResult.data.id).eq("business_id", businessId);
    throw variantResult.error;
  }
  if (input.stock > 0) {
    const movement = await supabase.rpc("record_stock_movement", { p_variant_id: variantResult.data.id, p_quantity_delta: input.stock, p_movement_type: "opening_stock", p_reason: "Opening stock" });
    if (movement.error) throw movement.error;
  }
  revalidatePath("/dashboard");
  revalidatePath("/products");
  return productResult.data.id;
}

export async function recordStockMovement(input: StockInput) {
  const { supabase } = await getBusinessContext();
  requireWholeNumber(Math.abs(input.quantityDelta), "Stock quantity", 1);
  if (!input.reason.trim()) throw new Error("A reason is required for every stock movement");
  const { error } = await supabase.rpc("record_stock_movement", { p_variant_id: input.variantId, p_quantity_delta: input.quantityDelta, p_movement_type: input.movementType, p_reason: input.reason.trim() });
  if (error) throw error;
  revalidatePath("/dashboard");
  revalidatePath("/stock");
  revalidatePath("/products");
}

export async function updateProduct(input: ProductEditInput) {
  const { supabase, businessId } = await getBusinessContext();
  requireWholeNumber(input.priceCents, "Price");
  requireWholeNumber(input.lowStockThreshold, "Low-stock threshold");
  if (!input.name.trim() || !input.variantName.trim() || !input.sku.trim() || !input.category.trim()) throw new Error("Name, category, variant, and SKU are required");
  const categoryResult = await supabase.from("categories").select("id").eq("business_id", businessId).eq("name", input.category.trim()).maybeSingle();
  if (categoryResult.error) throw categoryResult.error;
  let category = categoryResult.data;
  if (!category) {
    const createdCategory = await supabase.from("categories").insert({ business_id: businessId, name: input.category.trim() }).select("id").single();
    if (createdCategory.error) throw createdCategory.error;
    category = createdCategory.data;
  }
  const productResult = await supabase.from("products").update({ category_id: category.id, name: input.name.trim(), description: input.description.trim(), is_active: input.isActive }).eq("id", input.productId).eq("business_id", businessId);
  if (productResult.error) throw productResult.error;
  const variantResult = await supabase.from("product_variants").update({ variant_name: input.variantName.trim(), sku: input.sku.trim(), selling_price: (input.priceCents / 100).toFixed(2), low_stock_threshold: input.lowStockThreshold, is_active: input.isActive }).eq("id", input.variantId).eq("business_id", businessId);
  if (variantResult.error) throw variantResult.error;
  revalidatePath("/dashboard");
  revalidatePath("/products");
}

export async function addVariant(input: VariantInput) {
  const { supabase, businessId } = await getBusinessContext();
  requireWholeNumber(input.priceCents, "Price");
  requireWholeNumber(input.stock, "Opening stock");
  requireWholeNumber(input.lowStockThreshold, "Low-stock threshold");
  if (!input.variantName.trim() || !input.sku.trim()) throw new Error("Variant name and SKU are required");
  const product = await supabase.from("products").select("id").eq("id", input.productId).eq("business_id", businessId).maybeSingle();
  if (product.error) throw product.error;
  if (!product.data) throw new Error("Product not found");
  const variantResult = await supabase.from("product_variants").insert({ business_id: businessId, product_id: input.productId, variant_name: input.variantName.trim(), sku: input.sku.trim(), selling_price: (input.priceCents / 100).toFixed(2), quantity_on_hand: 0, low_stock_threshold: input.lowStockThreshold }).select("id").single();
  if (variantResult.error) throw variantResult.error;
  if (input.stock > 0) {
    const movement = await supabase.rpc("record_stock_movement", { p_variant_id: variantResult.data.id, p_quantity_delta: input.stock, p_movement_type: "opening_stock", p_reason: "Opening stock" });
    if (movement.error) throw movement.error;
  }
  revalidatePath("/products");
  revalidatePath("/dashboard");
}

export async function createOrder(input: OrderInput) {
  const { supabase, businessId } = await getBusinessContext();
  if (!input.customerName.trim() || input.lines.length === 0) throw new Error("Customer name and at least one item are required");
  for (const line of input.lines) requireWholeNumber(line.quantity, "Order quantity", 1);
  const variantIds = input.lines.map((line) => line.variantId);
  const { data: variants, error: variantError } = await supabase.from("product_variants").select("id,selling_price").eq("business_id", businessId).in("id", variantIds);
  if (variantError) throw variantError;
  if (!variants || variants.length !== new Set(variantIds).size) throw new Error("One or more selected variants are not available");
  const priceById = new Map(variants.map((variant) => [variant.id, variant.selling_price]));
  const orderNumber = `KH-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
  const orderResult = await supabase.from("orders").insert({ business_id: businessId, order_number: orderNumber, customer_name: input.customerName.trim(), customer_phone: input.customerPhone.trim(), source: input.source, payment_status: input.paymentStatus, notes: input.notes.trim() }).select("id").single();
  if (orderResult.error) throw orderResult.error;
  const lineResult = await supabase.from("order_lines").insert(input.lines.map((line) => ({ business_id: businessId, order_id: orderResult.data.id, variant_id: line.variantId, quantity: line.quantity, unit_price: priceById.get(line.variantId) })));
  if (lineResult.error) {
    await supabase.from("orders").delete().eq("id", orderResult.data.id).eq("business_id", businessId);
    throw lineResult.error;
  }
  revalidatePath("/dashboard");
  revalidatePath("/orders");
}

export async function updateOrderStatus(orderId: string, status: OrderStatus) {
  const { supabase, businessId } = await getBusinessContext();
  if (status === "confirmed") {
    const { error } = await supabase.rpc("confirm_order", { p_order_id: orderId });
    if (error) throw error;
  } else if (status === "cancelled") {
    const { error } = await supabase.rpc("cancel_order", { p_order_id: orderId });
    if (error) throw error;
  } else {
    const { error } = await supabase.from("orders").update({ status }).eq("id", orderId).eq("business_id", businessId);
    if (error) throw error;
  }
  revalidatePath("/dashboard");
  revalidatePath("/orders");
  revalidatePath("/stock");
  revalidatePath("/products");
}

export async function updatePaymentStatus(orderId: string, status: PaymentStatus) {
  const { supabase, businessId } = await getBusinessContext();
  const { error } = await supabase.from("orders").update({ payment_status: status }).eq("id", orderId).eq("business_id", businessId);
  if (error) throw error;
  revalidatePath("/dashboard");
  revalidatePath("/orders");
}

export async function updateWhatsAppRequestStatus(requestId: string, status: WhatsAppRequestStatus) {
  const { supabase, businessId } = await getBusinessContext();
  if (!["new", "contacted", "converted", "closed"].includes(status)) throw new Error("Invalid WhatsApp request status");
  const { error } = await supabase
    .from("whatsapp_order_requests")
    .update({ status })
    .eq("id", requestId)
    .eq("business_id", businessId);
  if (error) throw error;
  revalidatePath("/inbox");
  revalidatePath("/dashboard");
}

export async function updateBusinessSettings(input: { businessName: string; currencyCode: string; storefrontEnabled: boolean; checkoutMethod: CheckoutMethod }) {
  const { supabase, businessId } = await getBusinessContext();
  if (!input.businessName.trim() || !/^[A-Z]{3}$/.test(input.currencyCode)) throw new Error("Business name and a three-letter currency code are required");
  if (input.checkoutMethod !== "paystack" && input.checkoutMethod !== "whatsapp") throw new Error("Choose a valid checkout method");
  const { error } = await supabase.from("businesses").update({ name: input.businessName.trim(), currency_code: input.currencyCode, storefront_enabled: input.storefrontEnabled, checkout_method: input.checkoutMethod }).eq("id", businessId);
  if (error) throw error;
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidatePath("/store");
}

export async function uploadProductImage(formData: FormData) {
  const { supabase, businessId } = await getBusinessContext();
  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("image");
  if (!productId || !(file instanceof File) || file.size === 0) throw new Error("Choose an image to upload");
  if (file.size > 5 * 1024 * 1024) throw new Error("Product images must be 5 MB or smaller");

  const extensionByType: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
  };
  const extension = extensionByType[file.type];
  if (!extension) throw new Error("Use a JPG, PNG, or WebP image");

  const productResult = await supabase.from("products").select("id,image_path").eq("id", productId).eq("business_id", businessId).maybeSingle();
  if (productResult.error) throw productResult.error;
  if (!productResult.data) throw new Error("Product not found");

  const path = `${businessId}/${productId}/${crypto.randomUUID()}.${extension}`;
  const uploadResult = await supabase.storage.from("product-images").upload(path, file, { contentType: file.type, upsert: false });
  if (uploadResult.error) throw uploadResult.error;

  const updateResult = await supabase.from("products").update({ image_path: path }).eq("id", productId).eq("business_id", businessId);
  if (updateResult.error) {
    await supabase.storage.from("product-images").remove([path]);
    throw updateResult.error;
  }

  if (productResult.data.image_path) await supabase.storage.from("product-images").remove([productResult.data.image_path]);
  revalidatePath("/products");
  revalidatePath("/dashboard");
  revalidatePath("/store");
}
