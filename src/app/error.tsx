"use client";

import { AlertOctagon, RotateCw } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

/**
 * Root-level error boundary. Next renders this when a child segment throws
 * during render or in a server action that bubbles to the client.
 *
 * `error.digest` is a hash Next attaches to the server-side error log line —
 * it's the only safe identifier to expose to users.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the full error in dev; prod just logs the digest server-side.
    if (process.env.NODE_ENV !== "production") {
      console.error("[error boundary]", error);
    }
  }, [error]);

  return (
    <main className="flex-1 px-6 py-24">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="bg-destructive/10 text-destructive mx-auto grid h-14 w-14 place-items-center rounded-full">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Something went wrong.
          </h1>
          <p className="text-muted-foreground text-sm">
            An unexpected error occurred. Try again — if it keeps happening,
            give it a minute and refresh.
          </p>
          {error.digest && (
            <p className="text-muted-foreground font-mono text-[11px]">
              ref: {error.digest}
            </p>
          )}
        </div>
        <Button onClick={() => reset()} className="gap-2">
          <RotateCw className="h-4 w-4" />
          Try again
        </Button>
      </div>
    </main>
  );
}
