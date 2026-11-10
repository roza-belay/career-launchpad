import { Link } from "@tanstack/react-router";
import { Hammer } from "lucide-react";
import { PageHeader } from "./AppShell";
import { Button } from "@/components/ui/button";

export function ComingNext({ title, description }: { title: string; description: string }) {
  return (
    <>
      <PageHeader title={title} />
      <div className="card-soft flex flex-col items-center p-12 text-center">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Hammer className="size-6" /></span>
        <h2 className="mt-4 text-lg font-semibold">Coming in the next build</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
        <Button asChild className="mt-5" variant="secondary"><Link to="/dashboard">Back to dashboard</Link></Button>
      </div>
    </>
  );
}
