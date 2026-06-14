import { ArrowLeft, FileQuestion } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export const metadata = { title: "Not found" };

/**
 * Catches `notFound()` calls from any route — most notably the brief detail
 * page when an id doesn't exist or RLS hides the row from the current user.
 */
export default function NotFound() {
  return (
    <main className="flex-1 px-6 py-24">
      <div className="mx-auto max-w-md space-y-6 text-center">
        <div className="bg-muted text-muted-foreground mx-auto grid h-14 w-14 place-items-center rounded-full">
          <FileQuestion className="h-6 w-6" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            We couldn&apos;t find that page.
          </h1>
          <p className="text-muted-foreground text-sm">
            It might have been deleted, or the link is wrong.
          </p>
        </div>
        <Button asChild className="gap-2">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    </main>
  );
}
