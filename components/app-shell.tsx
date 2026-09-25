"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BarChart3,
  Boxes,
  ChevronRight,
  ClipboardList,
  ListChecks,
  LogOut,
  Menu,
  Package,
  PanelLeft,
  Plus,
  Settings,
  ShoppingBag,
  TriangleAlert,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { useWorkspace } from "@/lib/workspace-context";
import { cn } from "@/lib/utils";

const navigation = [
  { href: "/dashboard", label: "Overview", icon: BarChart3 },
  { href: "/products", label: "Products", icon: Package },
  { href: "/stock", label: "Stock", icon: Boxes },
  { href: "/orders", label: "Orders", icon: ClipboardList },
  { href: "/progress", label: "Progress", icon: ListChecks },
  { href: "/store", label: "Public store", icon: ShoppingBag },
  { href: "/settings", label: "Settings", icon: Settings },
];

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/products")) return "Products";
  if (pathname.startsWith("/stock")) return "Stock";
  if (pathname.startsWith("/orders")) return "Orders";
  if (pathname.startsWith("/progress")) return "Project progress";
  if (pathname.startsWith("/settings")) return "Settings";
  return "Overview";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { snapshot, isDemo } = useWorkspace();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const lowStockCount = snapshot.data.products
    .flatMap((product) => product.variants)
    .filter((variant) => variant.stock <= variant.lowStockThreshold).length;
  const pageTitle = getPageTitle(pathname);

  async function signOut() {
    if (isDemo) return;
    await createClient().auth.signOut();
    window.location.assign("/auth/login");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r bg-card px-3 py-4 shadow-sm transition-[width,transform] duration-200 lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed && "lg:w-[76px]",
        )}
      >
        <div className="flex items-center gap-2 px-2 pb-5">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            KH
          </div>
          <div className={cn("min-w-0 flex-1", sidebarCollapsed && "lg:hidden")}>
            <p className="truncate text-sm font-semibold tracking-tight">Kawisha Hub</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Operations</p>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setMobileOpen(false)}
            className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className={cn("mb-5 rounded-xl border bg-muted/40 px-3 py-2.5", sidebarCollapsed && "lg:flex lg:justify-center lg:border-0 lg:bg-transparent lg:px-0")}>
          <div className={cn(sidebarCollapsed && "lg:hidden")}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p>
            <p className="mt-1 truncate text-sm font-medium">{snapshot.data.businessName}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{isDemo ? "Fictional demo" : "Private workspace"}</p>
          </div>
          {sidebarCollapsed ? <span className="hidden text-xs font-bold text-muted-foreground lg:block">WS</span> : null}
        </div>

        <nav aria-label="Primary navigation" className="space-y-1">
          <p className={cn("px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground", sidebarCollapsed && "lg:hidden")}>Workspace</p>
          {navigation.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                aria-current={active ? "page" : undefined}
                title={sidebarCollapsed ? label : undefined}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  sidebarCollapsed && "lg:justify-center lg:px-2",
                  active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className={cn(sidebarCollapsed && "lg:hidden")}>{label}</span>
                {label === "Stock" && lowStockCount > 0 ? (
                  <span className={cn("ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold", sidebarCollapsed && "lg:hidden", active ? "bg-primary-foreground/15 text-primary-foreground" : "bg-amber-100 text-amber-800")}>
                    {lowStockCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-2 border-t pt-4">
          {isDemo ? (
            <p className={cn("px-3 text-xs leading-5 text-muted-foreground", sidebarCollapsed && "lg:hidden")}>Demo changes live only in this browser session.</p>
          ) : (
            <button
              type="button"
              onClick={signOut}
              title={sidebarCollapsed ? "Sign out" : undefined}
              className={cn("flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring", sidebarCollapsed && "lg:justify-center lg:px-2")}
            >
              <LogOut className="size-4 shrink-0" />
              <span className={cn(sidebarCollapsed && "lg:hidden")}>Sign out</span>
            </button>
          )}
        </div>
      </aside>

      {mobileOpen ? <button type="button" aria-label="Close navigation overlay" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-30 bg-slate-950/20 lg:hidden" /> : null}

      <div className={cn("transition-[padding] duration-200 lg:pl-64", sidebarCollapsed && "lg:pl-[76px]")}>
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b bg-background/95 px-4 backdrop-blur md:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" aria-label="Open navigation" onClick={() => setMobileOpen(true)} className="rounded-md border bg-card p-2 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:hidden">
              <Menu className="size-4" />
            </button>
            <button
              type="button"
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!sidebarCollapsed}
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              onClick={() => setSidebarCollapsed((current) => !current)}
              className="hidden rounded-md border bg-card p-2 text-muted-foreground shadow-sm transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring lg:inline-flex"
            >
              <PanelLeft className="size-4" aria-hidden="true" />
            </button>
            <div className="hidden h-5 w-px bg-border lg:block" />
            <div className="min-w-0">
              <p className="truncate text-xs font-medium text-muted-foreground">Private operations</p>
              <h2 className="truncate text-sm font-semibold tracking-tight">{pageTitle}</h2>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <span className={cn("rounded-full border px-2.5 py-1 text-[11px] font-semibold sm:px-3 sm:text-xs", isDemo ? "border-amber-200 bg-amber-50 text-amber-800" : "border-emerald-200 bg-emerald-50 text-emerald-800")}>{isDemo ? "Demo mode" : "Live workspace"}</span>
            <div className="hidden size-8 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground sm:flex">KH</div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1480px] px-4 py-6 md:px-8 md:py-8">
          {isDemo ? (
            <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <TriangleAlert className="mt-0.5 size-4 shrink-0 text-amber-700" aria-hidden="true" />
              <p><span className="font-semibold">Fictional demo data.</span> Changes are temporary and are not saved. Connect Supabase and sign in to record the shop&apos;s real data.</p>
            </div>
          ) : null}
          {children}
        </main>
      </div>
    </div>
  );
}

export function PageHeader({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 border-b pb-6 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow ? <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      </div>
      {action ? <div className="flex shrink-0 items-center gap-2">{action}</div> : null}
    </div>
  );
}

export function StatusPill({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "green" | "amber" | "red" | "blue" }) {
  const colors = {
    slate: "border-slate-200 bg-slate-50 text-slate-700",
    green: "border-emerald-200 bg-emerald-50 text-emerald-800",
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    red: "border-rose-200 bg-rose-50 text-rose-800",
    blue: "border-sky-200 bg-sky-50 text-sky-800",
  };

  return <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold", colors[tone])}><span className="size-1.5 rounded-full bg-current" aria-hidden="true" />{children}</span>;
}

export function BackLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ChevronRight className="size-3.5 rotate-180" aria-hidden="true" />{children}</Link>;
}

export function QuickCreateLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Button asChild size="sm"><Link href={href}><Plus className="size-4" aria-hidden="true" />{children}</Link></Button>;
}
