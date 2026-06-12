import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Sparkles, ShieldCheck, Languages, Search, ListChecks, TrendingUp, MessageSquareWarning } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { t, lang } = useI18n();
  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: async () => {
      const [s, sv, o] = await Promise.all([
        supabase.from("schemes").select("id", { count: "exact", head: true }),
        supabase.from("services").select("id", { count: "exact", head: true }),
        supabase.from("offices").select("id", { count: "exact", head: true }),
      ]);
      return { schemes: s.count ?? 0, services: sv.count ?? 0, offices: o.count ?? 0 };
    },
  });

  const { data: featured } = useQuery({
    queryKey: ["featured-schemes"],
    queryFn: async () => {
      const { data } = await supabase.from("schemes").select("*").limit(6);
      return data ?? [];
    },
  });

  return (
    <div>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_50%)]" />
        <div className="relative container mx-auto px-4 py-20 sm:py-28 lg:py-36 text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-medium">
            <Sparkles className="size-3.5" />
            {lang === "en" ? "AI-powered • Bilingual" : "AI ఆధారిత • ద్విభాషా"}
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-7xl font-display font-extrabold leading-[1.05] max-w-4xl">
            {t("appName")}
          </h1>
          <p className="mt-5 text-lg sm:text-xl max-w-2xl text-white/85">{t("tagline")}</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/schemes">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 font-semibold">
                <Search className="size-4" /> {t("hero_cta_primary")}
              </Button>
            </Link>
            <Link to="/assistant">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 gap-2">
                <Sparkles className="size-4" /> {t("hero_cta_secondary")}
              </Button>
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl">
            {[
              { n: stats?.schemes ?? "—", l: t("stats_schemes") },
              { n: stats?.services ?? "—", l: t("stats_services") },
              { n: stats?.offices ?? "—", l: t("stats_offices") },
            ].map((s, i) => (
              <div key={i} className="border-l-2 border-white/30 pl-3 sm:pl-4">
                <div className="text-3xl sm:text-4xl font-bold font-display">{s.n}</div>
                <div className="text-xs sm:text-sm text-white/75 mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl sm:text-4xl font-bold text-center">{t("why_title")}</h2>
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          {[
            { I: Sparkles, t: t("why_1_t"), d: t("why_1_d") },
            { I: Languages, t: t("why_2_t"), d: t("why_2_d") },
            { I: ShieldCheck, t: t("why_3_t"), d: t("why_3_d") },
          ].map(({ I, t: title, d }, i) => (
            <div key={i} className="gradient-card rounded-2xl p-6 border border-border shadow-elegant">
              <div className="size-12 rounded-xl gradient-hero grid place-items-center text-primary-foreground shadow-glow">
                <I className="size-5" />
              </div>
              <h3 className="mt-5 font-display font-bold text-xl">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURE QUICK LINKS */}
      <section className="container mx-auto px-4 pt-4 pb-8">
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { to: "/wizard", I: ListChecks, t: lang === "en" ? "Eligibility Wizard" : "అర్హత విజార్డ్", d: lang === "en" ? "Answer 6 questions, get matched schemes." : "6 ప్రశ్నలకు సమాధానం ఇవ్వండి, సరిపోలే పథకాలు పొందండి." },
            { to: "/updates", I: TrendingUp, t: lang === "en" ? "Government Updates" : "ప్రభుత్వ నవీకరణలు", d: lang === "en" ? "Latest and trending schemes." : "తాజా మరియు ట్రెండింగ్ పథకాలు." },
            { to: "/complaints", I: MessageSquareWarning, t: lang === "en" ? "File a Complaint" : "ఫిర్యాదు చేయండి", d: lang === "en" ? "Report civic issues with photo + location." : "ఫోటోతో పౌర సమస్యలను నివేదించండి." },
          ].map((f) => (
            <Link key={f.to} to={f.to} className="group gradient-card rounded-xl p-5 border border-border flex items-start gap-3 hover:shadow-elegant hover:-translate-y-0.5 transition-all">
              <div className="size-10 shrink-0 rounded-lg gradient-hero grid place-items-center text-primary-foreground"><f.I className="size-5" /></div>
              <div className="min-w-0">
                <div className="font-bold group-hover:text-primary transition-colors">{f.t}</div>
                <div className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{f.d}</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* FEATURED */}
      <section className="container mx-auto px-4 pb-20">
        <div className="flex items-end justify-between mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold">{lang === "en" ? "Popular schemes" : "ప్రసిద్ధ పథకాలు"}</h2>
          <Link to="/schemes" className="text-sm font-medium text-primary inline-flex items-center gap-1 hover:gap-2 transition-all">
            {lang === "en" ? "View all" : "అన్నీ చూడండి"} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured?.map((s) => (
            <Link key={s.id} to="/schemes" className="group gradient-card rounded-xl p-5 border border-border hover:shadow-elegant hover:-translate-y-0.5 transition-all">
              <div className="text-xs font-semibold uppercase tracking-wide text-saffron">{s.category}</div>
              <h3 className="mt-2 font-bold text-lg group-hover:text-primary transition-colors">
                {lang === "te" && s.name_te ? s.name_te : s.name_en}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {lang === "te" && s.description_te ? s.description_te : s.description_en}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
