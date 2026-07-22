import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Phone, Search, Copy, Check, ShieldAlert, HeartPulse, Users, Baby, Flame, Landmark, Train, Wheat, GraduationCap, Scale, Wifi, Building2, ExternalLink } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/helplines")({
  component: Helplines,
  head: () => ({
    meta: [
      { title: "Government Toll-Free Helpline Numbers India | JanSahayak" },
      { name: "description", content: "Complete directory of official Indian government toll-free helpline numbers — Emergency 112, Women 1091, Child 1098, Ambulance 108, Cyber Crime 1930, Kisan, Railway, Aadhaar and more." },
      { property: "og:title", content: "Government Toll-Free Helpline Numbers India" },
      { property: "og:description", content: "One-stop directory of verified government helpline numbers across India — emergency, health, women & child, cyber crime, farmer, senior citizens, and more." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Line = { name: string; number: string; desc?: string; url?: string };
type Section = { key: string; title: string; icon: React.ComponentType<{ className?: string }>; color: string; lines: Line[] };

const SECTIONS: Section[] = [
  {
    key: "emergency", title: "Emergency & Safety", icon: ShieldAlert, color: "text-red-600 bg-red-500/10",
    lines: [
      { name: "National Emergency (All-in-one)", number: "112", desc: "Police, Fire, Ambulance, Disaster — single national number" },
      { name: "Police", number: "100" },
      { name: "Fire", number: "101" },
      { name: "Ambulance", number: "102", desc: "Pregnancy & infant care ambulance" },
      { name: "Emergency Medical (EMRI)", number: "108", desc: "Free medical, accident & trauma ambulance" },
      { name: "Disaster Management (NDMA)", number: "1078" },
      { name: "Road Accident Emergency", number: "1073" },
      { name: "Tourist Helpline", number: "1363", desc: "24×7 Ministry of Tourism, multi-lingual" },
    ],
  },
  {
    key: "women-child", title: "Women & Child", icon: Baby, color: "text-pink-600 bg-pink-500/10",
    lines: [
      { name: "Women Helpline (All India)", number: "1091" },
      { name: "Women in Distress (Domestic Abuse)", number: "181" },
      { name: "Childline (Child in Need)", number: "1098" },
      { name: "POCSO e-Box", number: "1098", desc: "Report child sexual abuse — NCPCR", url: "https://ncpcr.gov.in" },
      { name: "Missing Child / Woman", number: "1094" },
      { name: "National Commission for Women", number: "7827170170" },
    ],
  },
  {
    key: "health", title: "Health & Mental Wellness", icon: HeartPulse, color: "text-emerald-600 bg-emerald-500/10",
    lines: [
      { name: "Ministry of Health COVID / General", number: "1075" },
      { name: "AIDS Helpline", number: "1097" },
      { name: "Mental Health (KIRAN)", number: "1800-599-0019", desc: "24×7 free mental health rehabilitation" },
      { name: "Tele-MANAS Mental Health", number: "14416", desc: "National Tele Mental Health Programme" },
      { name: "Anti-Poison (AIIMS Delhi)", number: "1800-116-117" },
      { name: "Blood Bank Info (eRaktKosh)", number: "104", url: "https://eraktkosh.mohfw.gov.in" },
      { name: "TB Helpline", number: "1800-11-6666" },
      { name: "Ayushman Bharat (PM-JAY)", number: "14555", desc: "Health insurance scheme queries" },
    ],
  },
  {
    key: "senior", title: "Senior Citizens & Disability", icon: Users, color: "text-amber-600 bg-amber-500/10",
    lines: [
      { name: "Elderline (Senior Citizens)", number: "14567", desc: "Ministry of Social Justice — 24×7" },
      { name: "Senior Citizen Helpline", number: "1091" },
      { name: "Disability Helpline (Divyangjan)", number: "1800-233-5956" },
    ],
  },
  {
    key: "cyber", title: "Cyber Crime & Consumer", icon: Wifi, color: "text-indigo-600 bg-indigo-500/10",
    lines: [
      { name: "Cyber Crime & Financial Fraud", number: "1930", desc: "Report online fraud within 24h", url: "https://cybercrime.gov.in" },
      { name: "National Cyber Crime Portal", number: "155260", desc: "Legacy helpline (now 1930)" },
      { name: "National Consumer Helpline", number: "1915", desc: "Consumer complaints — Ministry of Consumer Affairs", url: "https://consumerhelpline.gov.in" },
      { name: "Anti-Corruption (CVC)", number: "1964" },
      { name: "GST Helpdesk", number: "1800-1200-232" },
      { name: "Income Tax Helpline", number: "1800-180-1961" },
    ],
  },
  {
    key: "farmer", title: "Farmer & Rural", icon: Wheat, color: "text-green-700 bg-green-500/10",
    lines: [
      { name: "Kisan Call Centre", number: "1800-180-1551", desc: "Agriculture advisory in 22 languages" },
      { name: "PM-KISAN Helpline", number: "155261", desc: "Also 011-24300606", url: "https://pmkisan.gov.in" },
      { name: "Soil Health Card", number: "1800-180-1551" },
      { name: "PMFBY Crop Insurance", number: "14447" },
      { name: "MGNREGA Helpline", number: "1800-345-22-44" },
    ],
  },
  {
    key: "utility", title: "Utilities & ID", icon: Landmark, color: "text-blue-600 bg-blue-500/10",
    lines: [
      { name: "Aadhaar (UIDAI)", number: "1947", url: "https://uidai.gov.in" },
      { name: "Passport Seva", number: "1800-258-1800", url: "https://portal2.passportindia.gov.in" },
      { name: "EPFO (Provident Fund)", number: "14470" },
      { name: "LPG Emergency / Gas Leak", number: "1906" },
      { name: "Electricity Complaint (Common)", number: "1912" },
      { name: "Postal Services", number: "1924" },
      { name: "MyGov Support", number: "1800-11-3468" },
    ],
  },
  {
    key: "transport", title: "Transport & Travel", icon: Train, color: "text-purple-600 bg-purple-500/10",
    lines: [
      { name: "Railway Security & Complaint", number: "139", desc: "RailMadad — all rail queries" },
      { name: "Railway Enquiry", number: "139" },
      { name: "Highway Emergency (NHAI)", number: "1033" },
      { name: "Vehicle Registration (Parivahan)", number: "1800-120-4210", url: "https://parivahan.gov.in" },
      { name: "Air India Customer Care", number: "1860-233-1407" },
    ],
  },
  {
    key: "education", title: "Education & Skill", icon: GraduationCap, color: "text-teal-600 bg-teal-500/10",
    lines: [
      { name: "UGC Anti-Ragging", number: "1800-180-5522", url: "https://antiragging.in" },
      { name: "CBSE Helpline", number: "1800-11-8004" },
      { name: "National Scholarship Portal", number: "0120-6619540", url: "https://scholarships.gov.in" },
      { name: "PMKVY Skill India", number: "8800-055-555" },
      { name: "Study in India / AICTE", number: "1800-572-2222" },
    ],
  },
  {
    key: "legal", title: "Legal Aid & Rights", icon: Scale, color: "text-slate-700 bg-slate-500/10",
    lines: [
      { name: "NALSA Legal Aid", number: "15100", desc: "Free legal aid nationwide", url: "https://nalsa.gov.in" },
      { name: "Human Rights (NHRC)", number: "14433", url: "https://nhrc.nic.in" },
      { name: "SC/ST Atrocities", number: "14566" },
      { name: "Anti Labour Trafficking", number: "1800-11-0031" },
    ],
  },
  {
    key: "misc", title: "Fire, Gas & Environment", icon: Flame, color: "text-orange-600 bg-orange-500/10",
    lines: [
      { name: "Forest / Wildlife Crime", number: "1800-11-9998" },
      { name: "Pollution Control (CPCB)", number: "1800-11-0031" },
      { name: "Earthquake / Disaster (NDRF)", number: "011-24363260" },
    ],
  },
];

function LineCard({ line, onCopy, copied }: { line: Line; onCopy: (n: string) => void; copied: boolean }) {
  return (
    <div className="rounded-xl border border-border bg-background/60 p-4 hover:shadow-elegant transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-semibold text-sm leading-tight">{line.name}</h3>
          {line.desc && <p className="text-xs text-muted-foreground mt-1">{line.desc}</p>}
        </div>
        <Button size="icon" variant="ghost" className="size-8 shrink-0" onClick={() => onCopy(line.number)} aria-label="Copy number">
          {copied ? <Check className="size-4 text-emerald-600" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <div className="mt-3 flex items-center gap-2 flex-wrap">
        <a href={`tel:${line.number.replace(/[^0-9+]/g, "")}`} className="inline-flex items-center gap-1.5 text-lg font-bold text-primary tracking-wide hover:underline">
          <Phone className="size-4" /> {line.number}
        </a>
        {line.url && (
          <a href={line.url} target="_blank" rel="noreferrer" className="ml-auto text-xs text-muted-foreground inline-flex items-center gap-1 hover:text-primary">
            Website <ExternalLink className="size-3" />
          </a>
        )}
      </div>
    </div>
  );
}

function Helplines() {
  const { lang } = useI18n();
  const [q, setQ] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (n: string) => {
    try {
      await navigator.clipboard.writeText(n);
      setCopied(n);
      toast.success(`Copied ${n}`);
      setTimeout(() => setCopied((c) => (c === n ? null : c)), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return SECTIONS;
    return SECTIONS
      .map((s) => ({ ...s, lines: s.lines.filter((l) => `${l.name} ${l.number} ${l.desc ?? ""}`.toLowerCase().includes(term)) }))
      .filter((s) => s.lines.length > 0);
  }, [q]);

  const totalCount = SECTIONS.reduce((n, s) => n + s.lines.length, 0);

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
          <Phone className="size-3.5" /> {lang === "en" ? "Verified Government Numbers" : "ధృవీకరించబడిన ప్రభుత్వ నంబర్లు"}
        </div>
        <h1 className="mt-4 text-3xl sm:text-4xl font-bold">
          {lang === "en" ? "Toll-free helpline directory" : "టోల్-ఫ్రీ హెల్ప్‌లైన్ డైరెక్టరీ"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {lang === "en"
            ? `Tap any number to call directly. All ${totalCount}+ numbers are official government helplines — free from any Indian phone.`
            : "నేరుగా కాల్ చేయడానికి ఏదైనా నంబర్‌ను నొక్కండి. అన్నీ అధికారిక ప్రభుత్వ హెల్ప్‌లైన్‌లు — భారతదేశంలోని ఏదైనా ఫోన్ నుండి ఉచితం."}
        </p>
      </div>

      <div className="mt-6 relative max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={lang === "en" ? "Search e.g. cyber, women, ambulance…" : "శోధించండి…"} className="pl-10 h-12" />
      </div>

      {/* Prominent 112 banner */}
      <div className="mt-6 rounded-2xl border-2 border-red-500/30 bg-gradient-to-br from-red-500/10 to-orange-500/10 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="size-14 rounded-xl bg-red-600 text-white grid place-items-center shrink-0 shadow-lg">
          <ShieldAlert className="size-7" />
        </div>
        <div className="flex-1">
          <div className="text-xs font-bold uppercase tracking-wider text-red-600">{lang === "en" ? "In any emergency, dial" : "అత్యవసర పరిస్థితిలో డయల్ చేయండి"}</div>
          <div className="text-2xl font-bold mt-0.5">112 — Police · Fire · Ambulance · Disaster</div>
        </div>
        <a href="tel:112">
          <Button size="lg" className="bg-red-600 hover:bg-red-700 text-white gap-2 font-bold">
            <Phone className="size-4" /> Call 112
          </Button>
        </a>
      </div>

      <div className="mt-8 space-y-8">
        {filtered.map((section) => {
          const Icon = section.icon;
          return (
            <section key={section.key}>
              <div className="flex items-center gap-3 mb-3">
                <div className={`size-10 rounded-xl grid place-items-center ${section.color}`}>
                  <Icon className="size-5" />
                </div>
                <h2 className="text-xl font-bold">{section.title}</h2>
                <span className="text-xs text-muted-foreground">({section.lines.length})</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {section.lines.map((l) => (
                  <LineCard key={`${section.key}-${l.name}`} line={l} onCopy={copy} copied={copied === l.number} />
                ))}
              </div>
            </section>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <Building2 className="size-10 mx-auto opacity-40 mb-3" />
            No helplines match "{q}"
          </div>
        )}
      </div>

      <div className="mt-10 rounded-xl border border-border bg-secondary/40 p-4 text-xs text-muted-foreground">
        ℹ️ {lang === "en"
          ? "Numbers are sourced from official government portals (MoHFW, MHA, MeitY, NCPCR, UIDAI, etc.) and last verified in 2025. Report inaccuracies via the Complaints page."
          : "సమాచారం అధికారిక ప్రభుత్వ పోర్టల్‌ల నుండి తీసుకోబడింది."}
      </div>
    </div>
  );
}
