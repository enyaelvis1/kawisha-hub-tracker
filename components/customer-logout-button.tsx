"use client";

import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

export function CustomerLogoutButton() {
  const router = useRouter();
  return <Button onClick={async () => { await createClient().auth.signOut(); router.push("/store"); router.refresh(); }} variant="outline">Sign out</Button>;
}
