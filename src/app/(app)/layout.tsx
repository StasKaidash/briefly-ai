import { redirect } from "next/navigation";

import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/lib/supabase/server";

/**
 * Protected route-group layout: gates every page under `(app)` behind auth,
 * and frames children with the persistent sidebar.
 *
 * Auth check is duplicated here (in addition to the proxy) because route groups
 * compose at render time — the proxy gate is the network-level safety net, this
 * is the page-level guarantee that `user` exists for downstream RSCs.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="flex min-h-dvh">
      <Sidebar email={user.email ?? "unknown"} />
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
