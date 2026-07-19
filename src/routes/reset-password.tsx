import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({ component: ResetPassword });

function ResetPassword() {
  const nav = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Supabase recovery links land here with a hash containing the session.
    // The client auto-parses the hash and fires PASSWORD_RECOVERY.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast.error("Password must be at least 6 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Password updated. You're signed in.");
      nav({ to: "/dashboard" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to update password");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <div className="text-center mb-8">
        <div className="inline-flex size-14 rounded-2xl gradient-hero items-center justify-center text-primary-foreground shadow-glow">
          <Sparkles className="size-7" />
        </div>
        <h1 className="mt-4 text-3xl font-bold">Set a new password</h1>
      </div>

      <div className="gradient-card rounded-2xl border border-border p-6 shadow-elegant">
        {!ready ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            Open this page from the password reset link in your email. If you already have, this will update automatically.
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label>New password</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required minLength={6} />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-hero text-primary-foreground border-0 gap-2">
              <KeyRound className="size-4" />
              {loading ? "Updating..." : "Update password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
