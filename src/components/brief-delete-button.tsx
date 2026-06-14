"use client";

import { Trash2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { deleteBriefAction } from "@/actions/delete-brief";
import { Button } from "@/components/ui/button";

/**
 * Delete button with a native confirm() prompt. On success the server action
 * throws NEXT_REDIRECT (handled by Next) and the page navigates to /dashboard;
 * we only see a result object on actual failure.
 */
export function BriefDeleteButton({ briefId }: { briefId: string }) {
  const [pending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("Delete this brief? This can't be undone.")) return;
    startTransition(async () => {
      const result = await deleteBriefAction(briefId);
      if (result && !result.ok) toast.error(result.error);
    });
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={handleDelete}
      disabled={pending}
      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive gap-1.5"
    >
      <Trash2 className="h-3.5 w-3.5" />
      {pending ? "Deleting…" : "Delete"}
    </Button>
  );
}
