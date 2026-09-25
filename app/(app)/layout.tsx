import { redirect } from "next/navigation";
import { Suspense } from "react";
import { AppShell } from "@/components/app-shell";
import { WorkspaceProvider } from "@/lib/workspace-context";
import { getWorkspaceSnapshot } from "@/lib/data";
import { hasEnvVars } from "@/lib/utils";
import { createClient } from "@/lib/supabase/server";

export const instant = false;

export default async function WorkspaceLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#f5f7fb]" aria-label="Loading workspace" />}>
      <WorkspaceContent>{children}</WorkspaceContent>
    </Suspense>
  );
}

async function WorkspaceContent({ children }: Readonly<{ children: React.ReactNode }>) {
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (!data.user) redirect("/auth/login");
    const snapshot = await getWorkspaceSnapshot();
    if (!snapshot.hasMembership && data.user.user_metadata?.account_type === "customer") redirect("/account");
    return <WorkspaceProvider initialSnapshot={snapshot}><AppShell>{children}</AppShell></WorkspaceProvider>;
  }
  const snapshot = await getWorkspaceSnapshot();
  return <WorkspaceProvider initialSnapshot={snapshot}><AppShell>{children}</AppShell></WorkspaceProvider>;
}
