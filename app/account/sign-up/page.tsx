import type { Metadata } from "next";
import Link from "next/link";
import { Home } from "lucide-react";

import { CustomerSignUpForm } from "@/components/customer-auth-forms";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Create customer account · Kawisha Hub NG" };
export const instant = false;

export default async function CustomerSignUpPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const params = await searchParams;
  return <div className="flex min-h-svh items-center justify-center bg-muted/30 p-6"><div className="w-full max-w-sm"><div className="mb-4 text-center"><Link aria-label="Go to Kawisha Hub NG home page" className="inline-flex rounded-md text-xl font-semibold tracking-tight focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href="/">Kawisha Hub NG</Link><p className="mt-1 text-xs uppercase tracking-[0.2em] text-muted-foreground">Customer account</p></div><div className="mb-4 flex justify-center"><Button asChild size="sm" variant="outline"><Link href="/"><Home aria-hidden="true" />Go to home</Link></Button></div><CustomerSignUpForm nextUrl={params.next} /></div></div>;
}
