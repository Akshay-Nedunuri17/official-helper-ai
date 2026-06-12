import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Mic, Heart, ExternalLink, FileText, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { downloadChecklistPDF } from "@/lib/pdf";

export const Route = createFileRoute("/schemes")({ component: Schemes });

function Schemes() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("all");
  const [active, setActive] = useState<string | null>(null);
  const recRef = useRef<any>(null);

  const { data: schemes = [] } = useQuery({
    queryKey: ["schemes"],
    queryFn: async () => (await supabase.from("schemes").select("*").order("name_en")).data ?? [],
  });

  const { data: favIds = [] } = useQuery({
    queryKey: ["favs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("favorites").select("scheme_id").eq("user_id", user!.id);
      return (data ?? []).map((f) => f.scheme_id);
    },
  });

  const toggleFav = useMutation({
    mutationFn: async (schemeId: string) => {
      if (!user) throw new Error("Please sign in to save");
      const isFav = favIds.includes(schemeId);
      if (isFav) {
        await supabase.from("favorites").delete().eq("user_id", user.id).eq("scheme_id", schemeId);
      } else {
        await supabase.from("favorites").insert({ user_id: user.id, scheme_id: schemeId });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["favs"] }),
    onError: (e: any) => toast.error(e.message),
  });

  const categories = useMemo(() => Array.from(new Set(schemes.map((s) => s.category))), [schemes]);

  const filtered = schemes.filter((s) => {
    if (cat !== "all" && s.category !== cat) return false;
    if (!q) return true;
    const hay = `${s.name_en} ${s.name_te ?? ""} ${s.description_en} ${s.category} ${(s.documents ?? []).join(" ")}`.toLowerCase();
    return hay.includes(q.toLowerCase());
  });

  const startVoice = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { toast.error("Voice search not supported in this browser"); return; }
    const r = new SR();
    r.lang = lang === "te" ? "te-IN" : "en-IN";
    r.interimResults = false;
    r.onresult = (e: any) => setQ(e.results[0][0].transcript);
    r.onerror = () => toast.error("Voice recognition failed");
    r.start();
    recRef.current = r;
  };

  const sel = schemes.find((s) => s.id === active);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold">{t("nav_schemes")}</h1>
        <p className="text-muted-foreground mt-2">{lang === "en" ? "Search verified Indian government schemes." : "ధృవీకరించబడిన భారత ప్రభుత్వ పథకాలను శోధించండి."}</p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} className="pl-10 h-12" />
        </div>
        <Button variant="outline" onClick={startVoice} className="gap-2 h-12">
          <Mic className="size-4" /> {t("voice_search")}
        </Button>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge variant={cat === "all" ? "default" : "outline"} className="cursor-pointer" onClick={() => setCat("all")}>{t("all")}</Badge>
        {categories.map((c) => (
          <Badge key={c} variant={cat === c ? "default" : "outline"} className="cursor-pointer" onClick={() => setCat(c)}>{c}</Badge>
        ))}
      </div>

      <div className="mt-8 grid lg:grid-cols-2 gap-4">
        {filtered.map((s) => {
          const isFav = favIds.includes(s.id);
          return (
            <div key={s.id} className="gradient-card rounded-xl border border-border p-5 hover:shadow-elegant transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-saffron uppercase tracking-wide">{s.category}</div>
                  <h3 className="mt-1 font-bold text-lg leading-tight">{lang === "te" && s.name_te ? s.name_te : s.name_en}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggleFav.mutate(s.id)} className="shrink-0">
                  <Heart className={`size-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {lang === "te" && s.description_te ? s.description_te : s.description_en}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setActive(s.id)}>Details</Button>
                {s.apply_url && (
                  <a href={s.apply_url} target="_blank" rel="noreferrer">
                    <Button size="sm" className="gap-1.5">{t("apply_now")} <ExternalLink className="size-3" /></Button>
                  </a>
                )}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 text-muted-foreground">No matches.</div>
        )}
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setActive(null)}>
          <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-semibold text-saffron uppercase">{sel.category} • {sel.ministry}</div>
            <h2 className="mt-2 text-2xl font-bold">{lang === "te" && sel.name_te ? sel.name_te : sel.name_en}</h2>
            <p className="mt-3 text-muted-foreground">{lang === "te" && sel.description_te ? sel.description_te : sel.description_en}</p>

            <Section title={t("eligibility")}>{lang === "te" && sel.eligibility_te ? sel.eligibility_te : sel.eligibility_en}</Section>
            <Section title={t("benefits")}>{lang === "te" && sel.benefits_te ? sel.benefits_te : sel.benefits_en}</Section>

            <h3 className="mt-6 font-semibold flex items-center gap-2"><FileText className="size-4" /> {t("required_docs")}</h3>
            <ul className="mt-2 grid sm:grid-cols-2 gap-1.5 text-sm">
              {sel.documents.map((d) => <li key={d} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> {d}</li>)}
            </ul>

            <div className="mt-6 flex gap-3">
              {sel.apply_url && (
                <a href={sel.apply_url} target="_blank" rel="noreferrer" className="flex-1">
                  <Button className="w-full gradient-hero text-primary-foreground border-0">{t("apply_now")}</Button>
                </a>
              )}
              <Button variant="outline" onClick={() => setActive(null)}>Close</Button>
            </div>
          </div>
        </div>
      )}

      {!user && (
        <p className="mt-8 text-center text-xs text-muted-foreground">
          <Link to="/auth" className="text-primary font-medium">Sign in</Link> to save favorites.
        </p>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  if (!children) return null;
  return (
    <div className="mt-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{children}</p>
    </div>
  );
}
