import { createFileRoute, useRouteContext, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — Career Launchpad" }, { name: "description", content: "Account settings." }, { property: "og:title", content: "Settings" }, { property: "og:description", content: "Account settings." }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = useRouteContext({ from: "/_authenticated" });
  const router = useRouter();
  const [name, setName] = useState((user.user_metadata?.["full_name"] as string) ?? "");
  async function save(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.updateUser({ data: { full_name: name.trim() } });
    if (error) { toast.error(error.message); return; }
    toast.success("Saved");
    router.invalidate();
  }
  return (
    <>
      <PageHeader title="Settings" />
      <form onSubmit={save} className="card-soft max-w-lg space-y-4 p-6">
        <div className="space-y-1.5"><Label>Email</Label><Input value={user.email ?? ""} disabled /></div>
        <div className="space-y-1.5"><Label htmlFor="n">Display name</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} maxLength={60} /></div>
        <Button type="submit">Save</Button>
      </form>
    </>
  );
}
