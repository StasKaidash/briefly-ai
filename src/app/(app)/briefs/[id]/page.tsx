import { AlertTriangle, ArrowLeft, Clock, ExternalLink, Loader2 } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { BriefDeleteButton } from "@/components/brief-delete-button";
import { BriefDetailRealtime } from "@/components/brief-detail-realtime";
import { BriefTagsEditor } from "@/components/brief-tags-editor";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";
import type { Brief } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";
import { formatRelativeDate, hostFromUrl } from "@/lib/utils";

export const metadata = { title: "Brief" };

export default async function BriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("briefs")
    .select(
      "id, user_id, url, title, byline, tldr, key_points, tags, reading_time_min, status, error, created_at",
    )
    .eq("id", id)
    .single();

  if (error) {
    logger.error("briefDetail", "fetch failed", { id, message: error.message });
    notFound();
  }
  if (!data) notFound();
  const brief = data as Brief;
  const host = hostFromUrl(brief.url);

  return (
    <main className="flex-1 px-8 py-10">
      <div className="mx-auto max-w-3xl">
        <Button variant="ghost" size="sm" asChild className="-ml-2 mb-4 gap-1.5">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>

        {brief.status === "pending" ? (
          <PendingState />
        ) : brief.status === "failed" ? (
          <FailedState brief={brief} />
        ) : (
          <ReadyContent brief={brief} host={host} />
        )}

        <div className="border-border mt-12 flex items-center justify-between border-t pt-6">
          <a
            href={brief.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-sm transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Open original
          </a>
          <BriefDeleteButton briefId={brief.id} />
        </div>
      </div>

      <BriefDetailRealtime briefId={brief.id} />
    </main>
  );
}

function ReadyContent({ brief, host }: { brief: Brief; host: string }) {
  return (
    <article>
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {brief.title}
        </h1>
        {brief.byline && (
          <p className="text-muted-foreground mt-2 text-sm">{brief.byline}</p>
        )}
        <div className="text-muted-foreground mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[11px]">
          <span className="truncate">{host}</span>
          {brief.reading_time_min !== null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {brief.reading_time_min} min
            </span>
          )}
          <span>{formatRelativeDate(brief.created_at)}</span>
        </div>
      </header>

      <section className="mb-8">
        <h2 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
          TL;DR
        </h2>
        <p className="text-foreground/90 text-base leading-relaxed">
          {brief.tldr}
        </p>
      </section>

      {brief.key_points.length > 0 && (
        <section className="mb-8">
          <h2 className="text-muted-foreground mb-3 text-xs font-semibold tracking-wider uppercase">
            Key points
          </h2>
          <ol className="space-y-2">
            {brief.key_points.map((point, i) => (
              <li
                key={i}
                className="text-foreground/90 flex gap-3 text-sm leading-relaxed"
              >
                <span className="text-muted-foreground font-mono text-xs leading-6">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section>
        <h2 className="text-muted-foreground mb-2 text-xs font-semibold tracking-wider uppercase">
          Tags
        </h2>
        <BriefTagsEditor briefId={brief.id} initialTags={brief.tags} />
      </section>
    </article>
  );
}

function PendingState() {
  return (
    <div className="bg-muted/30 border-border flex items-center gap-3 rounded-xl border border-dashed p-6">
      <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
      <div>
        <p className="text-sm font-medium">Still summarizing…</p>
        <p className="text-muted-foreground text-xs">
          Briefly is reading the article. This page will update automatically.
        </p>
      </div>
    </div>
  );
}

function FailedState({ brief }: { brief: Brief }) {
  return (
    <div className="border-destructive/30 bg-destructive/5 rounded-xl border border-dashed p-6">
      <div className="text-destructive flex items-center gap-2 text-sm font-semibold">
        <AlertTriangle className="h-4 w-4" />
        Brief failed
      </div>
      <p className="text-muted-foreground mt-2 text-sm">
        {brief.error ?? "Something went wrong while summarizing this article."}
      </p>
    </div>
  );
}
