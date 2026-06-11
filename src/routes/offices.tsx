import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Phone, Clock, ExternalLink, List, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ClientOnly } from "@/components/ClientOnly";
import { OfficeMap } from "@/components/OfficeMap";

export const Route = createFileRoute("/offices")({ component: Offices });

function Offices() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("all");
  const [view, setView] = useState<"list" | "map">("list");

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

  const mapPins = filtered
    .filter((o) => o.latitude != null && o.longitude != null)
    .map((o) => ({
      id: o.id, name: o.name, department: o.department, address: o.address,
      city: o.city, latitude: o.latitude!, longitude: o.longitude!,
    }));

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <h1 className="text-3xl sm:text-4xl font-bold">{t("nav_offices")}</h1>
      <p className="text-muted-foreground mt-2 text-sm sm:text-base">
        {lang === "en" ? "Locate the nearest government office for your needs." : "మీ అవసరాల కోసం సమీప ప్రభుత్వ కార్యాలయాన్ని గుర్తించండి."}
      </p>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-[1fr_auto_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} className="pl-10 h-11" />
        </div>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="h-11 px-3 rounded-md border border-input bg-background min-w-[10rem]">
          <option value="all">{t("all")}</option>
          {cities.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <div className="inline-flex rounded-md border border-input overflow-hidden">
          <button onClick={() => setView("list")} className={`px-3 h-11 inline-flex items-center gap-1.5 text-sm ${view === "list" ? "bg-primary text-primary-foreground" : "bg-background"}`}>
            <List className="size-4" /> List
          </button>
          <button onClick={() => setView("map")} className={`px-3 h-11 inline-flex items-center gap-1.5 text-sm ${view === "map" ? "bg-primary text-primary-foreground" : "bg-background"}`}>
            <MapIcon className="size-4" /> Map
          </button>
        </div>
      </div>

      {view === "map" ? (
        <div className="mt-6">
          <ClientOnly fallback={<div className="h-[420px] rounded-2xl border border-border grid place-items-center text-muted-foreground">Loading map…</div>}>
            <OfficeMap offices={mapPins} />
          </ClientOnly>
          <p className="text-xs text-muted-foreground mt-2">{mapPins.length} {lang === "te" ? "కార్యాలయాలు మ్యాప్‌లో" : "offices shown on map"}</p>
        </div>
      ) : (
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
                  href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`}
                  target="_blank" rel="noreferrer"
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  {lang === "te" ? "దిశలు" : "Directions"} <ExternalLink className="size-3" />
                </a>
              )}
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-full text-center py-16 text-muted-foreground">No offices found.</div>
          )}
        </div>
      )}
    </div>
  );
}
