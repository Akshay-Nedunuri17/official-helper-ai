import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Sparkles, ShieldCheck, Languages, Search, ListChecks, TrendingUp,
  MessageSquareWarning, MapPin, FileText, PhoneCall, Hash,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  component: Home,
  head: () => ({
    meta: [
      { title: "JanSahayak — Find Indian government schemes in simple steps" },
      { name: "description", content: "Check which government schemes you qualify for, see the documents needed, find your nearest office, and track complaints — in 22 Indian languages." },
      { property: "og:title", content: "JanSahayak — Find Indian government schemes in simple steps" },
      { property: "og:description", content: "Check eligibility, get document checklists, locate offices and track complaints — free, bilingual and AI-guided." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
});

function Home() {
  const { t, lang } = useI18n();
  const te = lang === "te";

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

  const tasks = [
    { to: "/wizard", I: ListChecks, title: te ? "నేను దేనికి అర్హుడిని?" : "Am I eligible for anything?", d: te ? "6 సాధారణ ప్రశ్నలు — సరిపోలే పథకాలు చూడండి." : "Answer 6 simple questions and see matching schemes." },
    { to: "/schemes", I: Search, title: te ? "ఒక పథకం కోసం వెతకండి" : "Search for a scheme", d: te ? "రాష్ట్రం, వర్గం, ఆదాయం ద్వారా వడపోత." : "Filter by state, category, income and more." },
    { to: "/services", I: FileText, title: te ? "నాకు ఏ పత్రాలు కావాలి?" : "What documents do I need?", d: te ? "దరఖాస్తు విధానం మరియు చెక్‌లిస్ట్." : "Step-by-step procedure and printable checklists." },
    { to: "/offices", I: MapPin, title: te ? "సమీప కార్యాలయం కనుగొనండి" : "Find my nearest office", d: te ? "MeeSeva, CSC, RTO, ఆసుపత్రులు — మ్యాప్‌లో." : "MeeSeva, CSC, RTO, hospitals — on a map." },
    { to: "/complaints", I: MessageSquareWarning, title: te ? "ఫిర్యాదు చేయండి" : "Report a problem", d: te ? "ఫోటో మరియు లొకేషన్‌తో ఫిర్యాదు." : "File a complaint with a photo and location." },
    { to: "/helplines", I: PhoneCall, title: te ? "ఎవరికి కాల్ చేయాలి?" : "Who do I call?", d: te ? "అధికారిక టోల్-ఫ్రీ నంబర్లు." : "Official toll-free helpline numbers." },
  ];

  const steps = [
    { n: "1", title: te ? "మీ గురించి చెప్పండి" : "Tell us about you", d: te ? "వయస్సు, రాష్ట్రం, ఆదాయం వంటి కొన్ని వివరాలు." : "A few details like age, state and income." },
    { n: "2", title: te ? "మీ పథకాలను చూడండి" : "See your schemes", d: te ? "మీకు సరిపోయే పథకాలు మాత్రమే చూపిస్తాం." : "We show only the schemes you likely qualify for." },
    { n: "3", title: te ? "దరఖాస్తు చేయండి" : "Apply with confidence", d: te ? "పత్రాల జాబితా, కార్యాలయం మరియు అధికారిక లింక్." : "Document checklist, nearest office and official link." },
  ];

  return (
    <div>
      {/* HERO — plain language, one clear action */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-hero opacity-95" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.18),transparent_50%)]" />
        <div className="relative container mx-auto px-4 py-16 sm:py-24 text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur border border-white/20 text-xs font-medium">
            <Sparkles className="size-3.5" />
            {te ? "ఉచితం • 22 భాషలు • ప్రభుత్వ సమాచారం" : "Free • 22 Indian languages • Official information"}
          </div>
          <h1 className="mt-6 text-4xl sm:text-5xl lg:text-6xl font-display font-extrabold leading-[1.08] max-w-3xl">
            {te ? "మీకు అర్హత ఉన్న ప్రభుత్వ పథకాలను కనుగొనండి" : "Find the government help you are entitled to"}
          </h1>
          <p className="mt-5 text-lg max-w-2xl text-white/90">
            {te
              ? "పథకాలు, అవసరమైన పత్రాలు, సమీప కార్యాలయాలు మరియు దరఖాస్తు విధానం — సులభమైన భాషలో."
              : "Schemes, required documents, nearest offices and how to apply — explained in simple language."}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/wizard">
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 gap-2 font-semibold">
                <ListChecks className="size-4" /> {te ? "నేను దేనికి అర్హుడినో చూడండి" : "Check what I qualify for"}
              </Button>
            </Link>
            <Link to="/assistant">
              <Button size="lg" variant="outline" className="bg-white/10 text-white border-white/30 hover:bg-white/20 gap-2">
                <Sparkles className="size-4" /> {te ? "ప్రశ్న అడగండి" : "Ask a question"}
              </Button>
            </Link>
          </div>

          <dl className="mt-12 grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl">
            {[
              { n: stats?.schemes ?? "—", l: t("stats_schemes") },
              { n: stats?.services ?? "—", l: t("stats_services") },
              { n: stats?.offices ?? "—", l: t("stats_offices") },
            ].map((s, i) => (
              <div key={i} className="border-l-2 border-white/30 pl-3 sm:pl-4">
                <dt className="sr-only">{s.l}</dt>
                <dd className="text-3xl sm:text-4xl font-bold font-display">{s.n}</dd>
                <dd className="text-xs sm:text-sm text-white/75 mt-1">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* TASK CHOOSER — the main way in */}
      <section className="container mx-auto px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold">{te ? "మీకు ఏమి కావాలి?" : "What do you need help with?"}</h2>
        <p className="mt-2 text-muted-foreground">{te ? "మీ అవసరాన్ని ఎంచుకోండి — మిగతాది మేము చూసుకుంటాం." : "Pick your situation and we'll take it from there."}</p>
        <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((f) => (
            <Link
              key={f.to}
              to={f.to}
              className="group gradient-card rounded-2xl p-5 border border-border flex items-start gap-4 hover:shadow-elegant hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-all"
            >
              <div className="size-11 shrink-0 rounded-xl gradient-hero grid place-items-center text-primary-foreground">
                <f.I className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="font-bold leading-snug group-hover:text-primary transition-colors">{f.title}</div>
                <div className="text-sm text-muted-foreground mt-1">{f.d}</div>
                <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-primary">
                  {te ? "కొనసాగండి" : "Continue"} <ArrowRight className="size-3.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="border-y border-border bg-secondary/40">
        <div className="container mx-auto px-4 py-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-center">{te ? "ఇది ఎలా పనిచేస్తుంది" : "How it works"}</h2>
          <ol className="mt-10 grid md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <li key={s.n} className="rounded-2xl border border-border bg-card p-6">
                <div className="size-9 rounded-full gradient-hero grid place-items-center text-primary-foreground font-bold">{s.n}</div>
                <h3 className="mt-4 font-display font-bold text-lg">{s.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 text-center">
            <Link to="/wizard">
              <Button size="lg" className="gradient-hero text-primary-foreground border-0 gap-2">
                {te ? "ఇప్పుడే ప్రారంభించండి" : "Start now — it's free"} <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* WHY TRUST US */}
      <section className="container mx-auto px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-bold text-center">{t("why_title")}</h2>
        <div className="mt-10 grid md:grid-cols-3 gap-6">
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

      {/* FEATURED */}
      <section className="container mx-auto px-4 pb-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold">{te ? "ప్రసిద్ధ పథకాలు" : "Popular schemes"}</h2>
            <p className="text-sm text-muted-foreground mt-1">{te ? "చాలా మంది పౌరులు చూస్తున్నవి." : "Most looked-up schemes right now."}</p>
          </div>
          <Link to="/schemes" className="text-sm font-semibold text-primary inline-flex items-center gap-1 hover:gap-2 transition-all shrink-0">
            {te ? "అన్నీ చూడండి" : "View all"} <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featured?.map((s) => (
            <Link key={s.id} to="/schemes" className="group gradient-card rounded-xl p-5 border border-border hover:shadow-elegant hover:-translate-y-0.5 transition-all">
              <div className="text-xs font-semibold uppercase tracking-wide text-saffron">{s.category}</div>
              <h3 className="mt-2 font-bold text-lg group-hover:text-primary transition-colors">
                {te && s.name_te ? s.name_te : s.name_en}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {te && s.description_te ? s.description_te : s.description_en}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* HELP STRIP */}
      <section className="container mx-auto px-4 pb-20">
        <div className="rounded-2xl border border-border gradient-card p-6 sm:p-8 grid gap-4 sm:grid-cols-3 items-center">
          <div className="sm:col-span-2">
            <h2 className="text-xl font-bold">{te ? "సహాయం కావాలా?" : "Still not sure where to start?"}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {te ? "మీ భాషలో ప్రశ్న అడగండి, లేదా ఫిర్యాదు స్థితిని ట్రాక్ చేయండి." : "Ask our assistant in your own language, or track a complaint you already filed."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 sm:justify-end">
            <Link to="/assistant"><Button variant="default" className="gap-2"><Sparkles className="size-4" /> {te ? "అసిస్టెంట్" : "Assistant"}</Button></Link>
            <Link to="/track"><Button variant="outline" className="gap-2"><Hash className="size-4" /> {te ? "ట్రాక్" : "Track"}</Button></Link>
            <Link to="/updates"><Button variant="outline" className="gap-2"><TrendingUp className="size-4" /> {te ? "నవీకరణలు" : "Updates"}</Button></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
