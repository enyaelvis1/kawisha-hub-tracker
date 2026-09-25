import { redirect } from "next/navigation";

import { LoginForm } from "@/components/login-form";
import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/utils";

export const instant = false;

export default async function Page() {
  if (hasEnvVars) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    if (data.user) redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center bg-[#f5f7fb] p-6 md:p-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center"><p className="text-xl font-semibold tracking-tight text-slate-950">Kawisha Hub</p><p className="mt-1 text-xs uppercase tracking-[0.22em] text-slate-400">Private operations</p></div>
        <LoginForm />
      </div>
    </div>
  );
}
