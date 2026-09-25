"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Heart,
  Mail,
  Menu,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Tag,
  Truck,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { parseStoreCart, STORE_CART_KEY, type StoreCartLine } from "@/lib/store-cart";
import type { Product, PublicStoreSnapshot, Variant } from "@/lib/types";
import { cn } from "@/lib/utils";

const navigationItems = [
  { label: "Categories", href: "#categories" },
  { label: "Featured", href: "#featured" },
  { label: "New arrivals", href: "#new-arrivals" },
  { label: "About us", href: "#about" },
  { label: "Contact", href: "#contact" },
];

const categoryItems = [
  { label: "Men's Fashion", image: "/products/sample-everyday-shirt.png", tone: "from-stone-100 to-stone-200" },
  { label: "Women's Fashion", image: "/products/sample-everyday-shirt.png", tone: "from-rose-50 to-orange-100" },
  { label: "Kids' Fashion", image: "/products/sample-linen-tote.png", tone: "from-sky-50 to-blue-100" },
  { label: "Footwear", image: "/marketing/product-collection.png", tone: "from-amber-50 to-yellow-100" },
  { label: "Bags", image: "/products/sample-linen-tote.png", tone: "from-lime-50 to-emerald-100" },
  { label: "Jewelry", image: "/products/sample-scented-candle.png", tone: "from-violet-50 to-fuchsia-100" },
  { label: "Perfumes", image: "/products/sample-scented-candle.png", tone: "from-pink-50 to-rose-100" },
  { label: "Household Items", image: "/marketing/order-fulfilment.png", tone: "from-stone-100 to-slate-200" },
  { label: "Kitchen Utensils", image: "/marketing/product-collection.png", tone: "from-orange-50 to-amber-100" },
];

const growthFeatures = [
  { icon: Tag, title: "Flash sales", text: "Create urgency around selected products when promotions are configured." },
  { icon: Sparkles, title: "Trending this week", text: "Highlight the products customers are viewing and buying most." },
  { icon: Heart, title: "Recommended for you", text: "Add personalised product discovery as customer history grows." },
  { icon: Package, title: "Back in stock", text: "Bring shoppers back when a favourite product returns." },
];

const deliveryItems = [
  { icon: Truck, label: "Delivery locations", value: "Confirm supported locations with the Kawisha Hub team." },
  { icon: Tag, label: "Shipping fees", value: "Shown or quoted before fulfilment; owner policy can be added here." },
  { icon: Clock3, label: "Delivery times", value: "Confirmed per order based on location and availability." },
  { icon: ShieldCheck, label: "Returns and exchanges", value: "Handled according to the store policy set before launch." },
];

const demoReviews = [
  { quote: "The simple catalogue makes it easy to find a good everyday pick.", name: "Demo shopper", detail: "Fictional sample review" },
  { quote: "I can see the option I want and move straight to the cart.", name: "Sample customer", detail: "Fictional sample review" },
  { quote: "The collection feels clear, warm, and easy to browse on my phone.", name: "Demo customer", detail: "Fictional sample review" },
];

function getActiveVariants(product: Product) {
  return product.variants.filter((variant) => variant.isActive);
}

function getLowestPrice(product: Product) {
  return Math.min(...getActiveVariants(product).map((variant) => variant.priceCents));
}

function ProductCard({
  product,
  currencyCode,
  isDemo,
  onAdd,
  onBuy,
}: {
  product: Product;
  currencyCode: string;
  isDemo: boolean;
  onAdd: (product: Product, variant: Variant) => void;
  onBuy: (product: Product, variant: Variant) => void;
}) {
  const variants = getActiveVariants(product);
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? "");
  const selectedVariant = variants.find((variant) => variant.id === selectedVariantId) ?? variants[0];
  const inStock = variants.some((variant) => variant.stock > 0);

  if (!selectedVariant) return null;

  return (
    <article className="group overflow-hidden rounded-2xl border bg-card shadow-sm transition duration-300 hover:-translate-y-1 hover:border-orange-200 hover:shadow-xl">
      <div className="relative aspect-[4/4.6] overflow-hidden bg-orange-50">
        {product.imageUrl ? (
          <img
            alt={product.name + " product photo"}
            className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
            src={product.imageUrl}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-stone-100">
            <span className="flex size-16 items-center justify-center rounded-2xl border border-orange-200 bg-white/80 text-orange-600 shadow-sm">
              <Package aria-hidden="true" className="size-7" />
            </span>
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-slate-950/35 to-transparent" />
        <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-700 shadow-sm">
          {isDemo ? "Demo sample" : product.category}
        </span>
        <button
          aria-label="Wishlist is coming soon"
          className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full bg-white/95 text-slate-500 shadow-sm"
          disabled
          type="button"
        >
          <Heart aria-hidden="true" className="size-4" />
        </button>
        <span className={cn("absolute bottom-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-semibold shadow-sm", inStock ? "bg-white/95 text-emerald-700" : "bg-slate-950/75 text-white")}>
          {inStock ? "In stock" : "Sold out"}
        </span>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-bold text-slate-950">{product.name}</h3>
            <p className="mt-1 line-clamp-2 min-h-10 text-xs leading-5 text-muted-foreground">{product.description}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-sm font-bold text-slate-950">{formatCurrency(getLowestPrice(product), currencyCode)}</p>
            {variants.length > 1 ? <p className="mt-1 text-[10px] text-muted-foreground">from</p> : null}
          </div>
        </div>
        <label className="sr-only" htmlFor={"landing-variant-" + product.id}>Choose an option for {product.name}</label>
        {variants.length > 1 ? (
          <select
            className="mt-3 h-9 w-full rounded-lg border bg-background px-2.5 text-xs outline-none transition focus-visible:ring-2 focus-visible:ring-orange-500"
            id={"landing-variant-" + product.id}
            onChange={(event) => setSelectedVariantId(event.target.value)}
            value={selectedVariant.id}
          >
            {variants.map((variant) => <option key={variant.id} value={variant.id}>{variant.variantName} · {formatCurrency(variant.priceCents, currencyCode)}</option>)}
          </select>
        ) : (
          <p className="mt-3 truncate rounded-lg border bg-muted/30 px-2.5 py-2 text-xs text-muted-foreground">{selectedVariant.variantName}</p>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <Button className="w-full bg-orange-600 text-white hover:bg-orange-700" disabled={!inStock} onClick={() => onAdd(product, selectedVariant)} size="sm">
            <ShoppingCart aria-hidden="true" />
            Add to cart
          </Button>
          <Button className="w-full" disabled={!inStock} onClick={() => onBuy(product, selectedVariant)} size="sm" variant="outline">
            Buy now
          </Button>
        </div>
      </div>
    </article>
  );
}

function ProductSection({
  id,
  eyebrow,
  title,
  description,
  products,
  snapshot,
  onAdd,
  onBuy,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  snapshot: PublicStoreSnapshot;
  onAdd: (product: Product, variant: Variant) => void;
  onBuy: (product: Product, variant: Variant) => void;
}) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20" id={id}>
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <Button asChild className="self-start sm:self-auto" variant="outline">
          <Link href="/store">View all products <ArrowRight aria-hidden="true" /></Link>
        </Button>
      </div>
      {products.length ? (
        <div className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
          {products.map((product) => <ProductCard currencyCode={snapshot.data.currencyCode} isDemo={snapshot.mode === "demo"} key={product.id} onAdd={onAdd} onBuy={onBuy} product={product} />)}
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <Package aria-hidden="true" className="mx-auto size-8 text-muted-foreground/50" />
          <h3 className="mt-4 text-base font-semibold">{snapshot.mode === "demo" ? "Sample products are being prepared" : "Your collection is ready for its first products"}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {snapshot.mode === "demo" ? "Demo catalogue items will appear here when the storefront is available." : "Publish products from the private tracker and they will appear in this section automatically."}
          </p>
        </div>
      )}
    </section>
  );
}

function ProductCarousel({
  id,
  eyebrow,
  title,
  description,
  products,
  snapshot,
  onAdd,
  onBuy,
}: {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  products: Product[];
  snapshot: PublicStoreSnapshot;
  onAdd: (product: Product, variant: Variant) => void;
  onBuy: (product: Product, variant: Variant) => void;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const pauseAutoplayRef = useRef(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(products.length > 1);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const updateControls = () => {
      setCanScrollLeft(viewport.scrollLeft > 8);
      setCanScrollRight(viewport.scrollLeft + viewport.clientWidth < viewport.scrollWidth - 8);
    };

    updateControls();
    viewport.addEventListener("scroll", updateControls, { passive: true });
    window.addEventListener("resize", updateControls);

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const autoplay = reducedMotion
      ? undefined
      : window.setInterval(() => {
          if (pauseAutoplayRef.current) return;
          const nextPosition = viewport.scrollLeft + Math.max(viewport.clientWidth * 0.82, 280);
          const reachedEnd = nextPosition + viewport.clientWidth >= viewport.scrollWidth - 8;
          viewport.scrollTo({ left: reachedEnd ? 0 : nextPosition, behavior: "smooth" });
        }, 6000);

    return () => {
      viewport.removeEventListener("scroll", updateControls);
      window.removeEventListener("resize", updateControls);
      if (autoplay !== undefined) window.clearInterval(autoplay);
    };
  }, [products.length]);

  const scrollCarousel = (direction: number) => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollBy({ left: direction * Math.max(viewport.clientWidth * 0.82, 280), behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20" id={id}>
      <div className="flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">{eyebrow}</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">{title}</h2>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1" role="group" aria-label={title + " carousel controls"}>
            <button
              aria-label="Show previous products"
              className="inline-flex size-9 items-center justify-center rounded-full border bg-background text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              disabled={!canScrollLeft}
              onClick={() => scrollCarousel(-1)}
              type="button"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              aria-label="Show next products"
              className="inline-flex size-9 items-center justify-center rounded-full border bg-background text-slate-700 transition hover:border-orange-300 hover:text-orange-700 disabled:pointer-events-none disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
              disabled={!canScrollRight}
              onClick={() => scrollCarousel(1)}
              type="button"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
          <Button asChild variant="outline">
            <Link href="/store">View all <ArrowRight aria-hidden="true" /></Link>
          </Button>
        </div>
      </div>
      {products.length ? (
        <>
          <div
            aria-label={title + " products"}
            className="storefront-scrollbar-hidden mt-7 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-4 pr-8 sm:gap-5"
            onFocus={() => { pauseAutoplayRef.current = true; }}
            onMouseEnter={() => { pauseAutoplayRef.current = true; }}
            onMouseLeave={() => { pauseAutoplayRef.current = false; }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) pauseAutoplayRef.current = false;
            }}
            ref={viewportRef}
            role="region"
            tabIndex={0}
          >
            {products.map((product, index) => (
              <div className="w-[78%] shrink-0 snap-start storefront-card-rise sm:w-[44%] lg:w-[270px] xl:w-[282px]" key={product.id} style={{ animationDelay: String(index * 70) + "ms" }}>
                <ProductCard currencyCode={snapshot.data.currencyCode} isDemo={snapshot.mode === "demo"} onAdd={onAdd} onBuy={onBuy} product={product} />
              </div>
            ))}
          </div>
          <p className="mt-1 text-xs text-muted-foreground sm:hidden">Swipe to explore more products.</p>
        </>
      ) : (
        <div className="mt-7 rounded-2xl border border-dashed bg-muted/20 px-6 py-14 text-center">
          <Package aria-hidden="true" className="mx-auto size-8 text-muted-foreground/50" />
          <h3 className="mt-4 text-base font-semibold">{snapshot.mode === "demo" ? "Sample products are being prepared" : "Your collection is ready for its first products"}</h3>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
            {snapshot.mode === "demo" ? "Demo catalogue items will appear here when the storefront is available." : "Publish products from the private tracker and they will appear in this section automatically."}
          </p>
        </div>
      )}
    </section>
  );
}

export function LandingPage({ snapshot }: { snapshot: PublicStoreSnapshot }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cartCount, setCartCount] = useState(0);
  const [cartNotice, setCartNotice] = useState("");
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const products = useMemo(
    () => snapshot.data.products.filter((product) => product.isActive && getActiveVariants(product).length > 0),
    [snapshot.data.products],
  );
  const productCategories = useMemo(
    () => Array.from(new Set(products.map((product) => product.category))).sort(),
    [products],
  );
  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const matchesQuery = !query || [product.name, product.category, product.description, ...getActiveVariants(product).map((variant) => variant.sku)].join(" ").toLowerCase().includes(query);
      return matchesCategory && matchesQuery;
    });
  }, [products, searchQuery, selectedCategory]);

  const featuredProducts = filteredProducts.slice(0, 8);
  const newArrivals = filteredProducts.slice(8, 12);
  const bestSellers = filteredProducts.slice(0, 4);

  useEffect(() => {
    setCartCount(parseStoreCart(window.localStorage.getItem(STORE_CART_KEY)).reduce((total, line) => total + line.quantity, 0));
  }, []);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const addToCart = (product: Product, variant: Variant) => {
    const current = parseStoreCart(window.localStorage.getItem(STORE_CART_KEY));
    const existing = current.find((line) => line.variantId === variant.id);
    const next: StoreCartLine[] = existing
      ? current.map((line) => line.variantId === variant.id ? { ...line, quantity: line.quantity + 1 } : line)
      : [...current, { variantId: variant.id, productId: product.id, productName: product.name, variantName: variant.variantName, sku: variant.sku, unitPriceCents: variant.priceCents, quantity: 1, imageUrl: product.imageUrl }];
    window.localStorage.setItem(STORE_CART_KEY, JSON.stringify(next));
    setCartCount(next.reduce((total, line) => total + line.quantity, 0));
    setCartNotice(product.name + " added to cart");
    window.setTimeout(() => setCartNotice(""), 2800);
  };

  const buyNow = (product: Product, variant: Variant) => {
    addToCart(product, variant);
    window.location.assign("/store/checkout");
  };

  const submitSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    document.getElementById("featured")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const submitNewsletter = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!newsletterEmail.trim()) return;
    setNewsletterMessage("Newsletter capture is ready for connection.");
    setNewsletterEmail("");
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#fffaf5] text-foreground">
      <div className="bg-orange-600 px-4 py-2 text-center text-xs font-semibold text-white">
        <span>{snapshot.mode === "demo" ? "Demo storefront · sample products are clearly labelled" : "New collection · browse what is currently available"}</span>
        <span className="mx-2 text-orange-200">·</span>
        <Link className="underline underline-offset-2 hover:text-orange-100" href="/store">Shop now</Link>
      </div>

      <header className="sticky top-0 z-40 border-b bg-[#fffaf5]/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-3">
          <Link className="flex min-w-0 items-center gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" href="/" onClick={closeMobileMenu}>
            <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-[10px] font-bold text-primary-foreground shadow-sm">KH</span>
            <span className="truncate text-sm font-bold tracking-tight sm:text-base">{snapshot.data.businessName}</span>
          </Link>
          <form className="order-3 w-full lg:order-none lg:mx-5 lg:flex-1" onSubmit={submitSearch}>
            <label className="relative block">
              <span className="sr-only">Search products</span>
              <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input className="h-11 w-full rounded-full border border-orange-200 bg-white pl-11 pr-4 text-sm outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-orange-500" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search fashion, home, bags, and more" value={searchQuery} />
            </label>
          </form>
          <nav aria-label="Storefront" className="hidden items-center gap-1 xl:flex">
            {navigationItems.slice(0, 3).map((item) => <a className="rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500" href={item.href} key={item.href}>{item.label}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            <Button aria-label={"Open cart with " + cartCount + " items"} asChild size="sm" variant="outline">
              <Link href="/store">
                <ShoppingCart aria-hidden="true" />
                <span className="hidden sm:inline">Cart</span>
                {cartCount ? <span className="flex size-5 items-center justify-center rounded-full bg-orange-600 text-[10px] text-white">{cartCount}</span> : null}
              </Link>
            </Button>
            <Button aria-label="Open customer account" asChild className="hidden sm:inline-flex" size="sm" variant="ghost">
              <Link href="/account"><UserRound aria-hidden="true" /><span className="hidden lg:inline">Account</span></Link>
            </Button>
            <Button asChild className="hidden md:inline-flex" size="sm">
              <Link href="/store">Shop <ArrowRight aria-hidden="true" /></Link>
            </Button>
            <button aria-expanded={mobileMenuOpen} aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"} className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-orange-50 hover:text-orange-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 xl:hidden" onClick={() => setMobileMenuOpen((open) => !open)} type="button">
              {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
            </button>
          </div>
        </div>
        {mobileMenuOpen ? (
          <div className="border-t bg-[#fffaf5] px-4 py-3 xl:hidden">
            <nav aria-label="Mobile storefront" className="grid gap-1">
              {navigationItems.map((item) => <a className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-orange-50 hover:text-orange-700" href={item.href} key={item.href} onClick={closeMobileMenu}>{item.label}</a>)}
              <Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-orange-50 hover:text-orange-700" href="/account" onClick={closeMobileMenu}>Customer account</Link>
              <Link className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-orange-50 hover:text-orange-700" href="/auth/login" onClick={closeMobileMenu}>Owner login</Link>
            </nav>
          </div>
        ) : null}
      </header>

      {cartNotice ? <div aria-live="polite" className="fixed bottom-5 left-1/2 z-50 -translate-x-1/2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white shadow-xl">{cartNotice}</div> : null}

      <main>
        <section className="mx-auto max-w-7xl px-4 pb-8 pt-5 sm:pb-12 sm:pt-8">
          <div className="relative isolate overflow-hidden rounded-[2rem] bg-slate-950 text-white shadow-2xl shadow-orange-950/10">
            <div aria-hidden="true" className="storefront-breathe absolute -left-20 -top-32 size-80 rounded-full bg-orange-500/30 blur-3xl" />
            <div className="grid min-h-[34rem] lg:grid-cols-[0.93fr_1.07fr]">
              <div className="landing-reveal relative z-10 flex flex-col justify-center px-6 py-12 sm:px-10 sm:py-16">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-200/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-orange-100">
                  <Sparkles aria-hidden="true" className="size-3.5" />
                  Fresh finds for everyday life
                </div>
                <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight sm:text-6xl">
                  Your One-Stop Shop for Fashion, Footwear, Accessories &amp; Home Essentials.
                </h1>
                <p className="mt-5 max-w-lg text-sm leading-7 text-slate-300 sm:text-base">
                  Discover pieces for every mood, moment, and room. Browse the current collection, compare options, and move from product discovery to your cart in just a few clicks.
                </p>
                <div className="mt-8 grid max-w-md grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-3">
                  <Button asChild className="w-full min-w-0 px-2 text-xs sm:w-auto sm:px-5 sm:text-sm" size="lg">
                    <Link href="/store">Shop the collection <ArrowRight aria-hidden="true" /></Link>
                  </Button>
                  <a className="inline-flex h-10 w-full min-w-0 items-center justify-center gap-2 rounded-md border border-white/20 bg-white/10 px-2 text-xs font-semibold text-white transition hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 sm:h-11 sm:w-auto sm:px-5 sm:text-sm" href="#categories">
                    Shop by category <ChevronRight aria-hidden="true" />
                  </a>
                </div>
                <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-300">
                  <span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="size-3.5 text-orange-300" /> Easy browsing</span>
                  <span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="size-3.5 text-orange-300" /> Stock-aware catalogue</span>
                  <span className="inline-flex items-center gap-1.5"><Check aria-hidden="true" className="size-3.5 text-orange-300" /> Mobile-ready</span>
                </div>
              </div>
              <div className="relative min-h-[18rem] overflow-hidden lg:min-h-0">
                <Image alt="Kawisha Hub collection of clothing and lifestyle products" className="object-cover opacity-90" fill priority sizes="(max-width: 1024px) 100vw, 55vw" src="/marketing/product-collection.png" />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/25 to-transparent" />
                <div className="absolute bottom-6 right-6 rounded-2xl border border-white/20 bg-slate-950/75 px-4 py-3 text-right shadow-xl backdrop-blur">
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-orange-300">Kawisha Hub</p>
                  <p className="mt-1 text-sm font-semibold">New collection</p>
                  <p className="mt-1 text-xs text-slate-300">{products.length || "Your"} products to discover</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y bg-white/70">
          <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:grid-cols-4 sm:gap-0 sm:divide-x">
            {[
              [ShoppingBag, "Shop with ease", "Find pieces across everyday categories"],
              [ShieldCheck, "Quality-minded", "A considered collection for your home and wardrobe"],
              [Truck, "Clear delivery", "Delivery details confirmed before fulfilment"],
              [UserRound, "Your account", "Create an account and track orders when ready"],
            ].map(([Icon, title, text]) => {
              const FeatureIcon = Icon as typeof ShoppingBag;
              return <div className="flex items-start gap-3 sm:px-5 first:sm:pl-0 last:sm:pr-0" key={String(title)}><span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><FeatureIcon aria-hidden="true" className="size-4" /></span><div><p className="text-sm font-bold text-slate-950">{String(title)}</p><p className="mt-1 text-xs leading-5 text-muted-foreground">{String(text)}</p></div></div>;
            })}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20" id="categories">
          <div className="flex items-end justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Shop by category</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Find your next favourite</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Start with a category, then narrow your search with the live catalogue.</p></div>
            <Button asChild className="hidden sm:inline-flex" variant="outline"><Link href="/store">Browse all <ArrowRight aria-hidden="true" /></Link></Button>
          </div>
          <div className="mt-7 grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-9">
            {categoryItems.map((category, index) => <Link className="storefront-card-rise group text-center" href="/store#catalog" key={category.label} style={{ animationDelay: String(index * 50) + "ms" }}><div className={cn("relative aspect-square overflow-hidden rounded-2xl bg-gradient-to-br shadow-sm transition duration-300 group-hover:-translate-y-1 group-hover:shadow-lg", category.tone)}><Image alt="" className="object-cover mix-blend-multiply opacity-80 transition duration-500 group-hover:scale-110" fill sizes="(max-width: 640px) 33vw, (max-width: 1024px) 20vw, 12vw" src={category.image} /><div className="absolute inset-0 bg-white/10" /></div><p className="mt-3 text-xs font-bold leading-4 text-slate-800">{category.label}</p></Link>)}
          </div>
        </section>

        <section className="border-y bg-orange-50/70" id="featured">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:py-12">
            <div className="flex flex-col gap-4 rounded-2xl border border-orange-200 bg-white/80 p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:p-5">
              <div><p className="text-sm font-bold text-slate-950">Find exactly what you want</p><p className="mt-1 text-xs text-muted-foreground">Search by product, category, or SKU.</p></div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <label className="relative"><span className="sr-only">Search featured products</span><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><input className="h-10 w-full rounded-lg border bg-background pl-9 pr-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500 sm:w-64" onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search products" value={searchQuery} /></label>
                <label className="relative"><span className="sr-only">Filter products by category</span><select className="h-10 w-full appearance-none rounded-lg border bg-background px-3 pr-8 text-sm outline-none focus-visible:ring-2 focus-visible:ring-orange-500 sm:w-44" onChange={(event) => setSelectedCategory(event.target.value)} value={selectedCategory}><option value="all">All categories</option>{productCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
              </div>
            </div>
          </div>
          <ProductCarousel description="Swipe through a marketplace-style rail of the products currently available in the collection." eyebrow={snapshot.mode === "demo" ? "Demo sample collection" : "The current collection"} id="featured-products" onAdd={addToCart} onBuy={buyNow} products={featuredProducts} snapshot={snapshot} title="Featured products" />
        </section>

        <ProductSection description="Fresh picks are shown from the latest products in the public catalogue." eyebrow="Just added" id="new-arrivals" onAdd={addToCart} onBuy={buyNow} products={newArrivals} snapshot={snapshot} title="New Arrivals" />

        <section className="border-y bg-white/70">
          <ProductSection description="A curated view of products shoppers can discover and add to the cart." eyebrow="Popular picks" id="best-sellers" onAdd={addToCart} onBuy={buyNow} products={bestSellers} snapshot={snapshot} title="Best Sellers" />
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="relative overflow-hidden rounded-[2rem] bg-orange-600 px-6 py-10 text-white shadow-xl shadow-orange-900/10 sm:px-10 sm:py-12">
            <div className="absolute -right-16 -top-24 size-72 rounded-full border border-white/20" />
            <div className="absolute -bottom-48 right-24 size-80 rounded-full border border-white/15" />
            <div className="relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
              <div><div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold"><Tag aria-hidden="true" className="size-3.5" /> Special offers</div><h2 className="mt-5 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Make room for your next good find.</h2><p className="mt-4 max-w-xl text-sm leading-6 text-orange-50">Flash sales, coupon codes, and sale prices have a home here as the store grows. For now, browse the live collection and save the products you love to your cart.</p><Button asChild className="mt-7 bg-white text-orange-700 hover:bg-orange-50" size="lg"><Link href="/store">Explore current offers <ArrowRight aria-hidden="true" /></Link></Button></div>
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">{["Owner-set sale prices", "Coupon codes", "Limited-time collections"].map((item) => <div className="flex items-center gap-3 rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold backdrop-blur" key={item}><Check aria-hidden="true" className="size-4 text-orange-100" />{item}<span className="ml-auto rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium">Ready next</span></div>)}</div>
            </div>
          </div>
        </section>

        <section className="border-y bg-white/70" id="about">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">About Kawisha Hub NG</p><h2 className="mt-3 max-w-lg text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">Everyday essentials, chosen with care.</h2><p className="mt-5 max-w-xl text-sm leading-7 text-muted-foreground">Kawisha Hub NG brings fashion, accessories, and home essentials together in one easy-to-browse collection. The public shop is connected to a private stock and order workspace, so the team can keep the customer experience clear from first click to fulfilment.</p><div className="mt-7 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border bg-background p-4"><p className="text-sm font-bold">Our promise</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Clear product details, honest availability, and a smoother order handoff.</p></div><div className="rounded-xl border bg-background p-4"><p className="text-sm font-bold">Built to grow</p><p className="mt-2 text-xs leading-5 text-muted-foreground">Start small, then add promotions, reviews, and customer favourites over time.</p></div></div></div>
            <div className="relative min-h-[22rem] overflow-hidden rounded-[2rem] border bg-muted shadow-xl"><Image alt="Kawisha Hub order fulfilment and product preparation" className="object-cover" fill sizes="(max-width: 1024px) 100vw, 55vw" src="/marketing/order-fulfilment.png" /><div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" /><div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/20 bg-slate-950/70 px-4 py-3 text-white backdrop-blur"><p className="text-xs font-bold uppercase tracking-[0.16em] text-orange-200">Behind every order</p><p className="mt-1 text-sm font-semibold">A focused handoff from product to customer.</p></div></div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="flex items-end justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Customer reviews</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Good experiences matter</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{snapshot.mode === "demo" ? "Preview testimonials are clearly marked until real customer feedback is collected." : "Verified reviews will appear here after customers complete orders."}</p></div><Star aria-hidden="true" className="hidden size-8 fill-orange-400 text-orange-400 sm:block" /></div>
          {snapshot.mode === "demo" ? (
            <div className="mt-7 grid gap-4 md:grid-cols-3">
              {demoReviews.map((review) => <div className="rounded-2xl border bg-card p-5 shadow-sm" key={review.name}><div className="flex gap-1 text-orange-400">{Array.from({ length: 5 }).map((_, index) => <Star aria-hidden="true" className="size-3.5 fill-current" key={index} />)}</div><p className="mt-4 text-sm leading-6 text-slate-700">“{review.quote}”</p><div className="mt-5 border-t pt-4"><p className="text-xs font-bold text-slate-950">{review.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{review.detail}</p></div></div>)}
            </div>
          ) : (
            <div className="mt-7 rounded-2xl border border-dashed bg-card px-6 py-12 text-center">
              <Star aria-hidden="true" className="mx-auto size-7 text-orange-400" />
              <h3 className="mt-4 text-base font-semibold">Verified customer reviews will appear here.</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">After real customers complete orders, their feedback can be shown here to build trust with the next shopper.</p>
            </div>
          )}
        </section>

        <section className="border-y bg-orange-50/60">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Delivery information</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Everything you need before checkout</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Delivery details are kept visible so customers know what will be confirmed before an order is fulfilled.</p></div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{deliveryItems.map((item) => { const Icon = item.icon; return <div className="rounded-2xl border border-orange-200 bg-white/80 p-5" key={item.label}><Icon aria-hidden="true" className="size-5 text-orange-600" /><p className="mt-5 text-sm font-bold text-slate-950">{item.label}</p><p className="mt-2 text-xs leading-5 text-muted-foreground">{item.value}</p></div>; })}</div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="grid gap-4 md:grid-cols-3">
            <Link className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg" href="/account/sign-up"><span className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><UserRound aria-hidden="true" className="size-5" /></span><h2 className="mt-5 text-base font-bold text-slate-950">Create your account</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Sign up to keep customer details and track orders when live account access is enabled.</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-orange-700">Create account <ArrowRight aria-hidden="true" className="size-3.5" /></span></Link>
            <div className="rounded-2xl border bg-card p-5"><span className="flex size-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600"><Heart aria-hidden="true" className="size-5" /></span><h2 className="mt-5 text-base font-bold text-slate-950">Wishlist &amp; favourites</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Save favourites is planned next; the product cards already reserve this space for your shopping list.</p><span className="mt-5 inline-flex rounded-full bg-muted px-2.5 py-1 text-[10px] font-bold text-muted-foreground">Coming soon</span></div>
            <Link className="group rounded-2xl border bg-card p-5 transition hover:-translate-y-1 hover:border-orange-200 hover:shadow-lg" href="/account"><span className="flex size-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700"><ShoppingBag aria-hidden="true" className="size-5" /></span><h2 className="mt-5 text-base font-bold text-slate-950">Track your orders</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">Return to your account to see customer order history when orders are connected.</p><span className="mt-5 inline-flex items-center gap-1 text-xs font-bold text-orange-700">Open account <ArrowRight aria-hidden="true" className="size-3.5" /></span></Link>
          </div>
        </section>

        <section className="border-y bg-slate-950 text-white" id="contact">
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:py-20 lg:grid-cols-[1fr_0.8fr] lg:items-center">
            <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-300">Contact Kawisha Hub NG</p><h2 className="mt-3 max-w-xl text-3xl font-black tracking-tight sm:text-4xl">Stay close to the next collection.</h2><p className="mt-4 max-w-xl text-sm leading-7 text-slate-300">WhatsApp ordering, phone support, email, and social links can be connected here when the business contact details are ready.</p><div className="mt-7 flex flex-wrap gap-2">{["WhatsApp checkout", "Phone support", "Email updates", "Social links"].map((item) => <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200" key={item}>{item}</span>)}</div></div>
            <form className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur" onSubmit={submitNewsletter}><div className="flex size-10 items-center justify-center rounded-xl bg-orange-500 text-white"><Mail aria-hidden="true" className="size-5" /></div><h2 className="mt-5 text-lg font-bold">Newsletter signup</h2><p className="mt-2 text-sm leading-6 text-slate-300">Get new arrivals and promotion updates when email capture is connected.</p><div className="mt-5 flex flex-col gap-2 sm:flex-row"><label className="flex-1"><span className="sr-only">Email address</span><input className="h-10 w-full rounded-lg border border-white/15 bg-white/10 px-3 text-sm text-white outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-orange-400" onChange={(event) => setNewsletterEmail(event.target.value)} placeholder="you@example.com" type="email" value={newsletterEmail} /></label><Button className="bg-orange-500 text-white hover:bg-orange-400" type="submit">Sign up</Button></div>{newsletterMessage ? <p aria-live="polite" className="mt-3 text-xs text-orange-200">{newsletterMessage}</p> : <p className="mt-3 text-[10px] text-slate-400">No marketing emails are sent by this preview yet.</p>}</form>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:py-20">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-orange-700">Built to grow</p><h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Extra ways to bring shoppers back</h2></div><Button asChild variant="outline"><Link href="/dashboard">Open the tracker <ArrowUpRight aria-hidden="true" /></Link></Button></div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{growthFeatures.map((feature) => { const Icon = feature.icon; return <div className="rounded-2xl border bg-card p-5" key={feature.title}><Icon aria-hidden="true" className="size-5 text-orange-600" /><h3 className="mt-5 text-sm font-bold text-slate-950">{feature.title}</h3><p className="mt-2 text-xs leading-5 text-muted-foreground">{feature.text}</p></div>; })}</div>
        </section>
      </main>

      <footer className="border-t bg-white/70">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 text-sm sm:flex-row sm:items-center sm:justify-between">
          <div><div className="flex items-center gap-2 font-bold"><span className="flex size-8 items-center justify-center rounded-lg bg-primary text-[10px] text-primary-foreground">KH</span>{snapshot.data.businessName}</div><p className="mt-2 text-xs text-muted-foreground">Fashion, footwear, accessories, and home essentials.</p></div>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground"><Link className="hover:text-orange-700" href="/store">Public store</Link><Link className="hover:text-orange-700" href="/account">Customer account</Link><Link className="hover:text-orange-700" href="/auth/login">Owner login</Link><Link className="hover:text-orange-700" href="/dashboard">Private tracker</Link></div>
        </div>
      </footer>
    </div>
  );
}
