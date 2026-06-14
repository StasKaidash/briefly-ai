"use client";

import { X } from "lucide-react";
import { useOptimistic, useRef, useTransition } from "react";
import { toast } from "sonner";

import { addTagAction, removeTagAction } from "@/actions/update-tags";
import { Input } from "@/components/ui/input";
import { MAX_TAGS, normalizeTag, TAG_RE } from "@/lib/tags";

type Action = { type: "add"; tag: string } | { type: "remove"; tag: string };

/**
 * Editable tags for a single brief.
 *
 * Source of truth: the `initialTags` prop, which arrives fresh on every server
 * re-render (parent calls `revalidatePath` after each successful mutation). We
 * deliberately do NOT keep a parallel `useState` copy — that pattern would
 * snapshot tags at mount and then go stale, hiding any updates from Realtime
 * or another tab.
 *
 * `useOptimistic` flips the chip list instantly while the server action runs.
 * If the action fails we toast the error and React drops the optimistic value
 * when the transition completes, falling back to the unchanged real state.
 *
 * Both `add` and `remove` dispatch inside an explicit transition so the
 * `useOptimistic` contract is upheld regardless of whether the call site is a
 * form action or a click handler.
 */
export function BriefTagsEditor({
  briefId,
  initialTags,
}: {
  briefId: string;
  initialTags: string[];
}) {
  const [optimistic, applyOptimistic] = useOptimistic<string[], Action>(
    initialTags,
    (current, action) =>
      action.type === "add"
        ? [...current, action.tag]
        : current.filter((t) => t !== action.tag),
  );
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleAdd(formData: FormData) {
    const tag = normalizeTag(String(formData.get("tag") ?? ""));
    if (!tag) return;
    if (!TAG_RE.test(tag)) {
      toast.error("Tags can use a–z, 0–9, and dashes only (max 32 chars).");
      return;
    }
    if (optimistic.includes(tag)) {
      toast.info("Tag already added.");
      return;
    }
    if (optimistic.length >= MAX_TAGS) {
      toast.error(`Max ${MAX_TAGS} tags per brief.`);
      return;
    }
    if (inputRef.current) inputRef.current.value = "";

    startTransition(async () => {
      applyOptimistic({ type: "add", tag });
      const result = await addTagAction(briefId, tag);
      if (!result.ok) toast.error(result.error);
    });
  }

  function handleRemove(tag: string) {
    startTransition(async () => {
      applyOptimistic({ type: "remove", tag });
      const result = await removeTagAction(briefId, tag);
      if (!result.ok) toast.error(result.error);
    });
  }

  const atMax = optimistic.length >= MAX_TAGS;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {optimistic.map((tag) => (
        <button
          type="button"
          key={tag}
          onClick={() => handleRemove(tag)}
          title="Click to remove"
          className="group bg-muted text-muted-foreground hover:bg-destructive/10 hover:text-destructive focus-visible:ring-ring inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[11px] transition-colors focus-visible:ring-2 focus-visible:outline-none"
          aria-label={`Remove tag ${tag}`}
        >
          #{tag}
          <X className="h-3 w-3 opacity-50 group-hover:opacity-100" />
        </button>
      ))}
      <form action={handleAdd} className="inline-flex">
        <Input
          ref={inputRef}
          name="tag"
          aria-label="Add tag"
          placeholder={atMax ? "max reached" : "add tag…"}
          maxLength={32}
          autoComplete="off"
          disabled={atMax}
          className="h-6 w-28 border-none bg-transparent px-2 font-mono text-[11px] shadow-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </form>
    </div>
  );
}
