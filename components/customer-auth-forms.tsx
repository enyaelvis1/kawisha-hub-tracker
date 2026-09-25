"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

function safeNext(value: string | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/account";
}

export function CustomerLoginForm({ nextUrl }: { nextUrl?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { error: signInError } = await createClient().auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      router.push(safeNext(nextUrl));
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-2xl">Welcome back</CardTitle><CardDescription>Sign in to continue to checkout or review your orders.</CardDescription></CardHeader>
      <CardContent><form className="space-y-5" onSubmit={submit}><div className="grid gap-2"><Label htmlFor="customer-login-email">Email</Label><Input autoComplete="email" id="customer-login-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></div><div className="grid gap-2"><Label htmlFor="customer-login-password">Password</Label><Input autoComplete="current-password" id="customer-login-password" onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></div>{error ? <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}<Button className="w-full" disabled={loading} type="submit">{loading ? "Signing in…" : "Sign in"}</Button><p className="text-center text-sm text-muted-foreground">New here? <Link className="font-medium text-foreground underline underline-offset-4" href={`/account/sign-up${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}>Create an account</Link></p></form></CardContent>
    </Card>
  );
}

export function CustomerSignUpForm({ nextUrl }: { nextUrl?: string }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    try {
      const { data, error: signUpError } = await createClient().auth.signUp({ email, password, options: { data: { full_name: name.trim(), account_type: "customer" } } });
      if (signUpError) throw signUpError;
      if (data.session) router.push(safeNext(nextUrl));
      else setMessage("Check your email to confirm the account, then return here to sign in.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not create your account.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-2xl">Create your account</CardTitle><CardDescription>Save your details and keep track of public store orders.</CardDescription></CardHeader>
      <CardContent><form className="space-y-5" onSubmit={submit}><div className="grid gap-2"><Label htmlFor="customer-signup-name">Full name</Label><Input autoComplete="name" id="customer-signup-name" onChange={(event) => setName(event.target.value)} required value={name} /></div><div className="grid gap-2"><Label htmlFor="customer-signup-email">Email</Label><Input autoComplete="email" id="customer-signup-email" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></div><div className="grid gap-2"><Label htmlFor="customer-signup-password">Password</Label><Input autoComplete="new-password" id="customer-signup-password" minLength={8} onChange={(event) => setPassword(event.target.value)} required type="password" value={password} /></div>{error ? <p role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}{message ? <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{message}</p> : null}<Button className="w-full" disabled={loading} type="submit">{loading ? "Creating account…" : "Create account"}</Button><p className="text-center text-sm text-muted-foreground">Already have an account? <Link className="font-medium text-foreground underline underline-offset-4" href={`/account/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ""}`}>Sign in</Link></p></form></CardContent>
    </Card>
  );
}
