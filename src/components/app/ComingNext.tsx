import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { PageHeader } from "./AppShell";
import { Button } from "@/components/ui/button";
import { usePrefs } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n/messages";

export function ComingNext({ title, description }: { title: MessageKey; description: MessageKey }) {
  const { t } = usePrefs();
  return (
    <>
      <PageHeader title={t(title)} />
      <div className="card-soft flex flex-col items-center p-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Hammer className="size-6" /></span>
        <h2 className="mt-4 text-lg font-semibold">{t("soon.title")}</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{t(description)}</p>
        <Button asChild className="mt-5" variant="secondary"><Link to="/dashboard">{t("soon.back")}</Link></Button>
      </div>
    </>
  );
}
