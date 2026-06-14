import { AlertTriangle, Clock } from "lucide-react";
import Link from "next/link";

import { TagChip } from "@/components/tag-chip";
import { Skeleton } from "@/components/ui/skeleton";
import type { Brief } from "@/lib/types";
import { cn, formatRelativeDate, hostFromUrl } from "@/lib/utils";

const MAX_VISIBLE_TAGS = 4;

export function BriefCard({ brief }: { brief: Brief }) {
  if (brief.status === "pending") return <BriefCardSkeleton />;
  if (brief.status === "failed") return <BriefCardFailed brief={brief} />;

  const host = hostFromUrl(brief.url);
  const extraTags = Math.max(0, brief.tags.length - MAX_VISIBLE_TAGS);

  return (
    <Link
      href={`/briefs/${brief.id}`}
      className={cn(
        "ring-foreground/10 bg-card group/card flex flex-col gap-3 rounded-xl p-4 ring-1 transition-shadow",
        "hover:ring-foreground/25 focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none",
      )}
    >
      <h3 className="line-clamp-2 text-sm leading-snug font-semibold">
        {brief.title}
      </h3>

      <p className="text-muted-foreground line-clamp-3 text-sm">{brief.tldr}</p>

      {brief.tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {brief.tags.slice(0, MAX_VISIBLE_TAGS).map((tag) => (
            <TagChip key={tag} tag={tag} />
          ))}
          {extraTags > 0 && (
            <span className="text-muted-foreground font-mono text-[11px]">
              +{extraTags}
            </span>
          )}
        </div>
      )}

      <div className="text-muted-foreground mt-auto flex items-center gap-3 font-mono text-[11px]">
        <span className="truncate">{host}</span>
        {brief.reading_time_min !== null && (
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {brief.reading_time_min} min
          </span>
        )}
        <span className="ml-auto">{formatRelativeDate(brief.created_at)}</span>
      </div>
    </Link>
  );
}

function BriefCardSkeleton() {
  return (
    <div className="ring-foreground/10 bg-card flex flex-col gap-3 rounded-xl p-4 ring-1">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <div className="flex gap-1.5">
        <Skeleton className="h-4 w-12 rounded-full" />
        <Skeleton className="h-4 w-14 rounded-full" />
      </div>
    </div>
  );
}

function BriefCardFailed({ brief }: { brief: Brief }) {
  const host = hostFromUrl(brief.url);

  return (
    <div className="border-destructive/30 bg-destructive/5 flex flex-col gap-3 rounded-xl border border-dashed p-4">
      <div className="text-destructive flex items-center gap-2 text-xs font-semibold">
        <AlertTriangle className="h-3.5 w-3.5" />
        Brief failed
      </div>
      <p className="text-muted-foreground line-clamp-2 text-xs">
        {brief.error ?? "Something went wrong while summarizing this article."}
      </p>
      <div className="text-muted-foreground mt-auto flex items-center gap-3 font-mono text-[11px]">
        <span className="truncate">{host}</span>
        <span className="ml-auto">{formatRelativeDate(brief.created_at)}</span>
      </div>
    </div>
  );
}
