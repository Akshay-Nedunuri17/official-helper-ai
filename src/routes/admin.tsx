import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ShieldAlert, Users, FileText, MapPin, Building2, TrendingUp, Search as SearchIcon, MessageSquareWarning } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const { t } = useI18n();
  const { user, isAdmin, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const [s, sv, o, p, c, v, sl] = await Promise.all([
        supabase.from("schemes").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("offices").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("complaints").select("id", { count: "exact", head: true }),
        supabase.from("scheme_views").select("id", { count: "exact", head: true }),
        supabase.from("search_logs").select("id", { count: "exact", head: true }),
      ]);
      return { schemes: s.count ?? 0, services: sv.count ?? 0, offices: o.count ?? 0, users: p.count ?? 0, complaints: c.count ?? 0, views: v.count ?? 0, searches: sl.count ?? 0 };
    },
  });

  const { data: topSchemes = [] } = useQuery({
    queryKey: ["admin-top-schemes"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data: views } = await supabase.from("scheme_views").select("scheme_id");
      const counts = new Map<string, number>();
      (views ?? []).forEach((v) => counts.set(v.scheme_id, (counts.get(v.scheme_id) ?? 0) + 1));
      const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
      if (top.length === 0) return [];
      const { data: schemes } = await supabase.from("schemes").select("id, name_en").in("id", top.map(([id]) => id));
      return top.map(([id, count]) => ({ name: (schemes ?? []).find((s) => s.id === id)?.name_en?.slice(0, 28) ?? "—", views: count }));
    },
  });

  const { data: topSearches = [] } = useQuery({
    queryKey: ["admin-top-searches"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data } = await supabase.from("search_logs").select("query").order("created_at", { ascending: false }).limit(500);
      const counts = new Map<string, number>();
      (data ?? []).forEach((r) => {
        const k = r.query.toLowerCase().trim();
        counts.set(k, (counts.get(k) ?? 0) + 1);
      });
      return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([term, count]) => ({ term, count }));
    },
  });

  const { data: recentComplaints = [] } = useQuery({
    queryKey: ["admin-complaints"],
    enabled: !!user && isAdmin,
    queryFn: async () => (await supabase.from("complaints").select("id, tracking_number, title, category, status, created_at").order("created_at", { ascending: false }).limit(8)).data ?? [],
  });

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <ShieldAlert className="size-12 mx-auto text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">{t("admin_only")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have admin privileges.
        </p>
      </div>
    );
  }

  const cards = [
    { I: FileText, l: "Schemes", v: stats?.schemes },
    { I: Building2, l: "Services", v: stats?.services },
    { I: MapPin, l: "Offices", v: stats?.offices },
    { I: Users, l: "Users", v: stats?.users },
    { I: MessageSquareWarning, l: "Complaints", v: stats?.complaints },
    { I: TrendingUp, l: "Scheme views", v: stats?.views },
    { I: SearchIcon, l: "Searches", v: stats?.searches },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">{t("nav_admin")} Analytics</h1>
      <p className="text-muted-foreground mt-2">Overview of the JanSahayak platform.</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map(({ I, l, v }) => (
          <div key={l} className="gradient-card border border-border rounded-xl p-4 shadow-elegant">
            <div className="size-8 rounded-lg gradient-hero grid place-items-center text-primary-foreground"><I className="size-4" /></div>
            <div className="mt-3 text-2xl font-bold font-display">{v ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-6">
        <div className="gradient-card border border-border rounded-2xl p-6">
          <h2 className="font-bold flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Most viewed schemes</h2>
          <div className="mt-4 h-64">
            {topSchemes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSchemes} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={150} />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-sm text-muted-foreground">No views yet.</div>}
          </div>
        </div>

        <div className="gradient-card border border-border rounded-2xl p-6">
          <h2 className="font-bold flex items-center gap-2"><SearchIcon className="size-4 text-primary" /> Top search queries</h2>
          <ul className="mt-4 space-y-2 max-h-64 overflow-auto">
            {topSearches.map((s) => (
              <li key={s.term} className="flex items-center justify-between text-sm border-b border-border pb-2">
                <span className="truncate">{s.term}</span>
                <span className="text-muted-foreground font-mono text-xs">{s.count}</span>
              </li>
            ))}
            {topSearches.length === 0 && <li className="text-sm text-muted-foreground">No searches yet.</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6 gradient-card border border-border rounded-2xl p-6">
        <h2 className="font-bold flex items-center gap-2"><MessageSquareWarning className="size-4 text-primary" /> Recent complaints</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="text-left text-xs text-muted-foreground border-b border-border">
              <tr><th className="pb-2">Tracking</th><th className="pb-2">Title</th><th className="pb-2">Category</th><th className="pb-2">Status</th><th className="pb-2">Date</th></tr>
            </thead>
            <tbody>
              {recentComplaints.map((c: any) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 font-mono text-xs">{c.tracking_number}</td>
                  <td className="py-2">{c.title}</td>
                  <td className="py-2 text-muted-foreground">{c.category}</td>
                  <td className="py-2"><span className="text-xs px-2 py-0.5 rounded bg-secondary">{c.status}</span></td>
                  <td className="py-2 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentComplaints.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No complaints yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <Link to="/complaints" className="mt-4 inline-block text-sm text-primary font-medium">View all complaints →</Link>
      </div>
    </div>
  );
}
