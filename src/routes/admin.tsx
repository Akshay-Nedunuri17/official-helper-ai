import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { ShieldAlert, Users, FileText, MapPin, Building2 } from "lucide-react";
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
      const [s, sv, o, p] = await Promise.all([
        supabase.from("schemes").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("offices").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
      ]);
      return { schemes: s.count ?? 0, services: sv.count ?? 0, offices: o.count ?? 0, users: p.count ?? 0 };
    },
  });

  if (loading) return null;

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <ShieldAlert className="size-12 mx-auto text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">{t("admin_only")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have admin privileges. To grant admin: run an insert into <code className="bg-secondary px-1 rounded">user_roles</code> from the backend with your user id and role 'admin'.
        </p>
      </div>
    );
  }

  const cards = [
    { I: FileText, l: "Schemes", v: stats?.schemes },
    { I: Building2, l: "Services", v: stats?.services },
    { I: MapPin, l: "Offices", v: stats?.offices },
    { I: Users, l: "Users", v: stats?.users },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">{t("nav_admin")}</h1>
      <p className="text-muted-foreground mt-2">Overview of the JanSahayak platform.</p>

      <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map(({ I, l, v }) => (
          <div key={l} className="gradient-card border border-border rounded-2xl p-6 shadow-elegant">
            <div className="size-10 rounded-lg gradient-hero grid place-items-center text-primary-foreground"><I className="size-5" /></div>
            <div className="mt-4 text-3xl font-bold font-display">{v ?? "—"}</div>
            <div className="text-sm text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 gradient-card border border-border rounded-2xl p-6">
        <h2 className="font-bold text-lg">Manage content</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Use the backend dashboard to add or edit schemes, services, and offices. Row-level security is enforced — only admins can write.
        </p>
      </div>
    </div>
  );
}
