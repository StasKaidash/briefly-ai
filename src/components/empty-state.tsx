import { Sparkles } from "lucide-react";

export function EmptyState() {
  return (
    <div className="border-border grid place-items-center rounded-xl border border-dashed py-20 text-center">
      <div className="space-y-3">
        <div className="bg-primary/10 text-primary mx-auto grid h-12 w-12 place-items-center rounded-full">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">No briefs yet</h2>
          <p className="text-muted-foreground text-sm">
            Paste a URL above to get your first brief.
          </p>
        </div>
      </div>
    </div>
  );
}
