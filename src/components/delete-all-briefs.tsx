"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteAllBriefsAction } from "@/actions/delete-all-briefs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Two-step destructive control:
 *
 * 1. The default state shows a single "Delete all my briefs" button with a
 *    plain-language warning. Clicking it expands an inline confirm form.
 * 2. The confirm form requires the user to type their own email — same
 *    pattern as GitHub's repo-delete dialog. Only then is the submit button
 *    enabled. This catches the "muscle memory clicks two buttons in a row"
 *    case which `confirm()` does not.
 *
 * On success we toast the count and reset to step 1; the page revalidates so
 * the briefs grid is empty next time the user lands on /dashboard.
 */
export function DeleteAllBriefs({ email }: { email: string }) {
  const [armed, setArmed] = useState(false);
  const [typed, setTyped] = useState("");
  const [pending, startTransition] = useTransition();

  const canSubmit = typed.trim().toLowerCase() === email.trim().toLowerCase();

  function handleConfirm() {
    if (!canSubmit) return;
    startTransition(async () => {
      const result = await deleteAllBriefsAction();
      if (result.ok) {
        toast.success(
          result.count === 0
            ? "Nothing to delete."
            : `Deleted ${result.count} brief${result.count === 1 ? "" : "s"}.`,
        );
        setArmed(false);
        setTyped("");
      } else {
        toast.error(result.error);
      }
    });
  }

  if (!armed) {
    return (
      <Button
        type="button"
        variant="outline"
        onClick={() => setArmed(true)}
        className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive gap-2"
      >
        <Trash2 className="h-4 w-4" />
        Delete all my briefs
      </Button>
    );
  }

  return (
    <div className="border-destructive/40 bg-destructive/5 space-y-3 rounded-lg border p-4">
      <div>
        <p className="text-sm font-medium">Are you sure?</p>
        <p className="text-muted-foreground mt-1 text-xs">
          This deletes every brief on your account. The action can&apos;t be
          undone.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-email" className="text-xs">
          Type{" "}
          <span className="text-foreground font-mono">{email}</span>{" "}
          to confirm
        </Label>
        <Input
          id="confirm-email"
          value={typed}
          onChange={(e) => setTyped(e.target.value)}
          autoComplete="off"
          autoFocus
          disabled={pending}
          placeholder={email}
          className="h-9"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
          disabled={!canSubmit || pending}
          className="gap-2"
        >
          {pending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
          {pending ? "Deleting…" : "Yes, delete everything"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => {
            setArmed(false);
            setTyped("");
          }}
          disabled={pending}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
