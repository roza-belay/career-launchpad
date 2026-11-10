import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Set new password — Career Launchpad" }, { name: "description", content: "Choose a new password." }, { property: "og:title", content: "Set new password" }, { property: "og:description", content: "Choose a new password." }] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error("Password must be at least 8 characters"); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success("Password updated");
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <form onSubmit={submit} className="card-soft w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-semibold">Set a new password</h1>
        <div className="space-y-1.5"><Label htmlFor="pw">New password</Label><Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
        <Button type="submit" className="w-full">Save password</Button>
      </form>
    </div>
  );
}
