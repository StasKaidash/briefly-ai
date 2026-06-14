"use client";

import { Search, SearchX, X } from "lucide-react";
import { useDeferredValue, useMemo, useState } from "react";

import { BriefsGrid } from "@/components/briefs-grid";
import { EmptyState } from "@/components/empty-state";
import { Input } from "@/components/ui/input";
import type { Brief } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Client-side search wrapper around the briefs grid.
 *
 * Why client-side: for a personal dashboard with ≤200 briefs the whole list
 * already arrives on the dashboard server fetch — filtering in memory is
 * instant and avoids an extra round-trip per keystroke. If briefs ever scale
 * up, swap the `useMemo` for a Postgres full-text query (see BUILD_PROMPT §10).
 *
 * Query syntax:
 *   `react`     → title OR any tag contains "react" (case-insensitive)
 *   `#design`   → only briefs that have a tag containing "design"
 *
 * `useDeferredValue` keeps the input snappy if the list gets large — React
 * lets the typed value render immediately and defers the (cheap) filter pass.
 */
export function BriefsSearch({ briefs }: { briefs: Brief[] }) {
  const [query, setQuery] = useState("");
  const deferred = useDeferredValue(query);

  const filtered = useMemo(() => {
    const q = deferred.trim().toLowerCase();
    if (!q) return briefs;

    if (q.startsWith("#")) {
      const tag = q.slice(1);
      if (!tag) return briefs;
      return briefs.filter((b) => b.tags.some((t) => t.includes(tag)));
    }

    return briefs.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.tags.some((t) => t.toLowerCase().includes(q)),
    );
  }, [briefs, deferred]);

  // Nothing in the DB yet — skip the search bar entirely; no point offering
  // to filter zero items.
  if (briefs.length === 0) return <EmptyState />;

  const showStale = query !== deferred;

  return (
    <>
      <SearchInput value={query} onChange={setQuery} pending={showStale} />
      {filtered.length === 0 ? (
        <NoResults query={query} onClear={() => setQuery("")} />
      ) : (
        <BriefsGrid briefs={filtered} />
      )}
    </>
  );
}

function SearchInput({
  value,
  onChange,
  pending,
}: {
  value: string;
  onChange: (v: string) => void;
  pending: boolean;
}) {
  return (
    <div
      className={cn(
        "bg-card ring-foreground/10 mb-6 flex items-center gap-2 rounded-xl p-2 ring-1 transition-shadow focus-within:ring-2 focus-within:ring-primary/40",
        pending && "opacity-80",
      )}
    >
      <Search className="text-muted-foreground ml-1.5 h-4 w-4 shrink-0" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by title or #tag"
        aria-label="Search briefs"
        className="h-9 border-none bg-transparent shadow-none focus-visible:ring-0"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="text-muted-foreground hover:text-foreground focus-visible:ring-ring mr-1 rounded-md p-1 transition-colors focus-visible:ring-2 focus-visible:outline-none"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

function NoResults({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="border-border grid place-items-center rounded-xl border border-dashed py-20 text-center">
      <div className="space-y-3">
        <div className="bg-muted text-muted-foreground mx-auto grid h-12 w-12 place-items-center rounded-full">
          <SearchX className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold">No matches</h2>
          <p className="text-muted-foreground text-sm">
            Nothing in your briefs matches{" "}
            <span className="text-foreground font-mono">{query}</span>.
          </p>
        </div>
        <button
          type="button"
          onClick={onClear}
          className="text-primary text-sm font-medium hover:underline"
        >
          Clear search
        </button>
      </div>
    </div>
  );
}
