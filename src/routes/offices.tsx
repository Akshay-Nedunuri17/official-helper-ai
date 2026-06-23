import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Phone, Clock, ExternalLink, List, Map as MapIcon, LocateFixed, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ClientOnly } from "@/components/ClientOnly";
import { OfficeMap } from "@/components/OfficeMap";
import { toast } from "sonner";

export const Route = createFileRoute("/offices")({ component: Offices });

function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function Offices() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [department, setDepartment] = useState("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [locating, setLocating] = useState(false);

  const { data = [] } = useQuery({
    queryKey: ["offices"],
    queryFn: async () =>
      (await supabase.from("offices").select("*").order("state").order("city")).data ?? [],
  });

  const states = useMemo(() => Array.from(new Set(data.map((o) => o.state))).sort(), [data]);
  const departments = useMemo(() => Array.from(new Set(data.map((o) => o.department))).sort(), [data]);

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error(lang === "te" ? "మీ బ్రౌజర్ స్థానాన్ని సపోర్ట్ చేయదు" : "Geolocation not supported");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        setNearbyOnly(true);
        setLocating(false);
        toast.success(lang === "te" ? "సమీప కార్యాలయాలను చూపుతోంది" : "Showing nearby offices");
      },
      (err) => {
        setLocating(false);
        toast.error(err.message || "Could not get location");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
    );
  };

  const filtered = useMemo(() => {
    let list = data.filter((o) => {
      if (state !== "all" && o.state !== state) return false;
      if (department !== "all" && o.department !== department) return false;
      if (!q) return true;
      return `${o.name} ${o.department} ${o.address} ${o.city} ${o.state}`.toLowerCase().includes(q.toLowerCase());
    });

    if (userLoc) {
      const withDist = list.map((o) => ({
        ...o,
        distanceKm:
          o.latitude != null && o.longitude != null
            ? haversineKm(userLoc, [o.latitude, o.longitude])
            : Infinity,
      }));
      withDist.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity));
      return nearbyOnly ? withDist.slice(0, 60) : withDist;
    }
    return list as (typeof list[number] & { distanceKm?: number })[];
  }, [data, q, state, department, userLoc, nearbyOnly]);

  const mapPins = filtered
    .filter((o) => o.latitude != null && o.longitude != null)
    .map((o) => ({
      id: o.id,
      name: o.name,
      department: o.department,
      address: o.address,
      city: o.city,
      latitude: o.latitude!,
      longitude: o.longitude!,
      distanceKm: (o as { distanceKm?: number }).distanceKm,
    }));

  return (
    <div className="container mx-auto px-4 py-8 sm:py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">{t("nav_offices")}</h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            {lang === "en"
              ? `Locate the nearest government office across India. ${data.length}+ offices indexed.`
              : `భారతదేశం అంతటా సమీప ప్రభుత్వ కార్యాలయాన్ని కనుగొనండి. ${data.length}+ కార్యాలయాలు.`}
          </p>
        </div>
        <Button
          variant={userLoc ? "default" : "outline"}
          onClick={requestLocation}
          disabled={locating}
          className="gap-2"
        >
          {locating ? <Loader2 className="size-4 animate-spin" /> : <LocateFixed className="size-4" />}
          {userLoc
            ? lang === "te" ? "స్థానం నవీకరించు" : "Update location"
            : lang === "te" ? "నా సమీపంలో" : "Use my location"}
        </Button>
      </div>

      <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("search_placeholder")}
            className="pl-10 h-11"
          />
        </div>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="h-11 px-3 rounded-md border border-input bg-background min-w-[12rem]"
        >
          <option value="all">{lang === "te" ? "అన్ని రాష్ట్రాలు" : "All States/UTs"}</option>
          {states.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-11 px-3 rounded-md border border-input bg-background min-w-[12rem]"
        >
          <option value="all">{lang === "te" ? "అన్ని శాఖలు" : "All Departments"}</option>
          {departments.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <div className="inline-flex rounded-md border border-input overflow-hidden">
          <button
            onClick={() => setView("list")}
            className={`px-3 h-11 inline-flex items-center gap-1.5 text-sm ${view === "list" ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >
            <List className="size-4" /> List
          </button>
          <button
            onClick={() => setView("map")}
            className={`px-3 h-11 inline-flex items-center gap-1.5 text-sm ${view === "map" ? "bg-primary text-primary-foreground" : "bg-background"}`}
          >
            <MapIcon className="size-4" /> Map
          </button>
        </div>
      </div>

      {userLoc && (
        <div className="mt-3 flex items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            <LocateFixed className="size-3.5" />
            {lang === "te" ? "మీ స్థానంతో ర్యాంక్ చేయబడింది" : "Sorted by distance from you"}
          </span>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={nearbyOnly}
              onChange={(e) => setNearbyOnly(e.target.checked)}
            />
            {lang === "te" ? "సమీప 60 మాత్రమే" : "Nearby 60 only"}
          </label>
        </div>
      )}

      {view === "map" ? (
        <div className="mt-6">
          <ClientOnly
            fallback={
              <div className="h-[480px] rounded-2xl border border-border grid place-items-center text-muted-foreground">
                Loading map…
              </div>
            }
          >
            <OfficeMap offices={mapPins} userLocation={userLoc} />
          </ClientOnly>
          <p className="text-xs text-muted-foreground mt-2">
            {mapPins.length} {lang === "te" ? "కార్యాలయాలు మ్యాప్‌లో" : "offices shown on map"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mt-4">
            {filtered.length} {lang === "te" ? "ఫలితాలు" : "results"}
          </p>
          <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.slice(0, 120).map((o) => (
              <div
                key={o.id}
                className="gradient-card rounded-xl border border-border p-5 hover:shadow-elegant transition-all flex flex-col"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase text-saffron tracking-wide">
                    {o.department}
                  </div>
                  {(o as { distanceKm?: number }).distanceKm != null &&
                    isFinite((o as { distanceKm?: number }).distanceKm!) && (
                      <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                        {(o as { distanceKm?: number }).distanceKm!.toFixed(1)} km
                      </span>
                    )}
                </div>
                <h3 className="mt-1 font-bold leading-tight">{o.name}</h3>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground flex-1">
                  <p className="flex items-start gap-2">
                    <MapPin className="size-4 mt-0.5 shrink-0" />
                    <span>
                      {o.address}, {o.city}, {o.state} {o.pincode}
                    </span>
                  </p>
                  {o.phone && (
                    <p className="flex items-center gap-2">
                      <Phone className="size-4 shrink-0" /> {o.phone}
                    </p>
                  )}
                  {o.hours && (
                    <p className="flex items-center gap-2">
                      <Clock className="size-4 shrink-0" /> {o.hours}
                    </p>
                  )}
                </div>
                {o.latitude && o.longitude && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                  >
                    {lang === "te" ? "దిశలు" : "Directions"} <ExternalLink className="size-3" />
                  </a>
                )}
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full text-center py-16 text-muted-foreground">
                No offices found.
              </div>
            )}
          </div>
          {filtered.length > 120 && (
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Showing first 120 of {filtered.length}. Narrow with filters or switch to Map view.
            </p>
          )}
        </>
      )}
    </div>
  );
}
