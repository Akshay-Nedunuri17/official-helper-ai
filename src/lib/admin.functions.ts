import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function assertAdmin(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Forbidden: admin only");
}

export const getAdminDashboard = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertAdmin(supabase, userId);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const [s, sv, o, p, c, v, sl, viewsRows, searchRows, complaints] = await Promise.all([
      supabaseAdmin.from("schemes").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("services").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("offices").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("complaints").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("scheme_views").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("search_logs").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("scheme_views").select("scheme_id"),
      supabaseAdmin.from("search_logs").select("query").order("created_at", { ascending: false }).limit(500),
      supabaseAdmin
        .from("complaints")
        .select("id, tracking_number, title, category, status, created_at")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    const stats = {
      schemes: s.count ?? 0,
      services: sv.count ?? 0,
      offices: o.count ?? 0,
      users: p.count ?? 0,
      complaints: c.count ?? 0,
      views: v.count ?? 0,
      searches: sl.count ?? 0,
    };

    // Top schemes
    const viewCounts = new Map<string, number>();
    ((viewsRows.data ?? []) as { scheme_id: string }[]).forEach((r) =>
      viewCounts.set(r.scheme_id, (viewCounts.get(r.scheme_id) ?? 0) + 1),
    );
    const top = Array.from(viewCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    let topSchemes: { name: string; views: number }[] = [];
    if (top.length > 0) {
      const { data: schemes } = await supabaseAdmin
        .from("schemes")
        .select("id, name_en")
        .in("id", top.map(([id]) => id));
      topSchemes = top.map(([id, count]) => ({
        name: (schemes ?? []).find((x: any) => x.id === id)?.name_en?.slice(0, 28) ?? "—",
        views: count,
      }));
    }

    // Top searches
    const searchCounts = new Map<string, number>();
    ((searchRows.data ?? []) as { query: string }[]).forEach((r) => {
      const k = (r.query ?? "").toLowerCase().trim();
      if (!k) return;
      searchCounts.set(k, (searchCounts.get(k) ?? 0) + 1);
    });
    const topSearches = Array.from(searchCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term, count]) => ({ term, count }));

    return {
      stats,
      topSchemes,
      topSearches,
      recentComplaints: complaints.data ?? [],
    };
  });
