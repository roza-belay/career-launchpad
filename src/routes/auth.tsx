import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Career Launchpad" },
      { name: "description", content: "Sign in to your private Career Launchpad." },
      { property: "og:title", content: "Sign in — Career Launchpad" },
      { property: "og:description", content: "Sign in to your private Career Launchpad." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup" | "forgot";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      } else if (mode === "signup") {
        if (password.length < 8) throw new Error("Password must be at least 8 characters");
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin, data: { full_name: name } } });
        if (error) throw error;
        setNotice("Check your email to confirm your account, then sign in.");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
        if (error) throw error;
        setNotice("If that email exists, a reset link is on its way.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="card-soft w-full max-w-sm p-8">
        <span className="flex size-11 items-center justify-center rounded-xl bg-hero text-primary-foreground"><Rocket className="size-5" /></span>
        <h1 className="mt-5 text-2xl font-semibold">{mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your space" : "Reset password"}</h1>
        {notice ? (
          <p className="mt-4 rounded-xl bg-primary-soft p-4 text-sm">{notice}</p>
        ) : (
          <form onSubmit={submit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5"><Label htmlFor="name">First name</Label><Input id="name" value={name} onChange={(e) => setName(e.target.value)} required /></div>
            )}
            <div className="space-y-1.5"><Label htmlFor="email">Email</Label><Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            {mode !== "forgot" && (
              <div className="space-y-1.5"><Label htmlFor="pw">Password</Label><Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={mode === "signup" ? 8 : undefined} /></div>
            )}
            <Button type="submit" className="w-full" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}</Button>
          </form>
        )}
        <div className="mt-5 flex flex-col gap-1 text-sm text-muted-foreground">
          {mode !== "signin" && <button className="text-left hover:text-foreground" onClick={() => { setMode("signin"); setNotice(null); }}>Back to sign in</button>}
          {mode === "signin" && <>
            <button className="text-left hover:text-foreground" onClick={() => setMode("signup")}>No account? Create one</button>
            <button className="text-left hover:text-foreground" onClick={() => setMode("forgot")}>Forgot password?</button>
          </>}
        </div>
      </div>
    </div>
  );
}
