import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { usePrefs } from "@/lib/i18n";
import { PreferenceControls } from "@/components/app/PreferenceControls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }, { title: "Set new password — Career Launchpad" }, { name: "description", content: "Choose a new password." }, { property: "og:title", content: "Set new password" }, { property: "og:description", content: "Choose a new password." }] }),
  component: Reset,
});

function Reset() {
  const [pw, setPw] = useState("");
  const navigate = useNavigate();
  const { t } = usePrefs();
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { toast.error(t("auth.pwShort")); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    toast.success(t("reset.done"));
    navigate({ to: "/dashboard" });
  }
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-background p-6">
      <PreferenceControls className="absolute right-4 top-4" />
      <form onSubmit={submit} className="card-soft w-full max-w-sm space-y-4 p-8">
        <h1 className="text-2xl font-semibold">{t("reset.title")}</h1>
        <div className="space-y-1.5"><Label htmlFor="pw">{t("reset.new")}</Label><Input id="pw" type="password" value={pw} onChange={(e) => setPw(e.target.value)} required /></div>
        <Button type="submit" className="w-full">{t("reset.save")}</Button>
      </form>
    </div>
  );
}
