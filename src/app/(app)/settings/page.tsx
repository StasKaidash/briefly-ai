import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { logoutAction } from "@/actions/logout";
import { DeleteAllBriefs } from "@/components/delete-all-briefs";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // The (app) layout already redirects unauthenticated users, but TS doesn't
  // know that — keep this guard so `user.email!` isn't needed below.
  if (!user) redirect("/login");

  const email = user.email ?? "unknown@local";

  return (
    <main className="flex-1 px-8 py-10">
      <div className="mx-auto max-w-2xl space-y-10">
        <header>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Manage your account and data.
          </p>
        </header>

        <Section title="Account">
          <Row label="Email" value={email} />
          <Row
            label="Member since"
            value={new Date(user.created_at).toLocaleDateString("en", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          />
          <div className="pt-2">
            <form action={logoutAction}>
              <Button type="submit" variant="outline" className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            </form>
          </div>
        </Section>

        <Section
          title="Danger zone"
          description="Destructive actions. Read carefully."
        >
          <DeleteAllBriefs email={email} />
        </Section>
      </div>
    </main>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && (
          <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
        )}
      </div>
      <div className="bg-card ring-foreground/10 space-y-3 rounded-xl p-5 ring-1">
        {children}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground font-mono text-xs">{value}</span>
    </div>
  );
}
