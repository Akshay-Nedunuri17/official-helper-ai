import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, ExternalLink, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/updates")({ component: Updates });

function Updates() {
  const { lang } = useI18n();

  const { data: trending = [] } = useQuery({
    queryKey: ["trending"],
    queryFn: async () => (await supabase.from("schemes").select("*").eq("is_trending", true).order("updated_at", { ascending: false })).data ?? [],
  });

  const { data: latest = [] } = useQuery({
    queryKey: ["latest"],
    queryFn: async () => (await supabase.from("schemes").select("*").order("created_at", { ascending: false }).limit(12)).data ?? [],
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold"><Sparkles className="size-3.5" /> {lang === "en" ? "Government Updates" : "ప్రభుత్వ నవీకరణలు"}</div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold">{lang === "en" ? "What's new & trending" : "కొత్తవి మరియు ట్రెండింగ్"}</h1>
        <p className="mt-2 text-muted-foreground">{lang === "en" ? "Stay informed on the latest schemes and most popular updates from across India." : "భారతదేశం అంతటా తాజా పథకాలు మరియు అత్యంత ప్రసిద్ధ నవీకరణలపై తెలుసుకోండి."}</p>
      </div>

      <section className="mt-10">
        <h2 className="flex items-center gap-2 text-xl font-bold"><TrendingUp className="size-5 text-saffron" /> {lang === "en" ? "Trending now" : "ఇప్పుడు ట్రెండింగ్"}</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trending.map((s) => <UpdateCard key={s.id} s={s} highlight />)}
          {trending.length === 0 && <div className="text-sm text-muted-foreground col-span-full">No trending schemes yet.</div>}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="text-xl font-bold">{lang === "en" ? "Recently added" : "ఇటీవల జోడించబడింది"}</h2>
        <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {latest.map((s) => <UpdateCard key={s.id} s={s} />)}
        </div>
      </section>
    </div>
  );
}

function UpdateCard({ s, highlight }: { s: any; highlight?: boolean }) {
  const { lang } = useI18n();
  return (
    <div className={`gradient-card rounded-xl border p-5 hover:shadow-elegant transition-all ${highlight ? "border-saffron/40" : "border-border"}`}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">{s.category}</Badge>
        {highlight && <Badge className="text-xs bg-saffron text-white">Trending</Badge>}
      </div>
      <h3 className="mt-3 font-bold leading-tight">{lang === "te" && s.name_te ? s.name_te : s.name_en}</h3>
      <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{lang === "te" && s.description_te ? s.description_te : s.description_en}</p>
      <div className="mt-3 flex gap-2">
        <Link to="/schemes"><Button size="sm" variant="outline">Details</Button></Link>
        {s.apply_url && <a href={s.apply_url} target="_blank" rel="noreferrer"><Button size="sm" className="gap-1">Apply <ExternalLink className="size-3" /></Button></a>}
      </div>
    </div>
  );
}
