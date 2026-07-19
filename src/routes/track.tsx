import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Search, CheckCircle2, Clock, AlertCircle, Loader2, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/track")({ component: Track });

type StatusRow = {
  tracking_number: string;
  category: string;
  title: string;
  status: string;
  admin_response: string | null;
  created_at: string;
  updated_at: string;
};

function statusIcon(s: string) {
  if (s === "resolved") return <CheckCircle2 className="size-4 text-emerald-500" />;
  if (s === "in_progress") return <Loader2 className="size-4 text-blue-500" />;
  if (s === "rejected") return <AlertCircle className="size-4 text-destructive" />;
  return <Clock className="size-4 text-amber-500" />;
}

function Track() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<StatusRow | null>(null);
  const [notFound, setNotFound] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    const t = q.trim();
    if (!t) return;
    setLoading(true);
    setResult(null);
    setNotFound(false);
    try {
      const { data, error } = await supabase.rpc("get_complaint_status", { _tracking: t });
      if (error) throw error;
      const row = Array.isArray(data) ? data[0] : data;
      if (!row) setNotFound(true);
      else setResult(row as StatusRow);
    } catch (e: any) {
      toast.error(e.message ?? "Lookup failed");
    } finally { setLoading(false); }
  };

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <div className="text-center mb-8">
        <div className="inline-flex size-14 rounded-2xl gradient-hero items-center justify-center text-primary-foreground shadow-glow">
          <Hash className="size-7" />
        </div>
        <h1 className="mt-4 text-3xl font-bold">Track your complaint</h1>
        <p className="text-muted-foreground mt-1">Enter your JS-XXXXXXXX tracking number to check the current status. No login required.</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value.toUpperCase())}
          placeholder="JS-A1B2C3D4"
          className="uppercase tracking-wider"
          maxLength={20}
        />
        <Button type="submit" disabled={loading} className="gradient-hero text-primary-foreground border-0 gap-2">
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Track
        </Button>
      </form>

      {notFound && (
        <div className="mt-6 rounded-xl border border-border bg-muted/30 p-6 text-center text-sm text-muted-foreground">
          No complaint found for <strong className="text-foreground">{q}</strong>. Double-check the tracking number.
        </div>
      )}

      {result && (
        <div className="mt-6 gradient-card rounded-2xl border border-border p-6 shadow-elegant">
          <div className="flex items-center justify-between gap-2">
            <div className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">{result.category}</div>
            <Badge variant="outline" className="gap-1.5 capitalize">{statusIcon(result.status)} {result.status.replace("_", " ")}</Badge>
          </div>
          <h2 className="mt-2 text-xl font-bold">{result.title}</h2>
          <div className="mt-1 text-xs text-muted-foreground">
            Tracking: <span className="font-mono">{result.tracking_number}</span>
          </div>

          {result.admin_response && (
            <div className="mt-4 rounded-lg border border-primary/30 bg-primary/5 p-4">
              <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Official response</div>
              <p className="text-sm">{result.admin_response}</p>
            </div>
          )}

          <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-muted-foreground border-t border-border pt-3">
            <div>Filed <div className="text-foreground">{new Date(result.created_at).toLocaleDateString()}</div></div>
            <div>Last updated <div className="text-foreground">{new Date(result.updated_at).toLocaleDateString()}</div></div>
          </div>
        </div>
      )}
    </div>
  );
}
