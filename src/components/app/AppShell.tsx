import { Link, Outlet, useNavigate, useRouteContext } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Search, Briefcase, BellRing, MessagesSquare, TrendingUp, FolderGit2, FileText, CalendarCheck, Settings, LogOut, Menu, Rocket, X, Compass,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";
import { PreferenceControls } from "./PreferenceControls";

const NAV = [
  { to: "/dashboard", label: "nav.dashboard", icon: LayoutDashboard },
  { to: "/opportunities", label: "nav.opportunities", icon: Search },
  { to: "/applications", label: "nav.applications", icon: Briefcase },
  { to: "/follow-ups", label: "nav.followups", icon: BellRing },
  { to: "/interview", label: "nav.interview", icon: MessagesSquare },
  { to: "/skills", label: "nav.skills", icon: TrendingUp },
  { to: "/portfolio", label: "nav.portfolio", icon: FolderGit2 },
  { to: "/documents", label: "nav.documents", icon: FileText },
  { to: "/planner", label: "nav.planner", icon: CalendarCheck },
  { to: "/growth", label: "nav.growth", icon: Compass },
  { to: "/settings", label: "nav.settings", icon: Settings },
] as const satisfies readonly { to: string; label: MessageKey; icon: unknown }[];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user } = useRouteContext({ from: "/_authenticated" });
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { t } = usePrefs();

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const sidebar = (
    <div className="flex h-full flex-col gap-6 overflow-y-auto p-5">
      <Link to="/dashboard" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
        <span className="flex size-9 items-center justify-center rounded-xl bg-hero text-hero-foreground"><Rocket className="size-5" /></span>
        <span className="font-display text-lg font-semibold">Career Launchpad</span>
      </Link>
      <nav className="flex flex-1 shrink-0 flex-col gap-1">
        {NAV.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            onClick={() => setOpen(false)}
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-accent"
            activeProps={{ className: "bg-sidebar-accent text-sidebar-accent-foreground" }}
          >
            <Icon className="size-4.5" /> {t(label)}
          </Link>
        ))}
      </nav>
      <PreferenceControls />
      <div className="rounded-xl bg-muted p-3 text-xs">
        <p className="truncate font-medium">{user.email}</p>
        <Button variant="ghost" size="sm" className="mt-2 w-full justify-start px-2" onClick={signOut}>
          <LogOut className="size-4" /> {t("nav.signout")}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-sidebar-border bg-sidebar lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-foreground/30" onClick={() => setOpen(false)} />
          <aside className="relative h-full w-72 bg-sidebar shadow-xl">
            <button className="absolute right-3 top-3 p-2" onClick={() => setOpen(false)} aria-label={t("nav.closeMenu")}><X className="size-5" /></button>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-40 flex items-center gap-3 border-b bg-background/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} aria-label={t("nav.openMenu")} className="p-1"><Menu className="size-5" /></button>
          <span className="font-display font-semibold">Career Launchpad</span>
        </header>
        <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8"><QueryErrorNotice /><Outlet /></main>
      </div>
    </div>
  );
}

function QueryErrorNotice() {
  const qc = useQueryClient();
  const { t } = usePrefs();
  const [failed, setFailed] = useState(false);
  const [retrying, setRetrying] = useState(false);
  useEffect(() => {
    const cache = qc.getQueryCache();
    const update = () => setFailed(cache.getAll().some((q) => q.getObserversCount() > 0 && q.state.status === "error"));
    update();
    return cache.subscribe(update);
  }, [qc]);
  if (!failed) return null;
  return <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-destructive p-4">
    <p className="text-sm">{t("common.loadFailed")}</p>
    <Button variant="outline" disabled={retrying} onClick={async () => {
      setRetrying(true);
      try { await qc.refetchQueries({ type: "active", predicate: (q) => q.state.status === "error" }); }
      finally { setRetrying(false); }
    }}>{t("err.retry")}</Button>
  </div>;
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-semibold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
