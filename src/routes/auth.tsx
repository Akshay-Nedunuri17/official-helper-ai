import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, MailWarning } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/auth")({ component: Auth });

function Auth() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [needsConfirm, setNeedsConfirm] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => { if (user) nav({ to: "/dashboard" }); }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setNeedsConfirm(false);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
        });
        if (error) throw error;
        if (data.user && !data.session) {
          setNeedsConfirm(true);
          toast.success("Account created! Please check your email to confirm.");
        } else {
          toast.success("Account created!");
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          const msg = (error.message || "").toLowerCase();
          const code = (error as any).code;
          if (code === "email_not_confirmed" || msg.includes("not confirmed") || msg.includes("confirm")) {
            setNeedsConfirm(true);
            throw new Error("Your email is not confirmed yet. Please check your inbox or resend the confirmation email.");
          }
          if (msg.includes("invalid login") || msg.includes("invalid credentials")) {
            // Could be wrong password OR unconfirmed email — surface both possibilities
            setNeedsConfirm(true);
            throw new Error("Invalid credentials. If you just signed up, your email may need to be confirmed first — use 'Resend confirmation email' below.");
          }
          throw error;
        }
        toast.success("Welcome back!");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Something went wrong");
    } finally { setLoading(false); }
  };

  const resendConfirmation = async () => {
    if (!email) { toast.error("Enter your email first"); return; }
    setResending(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email,
        options: { emailRedirectTo: window.location.origin },
      });
      if (error) throw error;
      toast.success(`Confirmation email sent to ${email}`);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to resend");
    } finally { setResending(false); }
  };

  const google = async () => {
    setLoading(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin + "/dashboard" });
    if (result.error) { toast.error(result.error.message); setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex size-14 rounded-2xl gradient-hero items-center justify-center text-primary-foreground shadow-glow">
          <Sparkles className="size-7" />
        </div>
        <h1 className="mt-4 text-3xl font-bold">{t("welcome")}</h1>
        <p className="text-muted-foreground mt-1">{t("appName")}</p>
      </div>

      <div className="gradient-card rounded-2xl border border-border p-6 shadow-elegant">
        <Tabs value={mode} onValueChange={(v) => { setMode(v as any); setNeedsConfirm(false); }}>
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="signin">{t("signin")}</TabsTrigger>
            <TabsTrigger value="signup">{t("signup")}</TabsTrigger>
          </TabsList>

          <Button onClick={google} disabled={loading} variant="outline" className="w-full mt-6 gap-2">
            <svg className="size-4" viewBox="0 0 24 24"><path fill="currentColor" d="M21.35 11.1H12v3.2h5.35c-.23 1.4-1.65 4.1-5.35 4.1-3.22 0-5.85-2.67-5.85-5.95s2.63-5.95 5.85-5.95c1.83 0 3.06.78 3.76 1.45l2.56-2.47C16.85 3.96 14.65 3 12 3 7.03 3 3 7.03 3 12s4.03 9 9 9c5.2 0 8.65-3.65 8.65-8.8 0-.59-.06-1.04-.15-1.5z"/></svg>
            {t("google")}
          </Button>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> OR <div className="h-px flex-1 bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <TabsContent value="signup" className="mt-0 space-y-4">
              <div>
                <Label>{t("fullname")}</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required={mode === "signup"} />
              </div>
            </TabsContent>
            <div>
              <Label>{t("email")}</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label>{t("password")}</Label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) return toast.error("Enter your email first");
                      const { error } = await supabase.auth.resetPasswordForEmail(email, {
                        redirectTo: `${window.location.origin}/reset-password`,
                      });
                      if (error) toast.error(error.message);
                      else toast.success(`Password reset link sent to ${email}`);
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>


            {needsConfirm && (
              <div role="alert" className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <MailWarning className="size-4 mt-0.5 text-amber-600 shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-900 dark:text-amber-200">Email confirmation required</p>
                    <p className="mt-1 text-amber-800/90 dark:text-amber-200/80">
                      Your account exists but the email address hasn't been verified yet. Check your inbox (and spam folder) for the confirmation link, or resend it below.
                    </p>
                    <Button
                      type="button"
                      onClick={resendConfirmation}
                      disabled={resending}
                      variant="outline"
                      size="sm"
                      className="mt-3"
                    >
                      {resending ? "Sending..." : "Resend confirmation email"}
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0">
              {mode === "signin" ? t("signin") : t("signup")}
            </Button>
          </form>
        </Tabs>
      </div>
    </div>
  );
}
