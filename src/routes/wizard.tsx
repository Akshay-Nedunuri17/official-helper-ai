import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, ArrowLeft, Sparkles, ExternalLink, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/wizard")({ component: Wizard });

const STATES = ["All India", "Andhra Pradesh", "Telangana", "Tamil Nadu", "Karnataka", "Kerala", "Maharashtra", "Uttar Pradesh", "Bihar", "West Bengal", "Gujarat", "Rajasthan", "Madhya Pradesh", "Other"];
const OCCS = ["Farmer", "Student", "Entrepreneur", "Unemployed", "Salaried", "Self-employed", "Retired", "Homemaker"];
const INCOMES = ["Below ₹1L", "₹1L–₹2.5L", "₹2.5L–₹5L", "₹5L–₹8L", "Above ₹8L"];
const CATEGORIES = ["General", "OBC", "SC", "ST", "Minority"];

type Answers = {
  age: number;
  gender: string;
  state: string;
  occupation: string;
  income: string;
  category: string;
};

function score(s: any, a: Answers): number {
  let n = 0;
  const hay = `${s.eligibility_en ?? ""} ${s.description_en ?? ""} ${s.category}`.toLowerCase();
  if (s.state === a.state) n += 5;
  if (s.state === "All India") n += 1;
  if (a.occupation === "Farmer" && /farm|kisan|agri|crop/.test(hay)) n += 4;
  if (a.occupation === "Student" && /student|scholar|educ/.test(hay)) n += 4;
  if (a.occupation === "Entrepreneur" && /mudra|startup|business|msme|entrepre/.test(hay)) n += 4;
  if (a.occupation === "Unemployed" && /employ|skill|train|rojgar/.test(hay)) n += 3;
  if (a.gender === "Female" && /women|mahila|girl|female/.test(hay)) n += 3;
  if (a.age < 25 && /youth|young|student/.test(hay)) n += 2;
  if (a.age >= 60 && /senior|elder|pension|vaya/.test(hay)) n += 4;
  if (/^(Below ₹1L|₹1L–₹2\.5L)$/.test(a.income) && /bpl|poverty|below|low.income|antyodaya/.test(hay)) n += 3;
  if (a.category !== "General" && /(sc|st|obc|minority|reserv)/.test(hay)) n += 2;
  return n;
}

function Wizard() {
  const { lang } = useI18n();
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>({ age: 25, gender: "Male", state: "All India", occupation: "Farmer", income: "₹1L–₹2.5L", category: "General" });
  const [done, setDone] = useState(false);

  const { data: schemes = [] } = useQuery({
    queryKey: ["schemes-wiz"],
    queryFn: async () => (await supabase.from("schemes").select("*")).data ?? [],
  });

  const steps = [
    { label: lang === "en" ? "Your age" : "మీ వయస్సు", el: (
      <Input type="number" min={1} max={120} value={a.age} onChange={(e) => setA({ ...a, age: Number(e.target.value) })} className="h-12 text-lg" />
    )},
    { label: lang === "en" ? "Gender" : "లింగం", el: (
      <RadioGroup value={a.gender} onValueChange={(v) => setA({ ...a, gender: v })} className="grid grid-cols-3 gap-2">
        {["Male", "Female", "Other"].map((g) => (
          <Label key={g} className="border border-border rounded-lg p-4 cursor-pointer hover:border-primary flex items-center gap-2 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
            <RadioGroupItem value={g} /> {g}
          </Label>
        ))}
      </RadioGroup>
    )},
    { label: lang === "en" ? "State" : "రాష్ట్రం", el: (
      <Select value={a.state} onValueChange={(v) => setA({ ...a, state: v })}>
        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
        <SelectContent>{STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
    )},
    { label: lang === "en" ? "Occupation" : "వృత్తి", el: (
      <Select value={a.occupation} onValueChange={(v) => setA({ ...a, occupation: v })}>
        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
        <SelectContent>{OCCS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
    )},
    { label: lang === "en" ? "Annual income" : "వార్షిక ఆదాయం", el: (
      <Select value={a.income} onValueChange={(v) => setA({ ...a, income: v })}>
        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
        <SelectContent>{INCOMES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
    )},
    { label: lang === "en" ? "Category" : "వర్గం", el: (
      <Select value={a.category} onValueChange={(v) => setA({ ...a, category: v })}>
        <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
        <SelectContent>{CATEGORIES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
      </Select>
    )},
  ];

  const total = steps.length;

  if (done) {
    const matches = schemes.map((s) => ({ s, n: score(s, a) })).filter((x) => x.n > 0).sort((x, y) => y.n - x.n).slice(0, 8);
    return (
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl font-bold flex items-center gap-2"><Sparkles className="size-6 text-primary" /> {lang === "en" ? "Your matched schemes" : "మీకు సరిపోలే పథకాలు"}</h1>
          <Button variant="outline" onClick={() => { setDone(false); setStep(0); }} className="gap-2"><RotateCcw className="size-4" /> Restart</Button>
        </div>
        <p className="text-muted-foreground mt-2 text-sm">Based on your profile. Verify eligibility on the official portal.</p>
        <div className="mt-8 space-y-3">
          {matches.length === 0 && <div className="text-center py-12 text-muted-foreground">No matches. Try broader inputs.</div>}
          {matches.map(({ s, n }) => (
            <div key={s.id} className="gradient-card border border-border rounded-xl p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs text-saffron font-semibold uppercase">{s.category} • {s.state}</div>
                  <h3 className="mt-1 font-bold text-lg">{lang === "te" && s.name_te ? s.name_te : s.name_en}</h3>
                </div>
                <div className="text-xs px-2 py-1 rounded bg-primary/10 text-primary font-semibold">{n} match</div>
              </div>
              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{lang === "te" && s.description_te ? s.description_te : s.description_en}</p>
              <div className="mt-3 flex gap-2">
                <Link to="/schemes"><Button size="sm" variant="outline">View details</Button></Link>
                {s.apply_url && <a href={s.apply_url} target="_blank" rel="noreferrer"><Button size="sm" className="gap-1.5">Apply <ExternalLink className="size-3" /></Button></a>}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const cur = steps[step];
  return (
    <div className="container mx-auto px-4 py-10 max-w-xl">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-4 text-primary" /> {lang === "en" ? "Eligibility Wizard" : "అర్హత విజార్డ్"}
      </div>
      <Progress value={((step + 1) / total) * 100} className="mt-4" />
      <div className="mt-2 text-xs text-muted-foreground">Step {step + 1} of {total}</div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold">{cur.label}</h2>
        <div className="mt-6">{cur.el}</div>
      </div>

      <div className="mt-8 flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="gap-2"><ArrowLeft className="size-4" /> Back</Button>
        {step < total - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} className="gap-2 gradient-hero text-primary-foreground border-0">Next <ArrowRight className="size-4" /></Button>
        ) : (
          <Button onClick={() => setDone(true)} className="gap-2 gradient-hero text-primary-foreground border-0">Find schemes <Sparkles className="size-4" /></Button>
        )}
      </div>
    </div>
  );
}
