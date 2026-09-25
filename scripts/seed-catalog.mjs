import fs from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();
const envFile = path.join(root, ".env");
const env = Object.fromEntries(
  fs.readFileSync(envFile, "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const index = line.indexOf("=");
      return [line.slice(0, index), line.slice(index + 1)];
    }),
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !serviceRoleKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env");
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const catalog = [
  ["Classic Cotton Shirt", "Men's Fashion", "A clean everyday shirt for easy weekday dressing.", "Sand / M", "SHIRT-SAND-M", 24000, 18, 5, "sample-everyday-shirt.png"],
  ["Everyday Chino Trousers", "Men's Fashion", "A comfortable pair for workdays and weekends.", "Khaki / 34", "CHINO-KHAKI-34", 32000, 14, 4, "sample-everyday-shirt.png"],
  ["Relaxed Kaftan", "Women's Fashion", "A light, easy silhouette for warm days and slow plans.", "Terracotta / M", "KAFTAN-TERRA-M", 28500, 12, 4, "sample-everyday-shirt.png"],
  ["Soft Knit Cardigan", "Women's Fashion", "A soft layer to finish an everyday outfit.", "Cream / M", "CARDIGAN-CREAM-M", 35000, 10, 3, "sample-everyday-shirt.png"],
  ["Kids Cotton Set", "Kids' Fashion", "A soft, practical set for everyday play.", "Sky / 6-7Y", "KIDS-SET-SKY-67", 18000, 16, 5, "sample-everyday-shirt.png"],
  ["Everyday Slip-on Sneakers", "Footwear", "A comfortable pair for quick errands and busy days.", "White / 39", "SNEAKER-WHITE-39", 38000, 9, 3, "sample-linen-tote.png"],
  ["Kids Slip-on Sneakers", "Footwear", "Easy-on footwear for small, active feet.", "Blue / 31", "KIDS-SNEAKER-BLU-31", 22000, 11, 3, "sample-linen-tote.png"],
  ["Structured Crossbody Bag", "Bags", "A compact bag for the essentials you carry every day.", "Black / Standard", "CROSSBODY-BLK-STD", 29500, 13, 4, "sample-linen-tote.png"],
  ["Woven Everyday Tote", "Bags", "A roomy woven tote for work, market, and weekend plans.", "Natural / Standard", "TOTE-NAT-STD", 18500, 18, 5, "sample-linen-tote.png"],
  ["Minimal Hoop Earrings", "Jewelry", "An easy finishing touch with a clean, minimal profile.", "Gold / Small", "HOOPS-GOLD-S", 9500, 20, 6, "sample-scented-candle.png"],
  ["Beaded Pendant Necklace", "Jewelry", "A simple statement piece for everyday layering.", "Amber / Standard", "PENDANT-AMBER-STD", 12500, 15, 4, "sample-scented-candle.png"],
  ["Amber Mist Perfume", "Perfumes", "A warm, light fragrance for day and evening.", "Amber / 50ml", "PERFUME-AMBER-50", 16000, 12, 4, "sample-scented-candle.png"],
  ["Fresh Citrus Perfume", "Perfumes", "A bright, clean scent with an easy everyday feel.", "Citrus / 50ml", "PERFUME-CITRUS-50", 18500, 9, 3, "sample-scented-candle.png"],
  ["Cedar Reed Diffuser", "Household Items", "A gentle home fragrance for a calm corner.", "Cedar / 100ml", "DIFFUSER-CEDAR-100", 14500, 14, 4, "sample-scented-candle.png"],
  ["Cotton Cushion Pair", "Household Items", "Soft neutral cushions to refresh a sofa or reading nook.", "Cream / 45cm", "CUSHION-CREAM-45", 22000, 10, 3, "sample-linen-tote.png"],
  ["Linen Table Runner", "Household Items", "A natural-texture layer for an everyday table setting.", "Natural / 180cm", "RUNNER-NAT-180", 12000, 17, 5, "sample-linen-tote.png"],
  ["Stoneware Serving Board", "Kitchen Utensils", "A warm, useful board for serving and sharing.", "Stone / Large", "BOARD-STONE-L", 17000, 8, 3, "sample-scented-candle.png"],
  ["Stainless Utensil Set", "Kitchen Utensils", "A practical set for everyday kitchen prep.", "Steel / 5 piece", "UTENSIL-STEEL-5", 25000, 9, 3, "sample-scented-candle.png"],
  ["Travel Pouch", "Bags", "A compact pouch for cables, cosmetics, or small essentials.", "Sand / Medium", "POUCH-SAND-M", 11000, 21, 6, "sample-linen-tote.png"],
  ["Cedar Scented Candle", "Household Items", "A warm candle for a slower evening at home.", "Cedar / 200g", "CANDLE-CEDAR-200", 9500, 16, 5, "sample-scented-candle.png"],
];

const ownerEmail = env.SEED_OWNER_EMAIL?.trim().toLowerCase();
const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers({ page: 1, perPage: 50 });
if (usersError) throw usersError;
const matchingUsers = ownerEmail ? usersData.users.filter((user) => user.email?.toLowerCase() === ownerEmail) : usersData.users;
if (matchingUsers.length !== 1) {
  throw new Error(ownerEmail ? "Expected one Supabase user matching SEED_OWNER_EMAIL, found " + matchingUsers.length : "Expected exactly one Supabase user; set SEED_OWNER_EMAIL when there is more than one (found " + matchingUsers.length + ")");
}
const owner = matchingUsers[0];

let { data: membership, error: membershipError } = await supabase
  .from("business_members")
  .select("business_id")
  .eq("user_id", owner.id)
  .maybeSingle();
if (membershipError) throw membershipError;

let business = null;
if (membership) {
  const result = await supabase.from("businesses").select("id,name,currency_code,storefront_enabled").eq("id", membership.business_id).single();
  if (result.error) throw result.error;
  business = result.data;
} else {
  const existing = await supabase.from("businesses").select("id,name,currency_code,storefront_enabled").eq("name", "Kawisha Hub NG").maybeSingle();
  if (existing.error) throw existing.error;
  if (existing.data) {
    business = existing.data;
  } else {
    const created = await supabase.from("businesses").insert({ name: "Kawisha Hub NG", currency_code: "NGN", storefront_enabled: true }).select("id,name,currency_code,storefront_enabled").single();
    if (created.error) throw created.error;
    business = created.data;
  }
  const attached = await supabase.from("business_members").insert({ business_id: business.id, user_id: owner.id, role: "owner" });
  if (attached.error) throw attached.error;
  membership = { business_id: business.id };
}

const enabled = await supabase.from("businesses").update({ storefront_enabled: true }).eq("id", business.id);
if (enabled.error) throw enabled.error;

const categoryNames = [...new Set(catalog.map((item) => item[1]))];
const categoryByName = new Map();
for (const name of categoryNames) {
  const result = await supabase
    .from("categories")
    .upsert({ business_id: business.id, name }, { onConflict: "business_id,name" })
    .select("id,name")
    .single();
  if (result.error) throw result.error;
  categoryByName.set(name, result.data.id);
}

let createdCount = 0;
let existingCount = 0;
for (const [index, item] of catalog.entries()) {
  const [name, categoryName, description, variantName, sku, price, stock, threshold, imageFile] = item;
  const categoryId = categoryByName.get(categoryName);
  const existing = await supabase
    .from("product_variants")
    .select("id,product_id")
    .eq("business_id", business.id)
    .eq("sku", sku)
    .maybeSingle();
  if (existing.error) throw existing.error;

  let productId;
  if (existing.data) {
    productId = existing.data.product_id;
    existingCount += 1;
    const productUpdate = await supabase.from("products").update({ category_id: categoryId, name, description, is_active: true }).eq("id", productId).eq("business_id", business.id);
    if (productUpdate.error) throw productUpdate.error;
    const variantUpdate = await supabase.from("product_variants").update({ variant_name: variantName, selling_price: price.toFixed(2), low_stock_threshold: threshold, is_active: true }).eq("id", existing.data.id).eq("business_id", business.id);
    if (variantUpdate.error) throw variantUpdate.error;
  } else {
    const productInsert = await supabase.from("products").insert({ business_id: business.id, category_id: categoryId, name, description, is_active: true }).select("id").single();
    if (productInsert.error) throw productInsert.error;
    productId = productInsert.data.id;
    const variantInsert = await supabase.from("product_variants").insert({ business_id: business.id, product_id: productId, variant_name: variantName, sku, selling_price: price.toFixed(2), quantity_on_hand: stock, low_stock_threshold: threshold, is_active: true }).select("id").single();
    if (variantInsert.error) throw variantInsert.error;
    const movementInsert = await supabase.from("stock_movements").insert({ business_id: business.id, variant_id: variantInsert.data.id, movement_type: "opening_stock", quantity_delta: stock, reason: "Seeded opening stock for catalogue", created_by: owner.id });
    if (movementInsert.error) throw movementInsert.error;
    createdCount += 1;
  }

  const imagePath = business.id + "/" + productId + "/seed-" + String(index + 1).padStart(2, "0") + ".png";
  const imageBuffer = fs.readFileSync(path.join(root, "public", "products", imageFile));
  const upload = await supabase.storage.from("product-images").upload(imagePath, imageBuffer, { contentType: "image/png", upsert: true });
  if (upload.error) throw upload.error;
  const imageUpdate = await supabase.from("products").update({ image_path: imagePath }).eq("id", productId).eq("business_id", business.id);
  if (imageUpdate.error) throw imageUpdate.error;
}

console.log("Seeded " + catalog.length + " products for " + business.name + ". Created " + createdCount + "; refreshed " + existingCount + ".");
console.log("Storefront enabled: " + business.id);
console.log("Product images uploaded to the public product-images bucket.");
