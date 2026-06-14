import { BriefCard } from "@/components/brief-card";
import { EmptyState } from "@/components/empty-state";
import type { Brief } from "@/lib/types";

export function BriefsGrid({ briefs }: { briefs: Brief[] }) {
  if (briefs.length === 0) return <EmptyState />;

  return (
    <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {briefs.map((brief) => (
        <BriefCard key={brief.id} brief={brief} />
      ))}
    </div>
  );
}
