import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, FileText, Clock, IndianRupee, Building2, MapPin, LocateFixed, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { isServiceCenter } from "@/lib/center-types";
import { toast } from "sonner";

export const Route = createFileRoute("/services")({ component: Services });

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function Services() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("*").order("name_en")).data ?? [],
  });

  const { data: offices = [] } = useQuery({
    queryKey: ["offices-for-services"],
    queryFn: async () =>
      (await supabase
        .from("offices")
        .select("id, name, department, address, city, state, phone, latitude, longitude"))
        .data ?? [],
  });

  // Auto-detect location on mount
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation || userLoc) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLoc([pos.coords.latitude, pos.coords.longitude]),
      () => {},
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        setLocating(false);
        toast.success("Showing centers near you");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const nearestCenters = (() => {
    if (!userLoc) return [];
    const centers = offices
      .filter((o) => o.latitude != null && o.longitude != null && isServiceCenter(o.department))
      .map((o) => ({
        ...o,
        distanceKm: haversineKm(userLoc, [o.latitude as number, o.longitude as number]),
      }))
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, 6);
    return centers;
  })();

  const filtered = data.filter((s) =>
    !q || `${s.name_en} ${s.name_te ?? ""} ${s.department ?? ""}`.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl sm:text-4xl font-bold">{t("nav_services")}</h1>
      <p className="text-muted-foreground mt-2">
        {lang === "en" ? "Step-by-step procedures for everyday government services." : t("nav_services")}
      </p>
      <div className="mt-3 rounded-lg border border-border bg-secondary/40 px-4 py-3 text-sm text-muted-foreground">
        📍 {t("services_office_hint")} <a href="/offices" className="text-primary font-medium underline underline-offset-2">{t("nav_offices")}</a>
      </div>

      {/* Nearest service centers */}
      <section className="mt-6 rounded-2xl border border-border p-5 gradient-card">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-lg flex items-center gap-2">
              <LocateFixed className="size-5 text-primary" />
              {t("nearest_centers")}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {t("nearest_centers_hint")}
            </p>
          </div>
          <Button size="sm" variant={userLoc ? "outline" : "default"} onClick={detectLocation} disabled={locating} className="gap-2">
            {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
            {userLoc ? t("update_location") : t("use_my_location")}
          </Button>
        </div>
        {!userLoc ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {t("enable_location_for_nearby")}
          </p>
        ) : nearestCenters.length === 0 ? (
          <p className="mt-4 text-sm text-muted-foreground">
            {lang === "en" ? "Loading nearby centers…" : t("nearest_centers")}
          </p>
        ) : (
          <div className="mt-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearestCenters.map((c) => (
              <div key={c.id} className="rounded-xl border border-border bg-background/60 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="text-[10px] font-semibold uppercase tracking-wide text-saffron">{c.department}</div>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                    {c.distanceKm.toFixed(1)} km
                  </span>
                </div>
                <h3 className="mt-1 font-semibold text-sm leading-tight">{c.name}</h3>
                <p className="mt-1 text-xs text-muted-foreground flex items-start gap-1.5">
                  <MapPin className="size-3.5 mt-0.5 shrink-0" />
                  <span>{c.city}, {c.state}</span>
                </p>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                  target="_blank" rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                >
                  {t("directions")} <ExternalLink className="size-3" />
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="relative mt-6 max-w-xl">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("search_placeholder")} className="pl-10 h-12" />
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {filtered.map((s) => (
          <div key={s.id} className="gradient-card rounded-xl border border-border p-6 hover:shadow-elegant transition-all">
            <div className="flex items-start gap-3">
              <div className="size-10 rounded-lg gradient-hero grid place-items-center text-primary-foreground shrink-0">
                <Building2 className="size-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-lg leading-tight">{lang === "te" && s.name_te ? s.name_te : s.name_en}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{s.department}</p>
              </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{lang === "te" && s.description_te ? s.description_te : s.description_en}</p>

            <div className="mt-4 space-y-2 text-sm">
              <div><span className="font-semibold">{t("procedure")}: </span><span className="text-muted-foreground">{lang === "te" && s.procedure_te ? s.procedure_te : s.procedure_en}</span></div>
              <div className="flex flex-wrap gap-4 text-xs pt-2">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><IndianRupee className="size-3.5" /> {s.fee}</span>
                <span className="inline-flex items-center gap-1.5 text-muted-foreground"><Clock className="size-3.5" /> {s.processing_time}</span>
              </div>
            </div>

            {s.documents.length > 0 && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="text-xs font-semibold mb-2 flex items-center gap-1.5"><FileText className="size-3.5" /> {t("required_docs")}</div>
                <div className="flex flex-wrap gap-1.5">
                  {s.documents.map((d) => <span key={d} className="text-xs px-2 py-0.5 rounded-md bg-secondary text-secondary-foreground">{d}</span>)}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
