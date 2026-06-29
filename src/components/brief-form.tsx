"use client";

import { Loader2, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { toast } from "sonner";

import {
  createBriefAction,
  type CreateBriefState,
} from "@/actions/create-brief";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function BriefForm() {
  const router = useRouter();
  const [state, formAction] = useActionState<CreateBriefState, FormData>(
    createBriefAction,
    null,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const lastHandledRef = useRef<CreateBriefState>(null);

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;

    if (state.ok) {
      toast.success("Briefing started", {
        description: "Watch the skeleton card finish loading.",
      });
      formRef.current?.reset();
      // Belt-and-suspenders: the server action revalidates the path and
      // Supabase Realtime should fire on INSERT, but if Realtime publication
      // is misconfigured the skeleton card never appears. router.refresh()
      // guarantees the dashboard re-fetches RSC after a successful submit.
      router.refresh();
    } else {
      toast.error("Could not start brief", { description: state.error });
    }
  }, [state, router]);

  return (
    <form
      ref={formRef}
      action={formAction}
      className="bg-card ring-foreground/10 flex items-center gap-2 rounded-xl p-2 ring-1 focus-within:ring-2 focus-within:ring-primary/40"
    >
      <Input
        name="url"
        type="url"
        required
        placeholder="Paste a URL to brief…"
        className="h-9 border-none bg-transparent shadow-none focus-visible:ring-0"
      />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="gap-1.5">
      {pending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Sparkles className="h-3.5 w-3.5" />
      )}
      Brief it
    </Button>
  );
}
