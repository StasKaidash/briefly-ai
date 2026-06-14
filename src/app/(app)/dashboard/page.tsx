import { BriefForm } from "@/components/brief-form";
import { BriefsRealtime } from "@/components/briefs-realtime";
import { BriefsSearch } from "@/components/briefs-search";
import type { Brief } from "@/lib/types";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("briefs")
    .select(
      "id, user_id, url, title, byline, tldr, key_points, tags, reading_time_min, status, error, created_at",
    )
    .order("created_at", { ascending: false });

  const briefs = (data ?? []) as Brief[];

  return (
    <main className="flex-1 px-8 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Your briefs</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Paste any article URL — get a 3-sentence TL;DR, 5 key points, and tags.
        </p>
      </header>

      <div className="mb-8">
        <BriefForm />
      </div>

      {error ? (
        <div className="border-destructive/40 bg-destructive/10 text-destructive rounded-md border px-3 py-2 text-sm">
          Could not load briefs. {error.message}
        </div>
      ) : (
        <BriefsSearch briefs={briefs} />
      )}

      {user && <BriefsRealtime userId={user.id} />}
    </main>
  );
}
