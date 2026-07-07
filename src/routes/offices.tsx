import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo, useRef, useEffect } from "react";
import { Input } from "@/components/ui/input";
import {
  Search, MapPin, Phone, Clock, ExternalLink, List, Map as MapIcon,
  LocateFixed, Loader2, Building2, Landmark, X, Crosshair,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";
import { ClientOnly } from "@/components/ClientOnly";
import { OfficeMap } from "@/components/OfficeMap";
import { toast } from "sonner";
import Fuse from "fuse.js";
import { CENTER_TYPES, matchesCenter } from "@/lib/center-types";

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

type Suggestion =
  | { kind: "office"; id: string; label: string; sub: string }
  | { kind: "department"; label: string }
  | { kind: "state"; label: string }
  | { kind: "city"; label: string; state: string };

function Offices() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const [state, setState] = useState("all");
  const [department, setDepartment] = useState("all");
  const [centerType, setCenterType] = useState<string>("all");
  const [view, setView] = useState<"list" | "map">("list");
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [userLoc, setUserLoc] = useState<[number, number] | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [locating, setLocating] = useState(false);
  const [pickMode, setPickMode] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const autoTriedRef = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  const { data = [] } = useQuery({
    queryKey: ["offices"],
    queryFn: async () =>
      (await supabase.from("offices").select("*").order("state").order("city")).data ?? [],
  });

  const states = useMemo(() => Array.from(new Set(data.map((o) => o.state))).sort(), [data]);
  const departments = useMemo(() => Array.from(new Set(data.map((o) => o.department))).sort(), [data]);
  const cities = useMemo(() => {
    const m = new Map<string, string>();
    data.forEach((o) => m.set(`${o.city}|${o.state}`, o.state));
    return Array.from(m.entries()).map(([k, st]) => ({ city: k.split("|")[0], state: st }));
  }, [data]);

  // Fuzzy indexes
  const officeFuse = useMemo(
    () => new Fuse(data, {
      keys: [
        { name: "name", weight: 0.5 },
        { name: "department", weight: 0.2 },
        { name: "city", weight: 0.2 },
        { name: "state", weight: 0.1 },
      ],
      threshold: 0.38, ignoreLocation: true, minMatchCharLength: 2,
    }),
    [data],
  );
  const deptFuse = useMemo(() => new Fuse(departments, { threshold: 0.4 }), [departments]);
  const stateFuse = useMemo(() => new Fuse(states, { threshold: 0.4 }), [states]);
  const cityFuse = useMemo(() => new Fuse(cities, { keys: ["city"], threshold: 0.38 }), [cities]);

  const suggestions: Suggestion[] = useMemo(() => {
    const term = q.trim();
    if (term.length < 2) return [];
    const out: Suggestion[] = [];
    deptFuse.search(term).slice(0, 3).forEach((r) => out.push({ kind: "department", label: r.item }));
    stateFuse.search(term).slice(0, 2).forEach((r) => out.push({ kind: "state", label: r.item }));
    cityFuse.search(term).slice(0, 3).forEach((r) => out.push({ kind: "city", label: r.item.city, state: r.item.state }));
    officeFuse.search(term).slice(0, 6).forEach((r) =>
      out.push({ kind: "office", id: r.item.id, label: r.item.name, sub: `${r.item.department} · ${r.item.city}, ${r.item.state}` }),
    );
    return out;
  }, [q, deptFuse, stateFuse, cityFuse, officeFuse]);

  // Click outside to close suggestions
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const applySuggestion = (s: Suggestion) => {
    setSuggestOpen(false);
    setActiveIdx(-1);
    if (s.kind === "department") { setDepartment(s.label); setQ(""); }
    else if (s.kind === "state") { setState(s.label); setQ(""); }
    else if (s.kind === "city") { setState(s.state); setQ(s.label); }
    else { setQ(s.label); }
  };

  const requestLocation = () => {
    if (!navigator.geolocation) {
      toast.error(lang === "te" ? "మీ బ్రౌజర్ స్థానాన్ని సపోర్ట్ చేయదు" : "Geolocation not supported");
      setManualOpen(true);
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
        setAccuracy(pos.coords.accuracy ?? null);
        setNearbyOnly(true);
        setLocating(false);
        const acc = pos.coords.accuracy;
        toast.success(
          lang === "te"
            ? `సమీప కార్యాలయాలను చూపుతోంది (±${Math.round(acc)} మీ)`
            : `Showing nearby offices (±${Math.round(acc)} m accuracy)`,
        );
      },
      (err) => {
        setLocating(false);
        const msg = err.code === err.PERMISSION_DENIED
          ? (lang === "te" ? "అనుమతి తిరస్కరించబడింది — మాన్యువల్‌గా సెట్ చేయండి" : "Permission denied — set location manually")
          : err.message;
        toast.error(msg);
        setManualOpen(true);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  };

  const setManualByCity = (cityName: string, cityState: string) => {
    const sample = data.find((o) => o.city === cityName && o.state === cityState && o.latitude != null);
    if (!sample || sample.latitude == null || sample.longitude == null) {
      toast.error("Couldn't resolve city coordinates"); return;
    }
    setUserLoc([sample.latitude, sample.longitude]);
    setAccuracy(5000);
    setNearbyOnly(true);
    setManualOpen(false);
    toast.success(`Location set to ${cityName}, ${cityState}`);
  };

  const onMapPick = (lat: number, lng: number) => {
    setUserLoc([lat, lng]);
    setAccuracy(200);
    setNearbyOnly(true);
    setPickMode(false);
    toast.success(lang === "te" ? "స్థానం సెట్ చేయబడింది" : "Location set");
  };

  const filtered = useMemo(() => {
    const ct = centerType !== "all" ? CENTER_TYPES.find((c) => c.key === centerType) : null;
    let list = data.filter((o) => {
      if (state !== "all" && o.state !== state) return false;
      if (department !== "all" && o.department !== department) return false;
      if (ct && !matchesCenter(o.department, ct)) return false;
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
      id: o.id, name: o.name, department: o.department, address: o.address,
      city: o.city, latitude: o.latitude!, longitude: o.longitude!,
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
        <div className="flex flex-wrap gap-2">
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
          <Button variant="outline" onClick={() => setManualOpen((v) => !v)} className="gap-2">
            <Crosshair className="size-4" />
            {lang === "te" ? "మాన్యువల్" : "Set manually"}
          </Button>
        </div>
      </div>

      {/* Manual location panel */}
      {manualOpen && (
        <div className="mt-4 rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-semibold text-sm">
                {lang === "te" ? "మీ స్థానాన్ని మాన్యువల్‌గా సెట్ చేయండి" : "Set your location manually"}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {lang === "te"
                  ? "నగరాన్ని ఎంచుకోండి లేదా మ్యాప్‌పై టాప్ చేయండి."
                  : "Pick a city or tap a point on the map."}
              </p>
            </div>
            <button onClick={() => setManualOpen(false)} className="text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          </div>
          <div className="mt-3 grid sm:grid-cols-[1fr_1fr_auto] gap-2">
            <select
              id="manual-state"
              className="h-10 px-3 rounded-md border border-input bg-background"
              onChange={(e) => {
                const sel = e.target.value;
                const cityEl = document.getElementById("manual-city") as HTMLSelectElement;
                if (cityEl) cityEl.dataset.state = sel;
              }}
              defaultValue=""
            >
              <option value="" disabled>{lang === "te" ? "రాష్ట్రం" : "Select state"}</option>
              {states.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <select id="manual-city" className="h-10 px-3 rounded-md border border-input bg-background" defaultValue="">
              <option value="" disabled>{lang === "te" ? "నగరం" : "Select city"}</option>
              {cities.map((c) => <option key={`${c.city}-${c.state}`} value={`${c.city}|${c.state}`}>{c.city} ({c.state})</option>)}
            </select>
            <Button
              onClick={() => {
                const cityEl = document.getElementById("manual-city") as HTMLSelectElement;
                if (!cityEl?.value) { toast.error("Pick a city"); return; }
                const [city, st] = cityEl.value.split("|");
                setManualByCity(city, st);
              }}
            >
              {lang === "te" ? "సెట్ చేయండి" : "Apply"}
            </Button>
          </div>
          <div className="mt-3">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => { setPickMode(true); setView("map"); setManualOpen(false); }}
            >
              <MapIcon className="size-4" />
              {lang === "te" ? "మ్యాప్‌పై టాప్ చేయండి" : "Tap on map"}
            </Button>
          </div>
        </div>
      )}

      {/* Search + filters with autocomplete */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3">
        <div className="relative" ref={boxRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={q}
            onChange={(e) => { setQ(e.target.value); setSuggestOpen(true); setActiveIdx(-1); }}
            onFocus={() => setSuggestOpen(true)}
            onKeyDown={(e) => {
              if (!suggestOpen || suggestions.length === 0) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, suggestions.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
              else if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); applySuggestion(suggestions[activeIdx]); }
              else if (e.key === "Escape") setSuggestOpen(false);
            }}
            placeholder={lang === "te" ? "కార్యాలయం, శాఖ, నగరం…" : "Search offices, departments, cities…"}
            className="pl-10 h-11"
          />
          {suggestOpen && suggestions.length > 0 && (
            <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-lg border border-border bg-popover shadow-lg max-h-80 overflow-auto">
              {suggestions.map((s, i) => {
                const active = i === activeIdx;
                const Icon = s.kind === "office" ? Building2 : s.kind === "department" ? Landmark : MapPin;
                return (
                  <button
                    key={`${s.kind}-${i}-${s.label}`}
                    onMouseEnter={() => setActiveIdx(i)}
                    onMouseDown={(e) => { e.preventDefault(); applySuggestion(s); }}
                    className={`w-full text-left px-3 py-2 flex items-start gap-2 text-sm border-b border-border/60 last:border-0 ${active ? "bg-accent" : "hover:bg-accent/60"}`}
                  >
                    <Icon className="size-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0 flex-1">
                      <div className="font-medium truncate">{s.label}</div>
                      {"sub" in s && <div className="text-xs text-muted-foreground truncate">{s.sub}</div>}
                      {s.kind !== "office" && (
                        <div className="text-[10px] uppercase tracking-wide text-muted-foreground/80">
                          {s.kind === "city" ? `City · ${(s as { state: string }).state}` : s.kind}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          className="h-11 px-3 rounded-md border border-input bg-background min-w-[12rem]"
        >
          <option value="all">{lang === "te" ? "అన్ని రాష్ట్రాలు" : "All States/UTs"}</option>
          {states.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="h-11 px-3 rounded-md border border-input bg-background min-w-[12rem]"
        >
          <option value="all">{lang === "te" ? "అన్ని శాఖలు" : "All Departments"}</option>
          {departments.map((c) => <option key={c} value={c}>{c}</option>)}
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
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary">
            <LocateFixed className="size-3.5" />
            {lang === "te" ? "మీ స్థానంతో ర్యాంక్" : "Sorted by distance"}
            {accuracy != null && (
              <span className="ml-1 text-xs opacity-80">
                ±{accuracy >= 1000 ? `${(accuracy / 1000).toFixed(1)} km` : `${Math.round(accuracy)} m`}
              </span>
            )}
          </span>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={nearbyOnly} onChange={(e) => setNearbyOnly(e.target.checked)} />
            {lang === "te" ? "సమీప 60 మాత్రమే" : "Nearby 60 only"}
          </label>
          <button
            onClick={() => { setUserLoc(null); setAccuracy(null); setNearbyOnly(false); }}
            className="text-xs text-muted-foreground hover:text-foreground underline"
          >
            {lang === "te" ? "క్లియర్" : "Clear location"}
          </button>
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
            <OfficeMap
              offices={mapPins}
              userLocation={userLoc}
              accuracyMeters={accuracy}
              pickMode={pickMode}
              onPickLocation={onMapPick}
            />
          </ClientOnly>
          <p className="text-xs text-muted-foreground mt-2">
            {mapPins.length} {lang === "te" ? "కార్యాలయాలు మ్యాప్‌లో" : "offices shown on map"}
            {pickMode && " · Tap the map to set your location"}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs text-muted-foreground mt-4">
            {filtered.length} {lang === "te" ? "ఫలితాలు" : "results"}
          </p>
          <div className="mt-3 grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.slice(0, 120).map((o) => (
              <div key={o.id} className="gradient-card rounded-xl border border-border p-5 hover:shadow-elegant transition-all flex flex-col">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs font-semibold uppercase text-saffron tracking-wide">{o.department}</div>
                  {(o as { distanceKm?: number }).distanceKm != null && isFinite((o as { distanceKm?: number }).distanceKm!) && (
                    <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {(o as { distanceKm?: number }).distanceKm!.toFixed(1)} km
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-bold leading-tight">{o.name}</h3>
                <div className="mt-3 space-y-1.5 text-sm text-muted-foreground flex-1">
                  <p className="flex items-start gap-2">
                    <MapPin className="size-4 mt-0.5 shrink-0" />
                    <span>{o.address}, {o.city}, {o.state} {o.pincode}</span>
                  </p>
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
