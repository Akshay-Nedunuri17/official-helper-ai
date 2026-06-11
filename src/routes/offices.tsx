import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Phone, Clock, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/offices")({ component: Offices });

function Offices() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");

  const { data = [] } = useQuery({
    queryKey: ["offices"],
    queryFn: async () => (await supabase.from("offices").select("*").order("city")).data ?? [],
  });

  const cities = useMemo(() => Array.from(new Set(data.map((o) => o.city))), [data]);
  const filtered = data.filter((o) => {
    if (city !== "all" && o.city !== city) return false;
    if (!q) return true;
    return `${o.name} ${o.department} ${o.address} ${o.state}`.toLowerCase().includes(q.toLowerCase());
  });

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold">{t("nav_offices")}</h1>
      <p className="text-muted-foreground mt-2">
        {lang === "en" ? "Locate the nearest government office for your needs." : "మీ అవసరాల కోసం సమీప ప్రభుత్వ కార్యాలయాన్ని గుర్తించండి."}
      </p>

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} className="pl-10 h-12" />
        </div>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="h-12 px-3 rounded-md border border-input bg-background">
          <option value="all">{t("all")}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div className="mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((o) => (
          <div key={o.id} className="gradient-card rounded-xl border border-border p-5 hover:shadow-elegant transition-all flex flex-col">
            <div className="text-xs font-semibold uppercase text-saffron tracking-wide">{o.department}</div>
            <h3 className="mt-1 font-bold leading-tight">{o.name}</h3>
            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground flex-1">
              <p className="flex items-start gap-2"><MapPin className="size-4 mt-0.5 shrink-0" /> <span>{o.address}, {o.city}, {o.state} {o.pincode}</span></p>
              {o.phone && <p className="flex items-center gap-2"><Phone className="size-4 shrink-0" /> {o.phone}</p>}
              {o.hours && <p className="flex items-center gap-2"><Clock className="size-4 shrink-0" /> {o.hours}</p>}
            </div>
            {o.latitude && o.longitude && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${o.latitude},${o.longitude}`}
                target="_blank" rel="noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
              >
                Open in Maps <ExternalLink className="size-3" />
              </a>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
