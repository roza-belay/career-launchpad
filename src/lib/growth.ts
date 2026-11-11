export const GROWTH_HUBS = ["ROADMAP", "CHANGE", "STRENGTHS", "LINKEDIN", "SALARY", "BUSINESS"] as const;
export type GrowthHub = (typeof GROWTH_HUBS)[number];
export const GROWTH_STATUSES = ["TODO", "DOING", "DONE"] as const;
type Item = { hub: string; status: string; target_date: string | null };

/** Percent of items marked DONE (0 when empty). */
export function growthProgress(items: Pick<Item, "status">[]): number {
  if (!items.length) return 0;
  return Math.round((items.filter((i) => i.status === "DONE").length / items.length) * 100);
}

/** Recommended next steps: hubs with no items first, then overdue open items. */
export function nextSteps(items: Item[], today: string): { kind: "start" | "overdue"; hub: GrowthHub }[] {
  const steps: { kind: "start" | "overdue"; hub: GrowthHub }[] = [];
  for (const h of GROWTH_HUBS) if (!items.some((i) => i.hub === h)) steps.push({ kind: "start", hub: h });
  for (const h of GROWTH_HUBS)
    if (items.some((i) => i.hub === h && i.status !== "DONE" && i.target_date && i.target_date < today)) steps.push({ kind: "overdue", hub: h });
  return steps.slice(0, 5);
}
