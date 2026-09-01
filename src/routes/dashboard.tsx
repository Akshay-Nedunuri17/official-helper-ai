import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Heart, User as UserIcon, Sparkles, MailCheck, MailWarning, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";
import { ProfileEditor } from "@/components/ProfileEditor";
import { NotificationPreferences } from "@/components/NotificationPreferences";
import { ComplaintTimeline } from "@/components/ComplaintTimeline";
import { ComplaintHandoff } from "@/components/ComplaintHandoff";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "My Dashboard | JanSahayak" },
      { name: "description", content: "View saved schemes, complaint status, notifications and your citizen profile in one place." },
      { property: "og:title", content: "Your JanSahayak Dashboard" },
      { property: "og:description", content: "Saved schemes, complaint tracking, notifications and profile in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function Dashboard() {
  const { t, lang } = useI18n();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data: favs = [] } = useQuery({
    queryKey: ["dashboard-favs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("scheme_id, schemes(*)").eq("user_id", user!.id);
      return data ?? [];
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle()).data,
  });

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex items-center gap-4">
        <div className="size-14 rounded-2xl gradient-hero grid place-items-center text-primary-foreground shadow-glow">
          <UserIcon className="size-7" />
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{t("welcome")}, {profile?.full_name ?? user.email}</h1>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>
      </div>

      <EmailVerificationBanner user={user} />

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <ProfileEditor userId={user.id} />
        <NotificationPreferences userId={user.id} />
      </div>

      <ComplaintsTimelineSection userId={user.id} email={user.email} state={profile?.state} />

      <div className="mt-10">
        <h2 className="text-xl font-bold flex items-center gap-2"><Heart className="size-5 text-destructive" /> {t("favorites")}</h2>
        {favs.length === 0 ? (
          <div className="mt-4 gradient-card border border-border rounded-2xl p-10 text-center">
            <Sparkles className="size-8 mx-auto text-muted-foreground" />
            <p className="mt-3 text-muted-foreground">{t("no_favorites")}</p>
            <Link to="/schemes"><Button className="mt-5 gradient-hero text-primary-foreground border-0">{t("explore")}</Button></Link>
          </div>
        ) : (
          <div className="mt-4 grid md:grid-cols-2 gap-3">
            {favs.map((f: any) => f.schemes && (
              <Link key={f.scheme_id} to="/schemes" className="gradient-card rounded-xl border border-border p-4 hover:shadow-elegant transition-all">
                <div className="text-xs text-saffron font-semibold uppercase">{f.schemes.category}</div>
                <div className="mt-1 font-semibold">{lang === "te" && f.schemes.name_te ? f.schemes.name_te : f.schemes.name_en}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EmailVerificationBanner({ user }: { user: any }) {
  const isConfirmed = !!(user.email_confirmed_at || user.confirmed_at);
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: user.email,
        options: { emailRedirectTo: window.location.origin + "/dashboard" },
      });
      if (error) throw error;
      toast.success(`Confirmation email sent to ${user.email}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to resend");
    } finally {
      setSending(false);
    }
  };

  if (isConfirmed) {
    return (
      <div className="mt-6 flex items-center gap-2 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
        <MailCheck className="size-4" />
        <span>Email verified</span>
      </div>
    );
  }

  return (
    <div role="alert" className="mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm">
      <div className="flex items-start gap-3">
        <MailWarning className="size-5 mt-0.5 text-amber-600 shrink-0" />
        <div className="flex-1">
          <p className="font-semibold text-amber-900 dark:text-amber-200">Email not verified</p>
          <p className="mt-1 text-amber-800/90 dark:text-amber-200/80">
            We sent a confirmation link to <strong>{user.email}</strong>. Please verify your email to secure your account and unlock all features.
          </p>
          <Button onClick={resend} disabled={sending} variant="outline" size="sm" className="mt-3">
            {sending ? "Sending..." : "Resend verification email"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ComplaintsTimelineSection({ userId, email, state }: { userId: string; email?: string | null; state?: string | null }) {
  const { data: complaints = [] } = useQuery({
    queryKey: ["dashboard-complaints", userId],
    queryFn: async () =>
      (await supabase.from("complaints").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(5)).data ?? [],
  });

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold flex items-center gap-2">
        <ListChecks className="size-5 text-primary" /> My complaints
      </h2>
      <p className="text-sm text-muted-foreground mt-1">
        Every step is recorded — saved in JanSahayak, department identified, forwarded by email, and submitted to the
        official government portal.
      </p>

      {complaints.length === 0 ? (
        <div className="mt-4 gradient-card border border-border rounded-2xl p-8 text-center">
          <p className="text-muted-foreground">You haven't filed any complaints yet.</p>
          <Link to="/complaints"><Button className="mt-4 gradient-hero text-primary-foreground border-0">File a complaint</Button></Link>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          {complaints.map((c: any) => (
            <div key={c.id} className="gradient-card border border-border rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-mono text-muted-foreground">{c.tracking_number}</div>
                  <h3 className="font-bold">{c.title}</h3>
                </div>
                <span className="text-xs px-2 py-1 rounded bg-secondary capitalize">{c.status.replace("_", " ")}</span>
              </div>
              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <ComplaintTimeline complaintId={c.id} />
                <ComplaintHandoff complaint={c} officeState={state} citizenEmail={email} />
              </div>
            </div>
          ))}
          <Link to="/complaints" className="inline-block text-sm text-primary font-medium">View all complaints →</Link>
        </div>
      )}
    </div>
  );
}
