"use client";

/* Product photos may come from owner-controlled Supabase Storage URLs. */

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Menu,
  MessageCircle,
  Package,
  Plus,
  Search,
  ShoppingBag,
  ShoppingCart,
  SlidersHorizontal,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/format";
import { cartTotalCents, parseStoreCart, STORE_CART_KEY, type StoreCartLine } from "@/lib/store-cart";
import type { Product, PublicStoreSnapshot, Variant } from "@/lib/types";
import { cn } from "@/lib/utils";
import { WhatsAppOrderDialog } from "@/components/whatsapp-order-dialog";

function ProductCard({ product, currencyCode, onAdd }: { product: Product; currencyCode: string; onAdd: (variant: Variant) => void }) {
  const variants = product.variants.filter((variant) => variant.isActive);
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const lowestPrice = variants[0]?.priceCents ?? 0;
  const totalStock = variants.reduce((total, variant) => total + variant.stock, 0);
  const hasStock = totalStock > 0;

  return (
    <article className="group min-w-0 overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-orange-200 hover:shadow-lg">
      <div className="relative aspect-square overflow-hidden bg-orange-50">
        {product.imageUrl ? (
          <img alt={`${product.name} product photo`} className="absolute inset-0 size-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" src={product.imageUrl} />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-stone-100">
            <div className="flex size-16 items-center justify-center rounded-2xl border border-orange-200 bg-white/80 text-orange-600 shadow-sm"><Package aria-hidden="true" className="size-7" /></div>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/30 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm backdrop-blur">{product.category}</span>
        <span className={cn("absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm", hasStock ? "bg-white/95 text-emerald-700" : "bg-slate-950/75 text-white")}>{hasStock ? `${totalStock} available` : "Sold out"}</span>
      </div>

      <div className="p-3 sm:p-3.5">
        <h2 className="line-clamp-2 text-sm font-semibold leading-5 tracking-tight sm:min-h-10">{product.name}</h2>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-x-2 gap-y-1">
          <div><p className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">From</p><p className="mt-0.5 text-base font-bold tabular-nums text-slate-950 dark:text-white sm:text-lg">{formatCurrency(lowestPrice, currencyCode)}</p></div>
          <span className="shrink-0 text-right text-[11px] text-muted-foreground">{variants.length} {variants.length === 1 ? "option" : "options"}</span>
        </div>

        <div className="mt-3 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
          {variants.length > 1 ? (
            <label className="relative min-w-0 flex-1">
              <span className="sr-only">Choose a variant for {product.name}</span>
              <select aria-label={`Choose a variant for ${product.name}`} className="h-9 w-full appearance-none truncate rounded-lg border bg-background px-2.5 pr-7 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500" onChange={(event) => setSelectedVariantId(event.target.value)} value={selectedVariantId}>{variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.variantName} · {variant.stock > 0 ? `${variant.stock} left` : "Sold out"}</option>)}</select>
              <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            </label>
          ) : <span className="min-w-0 flex-1 truncate rounded-lg bg-muted/60 px-2.5 py-2 text-xs font-medium text-muted-foreground">{selectedVariant?.variantName ?? "Available variant"}</span>}
          <Button aria-label={`Add ${product.name} to cart`} className="w-full shrink-0 bg-orange-600 text-white shadow-sm hover:bg-orange-700 sm:w-auto" disabled={!selectedVariant || selectedVariant.stock < 1} onClick={() => selectedVariant && onAdd(selectedVariant)} size="sm" type="button"><Plus aria-hidden="true" /> Add</Button>
        </div>
      </div>
    </article>
  );
}

export function PublicStore({ snapshot }: { snapshot: PublicStoreSnapshot }) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [whatsappOrderOpen, setWhatsappOrderOpen] = useState(false);
  const [cart, setCart] = useState<StoreCartLine[]>([]);
  const [cartHydrated, setCartHydrated] = useState(false);
  const categories = useMemo(() => Array.from(new Set(snapshot.data.products.map((product) => product.category))).sort(), [snapshot.data.products]);
  const products = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    return snapshot.data.products.filter((product) => {
      const haystack = `${product.name} ${product.description} ${product.category} ${product.variants.map((variant) => `${variant.variantName} ${variant.sku}`).join(" ")}`.toLowerCase();
      return haystack.includes(normalizedSearch) && (category === "all" || product.category === category);
    });
  }, [category, search, snapshot.data.products]);

  useEffect(() => {
    try { setCart(parseStoreCart(window.localStorage.getItem(STORE_CART_KEY))); } catch { setCart([]); }
    setCartHydrated(true);
  }, []);

  useEffect(() => {
    if (!cartHydrated) return;
    try { window.localStorage.setItem(STORE_CART_KEY, JSON.stringify(cart)); } catch { /* Catalog remains usable when storage is unavailable. */ }
  }, [cart, cartHydrated]);

  function addToCart(variant: Variant) {
    const product = snapshot.data.products.find((item) => item.id === variant.productId);
    if (!product || variant.stock < 1) return;
    setCart((current) => {
      const existing = current.find((line) => line.variantId === variant.id);
      if (existing) return current.map((line) => line.variantId === variant.id ? { ...line, quantity: Math.min(line.quantity + 1, variant.stock) } : line);
      return [...current, { variantId: variant.id, productId: variant.productId, productName: product.name, variantName: variant.variantName, sku: variant.sku, unitPriceCents: variant.priceCents, quantity: 1, imageUrl: product.imageUrl }];
    });
    setCartOpen(true);
  }

  function updateCartQuantity(variantId: string, delta: number) {
    const variant = snapshot.data.products.flatMap((product) => product.variants).find((item) => item.id === variantId);
    setCart((current) => current.flatMap((line) => {
      if (line.variantId !== variantId) return [line];
      const quantity = Math.min(line.quantity + delta, variant?.stock ?? line.quantity + delta);
      return quantity > 0 ? [{ ...line, quantity }] : [];
    }));
  }

  const cartCount = cart.reduce((count, line) => count + line.quantity, 0);
  const cartTotal = cartTotalCents(cart);
  const isWhatsAppCheckout = snapshot.data.checkoutMethod === "whatsapp";
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-[#fffaf5] text-foreground">
      <div className="bg-orange-600 px-4 py-2 text-center text-xs font-semibold text-white"><span>Shop the Kawisha Hub collection</span><span className="mx-2 text-orange-200">·</span><span>{snapshot.data.products.length} products ready to browse</span></div>

      <header className="sticky top-0 z-40 border-b bg-background/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link className="flex min-w-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" href="/" onClick={closeMobileMenu}><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">KH</span><span className="hidden truncate text-sm font-bold tracking-tight sm:block">{snapshot.data.businessName}</span></Link>
          <div className="order-3 w-full lg:order-none lg:mx-5 lg:flex-1"><label className="relative block"><span className="sr-only">Search the public catalog</span><Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="h-11 rounded-full border-orange-200 bg-muted/40 pl-11 pr-4 focus-visible:ring-orange-500" onChange={(event) => setSearch(event.target.value)} placeholder="Search products, categories, or SKU" value={search} /></label></div>
          <div className="ml-auto flex items-center gap-1.5"><Button aria-label={`Open cart with ${cartCount} ${cartCount === 1 ? "item" : "items"}`} className="relative" onClick={() => setCartOpen(true)} size="sm" variant="outline"><ShoppingCart aria-hidden="true" /><span className="hidden sm:inline">Cart</span>{cartCount ? <span className="flex size-5 items-center justify-center rounded-full bg-orange-600 text-[10px] text-white">{cartCount}</span> : null}</Button><Button aria-label="Open customer account" asChild className="hidden sm:inline-flex" size="sm" variant="ghost"><Link href="/account"><UserRound aria-hidden="true" /><span className="hidden lg:inline">Account</span></Link></Button><Button asChild className="hidden md:inline-flex" size="sm" variant="outline"><Link href="/auth/login">Owner login</Link></Button><button aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Close store navigation" : "Open store navigation"} className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 md:hidden" onClick={() => setMobileMenuOpen((open) => !open)} type="button">{mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}</button></div>
        </div>
        {mobileMenuOpen ? <div className="border-t bg-background px-4 py-3 md:hidden"><nav aria-label="Mobile store navigation" className="grid gap-1"><Link className="rounded-lg bg-orange-50 px-3 py-2.5 text-sm font-semibold text-orange-700" href="/store" onClick={closeMobileMenu}>Shop all products</Link><Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" href="/account" onClick={closeMobileMenu}>Customer account</Link><Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" href="/" onClick={closeMobileMenu}>About Kawisha Hub</Link><Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground" href="/auth/login" onClick={closeMobileMenu}>Owner login</Link></nav></div> : null}
      </header>

      {snapshot.mode === "demo" ? <div className="border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-center text-xs leading-5 text-amber-950"><span className="font-bold">Demo storefront:</span> these are fictional sample products. Cart changes are temporary and no payment or real order is created.</div> : null}

      {cartOpen ? <><button aria-label="Close cart overlay" className="fixed inset-0 z-40 bg-slate-950/40" onClick={() => setCartOpen(false)} type="button" /><aside aria-label="Shopping cart" aria-modal="true" className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l bg-card p-5 shadow-2xl" role="dialog"><div className="flex items-center justify-between gap-3 border-b pb-4"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-600">Your cart</p><h2 className="mt-1 text-xl font-semibold tracking-tight">{cartCount} {cartCount === 1 ? "item" : "items"}</h2></div><Button aria-label="Close cart" onClick={() => setCartOpen(false)} size="icon" variant="ghost"><X aria-hidden="true" /></Button></div><div className="min-h-0 flex-1 overflow-y-auto py-5">{cart.length ? <div className="space-y-3">{cart.map((line) => <div className="flex gap-3 rounded-xl border p-3" key={line.variantId}><div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-orange-50">{line.imageUrl ? (<img alt="" className="size-full object-cover" src={line.imageUrl} />) : <Package aria-hidden="true" className="size-5 text-orange-500" />}</div><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-sm font-semibold">{line.productName}</p><p className="mt-1 truncate text-xs text-muted-foreground">{line.variantName}</p></div><button aria-label={`Remove ${line.productName} from cart`} className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" onClick={() => setCart((current) => current.filter((item) => item.variantId !== line.variantId))} type="button"><Trash2 aria-hidden="true" className="size-4" /></button></div><div className="mt-3 flex items-center justify-between gap-3"><p className="text-sm font-bold tabular-nums">{formatCurrency(line.unitPriceCents * line.quantity, snapshot.data.currencyCode)}</p><div className="flex items-center gap-1 rounded-lg border"><Button aria-label={`Decrease quantity of ${line.productName}`} onClick={() => updateCartQuantity(line.variantId, -1)} size="icon" variant="ghost"><span aria-hidden="true">−</span></Button><span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span><Button aria-label={`Increase quantity of ${line.productName}`} onClick={() => updateCartQuantity(line.variantId, 1)} size="icon" variant="ghost"><Plus aria-hidden="true" /></Button></div></div></div></div>)}</div> : <div className="rounded-xl border border-dashed px-4 py-12 text-center"><ShoppingCart aria-hidden="true" className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-semibold">Your cart is empty</p><p className="mt-1 text-sm text-muted-foreground">Add a product from the catalog to begin.</p></div>}</div><div className="border-t pt-4"><div className="flex items-center justify-between gap-3"><span className="text-sm text-muted-foreground">Subtotal</span><span className="text-lg font-bold tabular-nums">{formatCurrency(cartTotal, snapshot.data.currencyCode)}</span></div><p className="mt-2 text-xs text-muted-foreground">{isWhatsAppCheckout ? "Send the order details to the owner on WhatsApp." : "Continue to secure online payment."}</p>{cart.length ? <div className="mt-4 grid gap-2">{isWhatsAppCheckout ? <Button className="w-full bg-emerald-600 text-white hover:bg-emerald-700" onClick={() => { setCartOpen(false); setWhatsappOrderOpen(true); }} size="lg"><MessageCircle aria-hidden="true" /> Order via WhatsApp</Button> : <Button asChild className="w-full bg-orange-600 text-white hover:bg-orange-700" size="lg"><Link href="/store/checkout" onClick={() => setCartOpen(false)}>Continue to checkout <ArrowRight aria-hidden="true" /></Link></Button>}</div> : <Button className="mt-4 w-full" disabled size="lg">{isWhatsAppCheckout ? "Order via WhatsApp" : "Continue to checkout"}</Button>}</div></aside></> : null}

      <WhatsAppOrderDialog cart={cart} onOpenChange={setWhatsappOrderOpen} open={whatsappOrderOpen} snapshot={snapshot} />

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-5 sm:pb-10"><div className="overflow-hidden rounded-3xl bg-orange-50 shadow-sm"><div className="grid min-h-[22rem] lg:grid-cols-[0.9fr_1.1fr]"><div className="flex flex-col justify-center px-6 py-10 sm:px-10 sm:py-14"><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Shop the collection</p><h1 className="mt-4 max-w-xl text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">Find something good for the everyday.</h1><p className="mt-4 max-w-lg text-sm leading-6 text-slate-600 sm:text-base">Browse the products currently available from {snapshot.data.businessName}, choose a variant, and keep your picks together in one simple cart.</p><div className="mt-7 flex flex-wrap gap-3"><a className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-orange-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2" href="#catalog">Shop now <ArrowRight aria-hidden="true" className="size-4" /></a><Link className="inline-flex h-10 items-center justify-center rounded-md border border-orange-200 bg-white/70 px-5 text-sm font-semibold text-orange-800 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2" href="/account">View account</Link></div><div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-slate-600"><span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-orange-600" aria-hidden="true" /> {snapshot.data.products.length} products</span><span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-orange-600" aria-hidden="true" /> {categories.length} categories</span><span className="inline-flex items-center gap-1.5"><Check className="size-3.5 text-orange-600" aria-hidden="true" /> Mobile-ready browsing</span></div></div><div className="relative min-h-[15rem] overflow-hidden lg:min-h-0"><img alt="Curated products prepared for the Kawisha Hub storefront" className="absolute inset-0 size-full object-cover" src="/marketing/product-collection.png" /><div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-orange-50/20 to-transparent lg:from-orange-50 lg:via-transparent" /><div className="absolute bottom-4 right-4 rounded-xl border border-white/70 bg-white/90 px-3 py-2 text-right shadow-lg backdrop-blur"><p className="text-[10px] font-bold uppercase tracking-wide text-orange-700">Kawisha Hub</p><p className="mt-0.5 text-xs font-semibold text-slate-900">Current collection</p></div></div></div></div></section>

        {!snapshot.data.isPublished ? <section className="mx-auto max-w-2xl px-4 py-20 text-center sm:py-28"><div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted"><ShoppingBag aria-hidden="true" className="size-6 text-muted-foreground" /></div><h2 className="mt-6 text-2xl font-semibold tracking-tight">The store is not published yet.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted-foreground">An owner can publish the public store from the private workspace settings when the live product list is ready.</p><Button asChild className="mt-6" variant="outline"><Link href="/auth/login">Owner login <ArrowRight aria-hidden="true" /></Link></Button></section> : <>
          <section className="border-y bg-background" id="categories"><div className="mx-auto flex max-w-7xl items-center gap-4 overflow-x-auto px-4 py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"><div className="flex shrink-0 items-center gap-2 text-sm font-bold text-slate-950"><SlidersHorizontal aria-hidden="true" className="size-4 text-orange-600" /> Browse by</div><div className="h-6 w-px shrink-0 bg-border" /><button aria-pressed={category === "all"} className={cn("shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition", category === "all" ? "border-orange-600 bg-orange-600 text-white" : "bg-background text-muted-foreground hover:border-orange-300 hover:text-orange-700")} onClick={() => setCategory("all")} type="button">All products</button>{categories.map((item) => <button aria-pressed={category === item} className={cn("shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition", category === item ? "border-orange-600 bg-orange-600 text-white" : "bg-background text-muted-foreground hover:border-orange-300 hover:text-orange-700")} key={item} onClick={() => setCategory(item)} type="button">{item}</button>)}</div></section>
          <section className="mx-auto max-w-7xl px-4 py-10 sm:py-14" id="catalog"><div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Explore the catalog</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Available products</h2><p className="mt-1 text-sm text-muted-foreground">Choose a product, select an option, and add it to your cart.</p></div><div className="flex items-center gap-2"><label className="relative"><span className="sr-only">Filter by category</span><select className="h-10 appearance-none rounded-lg border bg-background px-3 pr-8 text-sm outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500" onChange={(event) => setCategory(event.target.value)} value={category}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select><ChevronDown aria-hidden="true" className="pointer-events-none absolute right-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /></label><span className="hidden text-sm text-muted-foreground sm:inline">{products.length} {products.length === 1 ? "item" : "items"}</span></div></div>{products.length ? <div className="mt-7 grid grid-cols-1 gap-4 min-[390px]:grid-cols-2 sm:gap-5 lg:grid-cols-4">{products.map((product) => <ProductCard currencyCode={snapshot.data.currencyCode} key={product.id} onAdd={addToCart} product={product} />)}</div> : <div className="mt-8 rounded-2xl border border-dashed bg-background px-5 py-16 text-center"><Package aria-hidden="true" className="mx-auto size-8 text-muted-foreground/50" /><p className="mt-3 text-sm font-semibold">No matching products</p><p className="mt-1 text-sm text-muted-foreground">Try a different search or category.</p></div>}</section>
        </>}
      </main>

      {cartCount > 0 ? <div className="fixed inset-x-4 bottom-4 z-30 sm:hidden"><Button aria-label={`Open cart with ${cartCount} items`} className="w-full bg-orange-600 text-white shadow-xl hover:bg-orange-700" onClick={() => setCartOpen(true)} size="lg"><ShoppingCart aria-hidden="true" /> View cart · {formatCurrency(cartTotal, snapshot.data.currencyCode)} <span className="ml-auto rounded-full bg-white/20 px-2 py-0.5 text-xs">{cartCount}</span></Button></div> : null}

      <footer className="border-t bg-background"><div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><p>Public storefront for {snapshot.data.businessName}.</p><div className="flex items-center gap-4"><Link className="hover:text-foreground" href="/">About Kawisha Hub</Link><Link className="hover:text-foreground" href="/account">Customer account</Link><Link className="hover:text-foreground" href="/auth/login">Owner login</Link></div></div></footer>
    </div>
  );
}
