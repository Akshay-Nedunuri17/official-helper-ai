import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Heart, User as UserIcon, Sparkles, MailCheck, MailWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({ component: Dashboard });

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

      <div className="mt-8">
        <ProfileEditor userId={user.id} />
      </div>



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
