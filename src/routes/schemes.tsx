import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, Mic, Heart, ExternalLink, FileText, Download, SlidersHorizontal, X, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { downloadChecklistPDF } from "@/lib/pdf";

export const Route = createFileRoute("/schemes")({ component: Schemes });

const GENDERS = ["All", "Female", "Male"];
const OCCUPATIONS = ["Any", "Farmer", "Student", "Salaried", "Self-employed", "Unorganised worker", "Entrepreneur", "Artisan", "Fisherman", "Street vendor", "Pregnant women", "Working women", "Apprentice"];
const CASTES = ["Any", "General", "OBC", "SC", "ST", "EWS"];
const INCOME_BANDS = [
  { label: "Any", value: "any" },
  { label: "Below ₹1L/yr", value: "100000" },
  { label: "Below ₹2.5L/yr", value: "250000" },
  { label: "Below ₹5L/yr", value: "500000" },
  { label: "Below ₹8L/yr", value: "800000" },
];

function Schemes() {
  const { t, lang } = useI18n();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [cat, setCat] = useState("all");
  const [state, setState] = useState("all");
  const [district, setDistrict] = useState("");
  const [gender, setGender] = useState("All");
  const [occupation, setOccupation] = useState("Any");
  const [age, setAge] = useState<string>("");
  const [income, setIncome] = useState("any");
  const [caste, setCaste] = useState("Any");
  const [minorityOnly, setMinorityOnly] = useState(false);
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

  const categories = useMemo(() => Array.from(new Set(schemes.map((s) => s.category))).sort(), [schemes]);
  const states = useMemo(() => Array.from(new Set(schemes.map((s) => s.state ?? "All India"))).sort((a, b) => {
    if (a === "All India") return -1;
    if (b === "All India") return 1;
    return a.localeCompare(b);
  }), [schemes]);

  const filtered = useMemo(() => {
    const ageNum = age ? parseInt(age, 10) : null;
    const incomeNum = income !== "any" ? parseInt(income, 10) : null;

    const scored = schemes
      .filter((s: any) => {
        if (cat !== "all" && s.category !== cat) return false;
        if (state !== "all" && s.state !== state && s.state !== "All India") return false;
        if (gender !== "All" && s.gender && s.gender !== "All" && s.gender !== gender) return false;
        if (occupation !== "Any" && s.occupation && s.occupation !== occupation && !s.occupation.toLowerCase().includes(occupation.toLowerCase())) return false;
        if (minorityOnly && !s.minority_only) return false;
        if (ageNum != null) {
          if (s.min_age != null && ageNum < s.min_age) return false;
          if (s.max_age != null && ageNum > s.max_age) return false;
        }
        if (incomeNum != null && s.income_limit != null && incomeNum > s.income_limit) return false;
        if (caste !== "Any" && s.caste_categories?.length && !s.caste_categories.includes(caste)) return false;
        if (district && s.district && !s.district.toLowerCase().includes(district.toLowerCase())) return false;
        if (!q) return true;
        const hay = `${s.name_en} ${s.name_te ?? ""} ${s.description_en} ${s.category} ${s.state ?? ""} ${(s.documents ?? []).join(" ")}`.toLowerCase();
        return hay.includes(q.toLowerCase());
      })
      .map((s: any) => {
        // Rank: state match > central > others
        let score = 0;
        if (state !== "all" && s.state === state) score += 100;
        else if (s.state === "All India") score += 50;
        if (district && s.district?.toLowerCase().includes(district.toLowerCase())) score += 30;
        if (s.is_trending) score += 10;
        return { s, score };
      })
      .sort((a, b) => b.score - a.score)
      .map((x) => x.s);

    return scored;
  }, [schemes, q, cat, state, district, gender, occupation, age, income, caste, minorityOnly]);

  // Log search queries (debounced)
  useEffect(() => {
    const term = q.trim();
    if (term.length < 3) return;
    const t = setTimeout(() => {
      supabase.from("search_logs").insert({ query: term.slice(0, 100), user_id: user?.id ?? null, results_count: filtered.length });
    }, 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  useEffect(() => {
    if (!active) return;
    supabase.from("scheme_views").insert({ scheme_id: active, user_id: user?.id ?? null });
  }, [active, user?.id]);

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

  const clearFilters = () => {
    setCat("all"); setState("all"); setDistrict(""); setGender("All");
    setOccupation("Any"); setAge(""); setIncome("any"); setCaste("Any"); setMinorityOnly(false);
  };

  const activeFilterCount = [
    cat !== "all", state !== "all", !!district, gender !== "All",
    occupation !== "Any", !!age, income !== "any", caste !== "Any", minorityOnly,
  ].filter(Boolean).length;

  const sel = schemes.find((s) => s.id === active) as any;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-4xl">
        <h1 className="text-3xl sm:text-4xl font-bold">{t("nav_schemes")}</h1>
        <p className="text-muted-foreground mt-2">
          {lang === "en"
            ? `Search ${schemes.length}+ verified central & state government schemes across India.`
            : `భారతదేశంలోని ${schemes.length}+ ధృవీకరించబడిన కేంద్ర & రాష్ట్ర ప్రభుత్వ పథకాలను శోధించండి.`}
        </p>
      </div>

      <div className="mt-8 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} className="pl-10 h-12" />
        </div>
        <Button variant="outline" onClick={startVoice} className="gap-2 h-12">
          <Mic className="size-4" /> {t("voice_search")}
        </Button>
        <Button variant={showFilters ? "default" : "outline"} onClick={() => setShowFilters((v) => !v)} className="gap-2 h-12">
          <SlidersHorizontal className="size-4" /> Filters
          {activeFilterCount > 0 && <Badge variant="secondary" className="ml-1">{activeFilterCount}</Badge>}
        </Button>
      </div>

      {showFilters && (
        <div className="mt-4 p-5 rounded-xl border border-border bg-card grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <FilterField label="State / UT">
            <Select value={state} onValueChange={setState}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All States</SelectItem>
                {states.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="District (keyword)">
            <Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g. Visakhapatnam" />
          </FilterField>
          <FilterField label="Category">
            <Select value={cat} onValueChange={setCat}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Gender">
            <Select value={gender} onValueChange={setGender}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{GENDERS.map((g) => <SelectItem key={g} value={g}>{g}</SelectItem>)}</SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Age">
            <Input type="number" min={0} max={120} value={age} onChange={(e) => setAge(e.target.value)} placeholder="e.g. 35" />
          </FilterField>
          <FilterField label="Annual Income">
            <Select value={income} onValueChange={setIncome}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{INCOME_BANDS.map((i) => <SelectItem key={i.value} value={i.value}>{i.label}</SelectItem>)}</SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Occupation">
            <Select value={occupation} onValueChange={setOccupation}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent className="max-h-72">{OCCUPATIONS.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
            </Select>
          </FilterField>
          <FilterField label="Caste Category">
            <Select value={caste} onValueChange={setCaste}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{CASTES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </FilterField>
          <label className="flex items-center gap-2 px-3 rounded-md border border-border cursor-pointer hover:bg-accent">
            <input type="checkbox" checked={minorityOnly} onChange={(e) => setMinorityOnly(e.target.checked)} className="size-4" />
            <span className="text-sm">Minority schemes only</span>
          </label>
          {activeFilterCount > 0 && (
            <Button variant="ghost" onClick={clearFilters} className="gap-2 justify-start text-muted-foreground">
              <X className="size-4" /> Clear all filters
            </Button>
          )}
        </div>
      )}

      <p className="mt-4 text-sm text-muted-foreground">
        Showing <span className="font-semibold text-foreground">{filtered.length}</span> of {schemes.length} schemes
        {state !== "all" && <> · prioritising <span className="font-medium text-foreground">{state}</span></>}
      </p>

      <div className="mt-4 grid lg:grid-cols-2 gap-4">
        {filtered.map((s: any) => {
          const isFav = favIds.includes(s.id);
          return (
            <div key={s.id} className="gradient-card rounded-xl border border-border p-5 hover:shadow-elegant transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-semibold text-saffron uppercase tracking-wide">{s.category}</span>
                    {s.state && s.state !== "All India" && (
                      <span className="inline-flex items-center gap-1 text-muted-foreground"><MapPin className="size-3" />{s.state}</span>
                    )}
                    {s.state === "All India" && <Badge variant="outline" className="text-[10px]">Central</Badge>}
                  </div>
                  <h3 className="mt-1 font-bold text-lg leading-tight">{lang === "te" && s.name_te ? s.name_te : s.name_en}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={() => toggleFav.mutate(s.id)} className="shrink-0">
                  <Heart className={`size-4 ${isFav ? "fill-destructive text-destructive" : ""}`} />
                </Button>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                {lang === "te" && s.description_te ? s.description_te : s.description_en}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setActive(s.id)}>Details</Button>
                <Button size="sm" variant="ghost" onClick={() => downloadChecklistPDF(s)} className="gap-1.5" aria-label="Download PDF checklist">
                  <Download className="size-3" /> PDF
                </Button>
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
          <div className="col-span-full text-center py-16 text-muted-foreground">
            No matches. Try clearing some filters.
          </div>
        )}
      </div>

      {sel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm grid place-items-center p-4" onClick={() => setActive(null)}>
          <div className="bg-card rounded-2xl border border-border max-w-2xl w-full max-h-[85vh] overflow-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="text-xs font-semibold text-saffron uppercase">{sel.category} • {sel.ministry}</div>
            <h2 className="mt-2 text-2xl font-bold">{lang === "te" && sel.name_te ? sel.name_te : sel.name_en}</h2>
            <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
              {sel.state && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{sel.state}</span>}
              {sel.last_updated && <span className="inline-flex items-center gap-1"><Calendar className="size-3" />Updated {new Date(sel.last_updated).toLocaleDateString()}</span>}
            </div>
            <p className="mt-3 text-muted-foreground">{lang === "te" && sel.description_te ? sel.description_te : sel.description_en}</p>

            <Section title={t("eligibility")}>{lang === "te" && sel.eligibility_te ? sel.eligibility_te : sel.eligibility_en}</Section>
            <Section title={t("benefits")}>{lang === "te" && sel.benefits_te ? sel.benefits_te : sel.benefits_en}</Section>

            <h3 className="mt-6 font-semibold flex items-center gap-2"><FileText className="size-4" /> {t("required_docs")}</h3>
            <ul className="mt-2 grid sm:grid-cols-2 gap-1.5 text-sm">
              {sel.documents.map((d: string) => <li key={d} className="flex items-center gap-2"><span className="size-1.5 rounded-full bg-primary" /> {d}</li>)}
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              {sel.apply_url && (
                <a href={sel.apply_url} target="_blank" rel="noreferrer" className="flex-1 min-w-[160px]">
                  <Button className="w-full gradient-hero text-primary-foreground border-0">{t("apply_now")}</Button>
                </a>
              )}
              {sel.official_url && sel.official_url !== sel.apply_url && (
                <a href={sel.official_url} target="_blank" rel="noreferrer">
                  <Button variant="outline" className="gap-2"><ExternalLink className="size-4" /> Official Page</Button>
                </a>
              )}
              <Button variant="outline" onClick={() => downloadChecklistPDF(sel)} className="gap-2">
                <Download className="size-4" /> PDF checklist
              </Button>
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

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted-foreground">{label}</label>
      {children}
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
