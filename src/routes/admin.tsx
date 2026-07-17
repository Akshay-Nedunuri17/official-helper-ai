import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { ShieldAlert, Users, FileText, MapPin, Building2, TrendingUp, Search as SearchIcon, MessageSquareWarning, Upload, Download, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import { importOffices } from "@/lib/office-import.functions";
import { getAdminDashboard } from "@/lib/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const { t } = useI18n();
  const { user, loading } = useAuth();
  const nav = useNavigate();

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-dashboard"],
    enabled: !!user,
    retry: false,
    queryFn: () => getAdminDashboard(),
  });

  const stats = data?.stats;
  const topSchemes = data?.topSchemes ?? [];
  const topSearches = data?.topSearches ?? [];
  const recentComplaints = data?.recentComplaints ?? [];

  if (loading || isLoading) return null;

  // Server-side role check: any auth/authorization failure hides the admin UI.
  if (error) {
    return (
      <div className="container mx-auto px-4 py-20 max-w-md text-center">
        <ShieldAlert className="size-12 mx-auto text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">{t("admin_only")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Your account does not have admin privileges.
        </p>
      </div>
    );
  }


  const cards = [
    { I: FileText, l: "Schemes", v: stats?.schemes },
    { I: Building2, l: "Services", v: stats?.services },
    { I: MapPin, l: "Offices", v: stats?.offices },
    { I: Users, l: "Users", v: stats?.users },
    { I: MessageSquareWarning, l: "Complaints", v: stats?.complaints },
    { I: TrendingUp, l: "Scheme views", v: stats?.views },
    { I: SearchIcon, l: "Searches", v: stats?.searches },
  ];

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold">{t("nav_admin")} Analytics</h1>
      <p className="text-muted-foreground mt-2">Overview of the JanSahayak platform.</p>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {cards.map(({ I, l, v }) => (
          <div key={l} className="gradient-card border border-border rounded-xl p-4 shadow-elegant">
            <div className="size-8 rounded-lg gradient-hero grid place-items-center text-primary-foreground"><I className="size-4" /></div>
            <div className="mt-3 text-2xl font-bold font-display">{v ?? "—"}</div>
            <div className="text-xs text-muted-foreground">{l}</div>
          </div>
        ))}
      </div>

      <div className="mt-10 grid lg:grid-cols-2 gap-6">
        <div className="gradient-card border border-border rounded-2xl p-6">
          <h2 className="font-bold flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Most viewed schemes</h2>
          <div className="mt-4 h-64">
            {topSchemes.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topSchemes} layout="vertical" margin={{ left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                  <XAxis type="number" tick={{ fontSize: 10 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10 }} width={150} />
                  <Tooltip />
                  <Bar dataKey="views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <div className="h-full grid place-items-center text-sm text-muted-foreground">No views yet.</div>}
          </div>
        </div>

        <div className="gradient-card border border-border rounded-2xl p-6">
          <h2 className="font-bold flex items-center gap-2"><SearchIcon className="size-4 text-primary" /> Top search queries</h2>
          <ul className="mt-4 space-y-2 max-h-64 overflow-auto">
            {topSearches.map((s) => (
              <li key={s.term} className="flex items-center justify-between text-sm border-b border-border pb-2">
                <span className="truncate">{s.term}</span>
                <span className="text-muted-foreground font-mono text-xs">{s.count}</span>
              </li>
            ))}
            {topSearches.length === 0 && <li className="text-sm text-muted-foreground">No searches yet.</li>}
          </ul>
        </div>
      </div>

      <div className="mt-6 gradient-card border border-border rounded-2xl p-6">
        <h2 className="font-bold flex items-center gap-2"><MessageSquareWarning className="size-4 text-primary" /> Recent complaints</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="text-left text-xs text-muted-foreground border-b border-border">
              <tr><th className="pb-2">Tracking</th><th className="pb-2">Title</th><th className="pb-2">Category</th><th className="pb-2">Status</th><th className="pb-2">Date</th></tr>
            </thead>
            <tbody>
              {recentComplaints.map((c: any) => (
                <tr key={c.id} className="border-b border-border/50">
                  <td className="py-2 font-mono text-xs">{c.tracking_number}</td>
                  <td className="py-2">{c.title}</td>
                  <td className="py-2 text-muted-foreground">{c.category}</td>
                  <td className="py-2"><span className="text-xs px-2 py-0.5 rounded bg-secondary">{c.status}</span></td>
                  <td className="py-2 text-muted-foreground text-xs">{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {recentComplaints.length === 0 && <tr><td colSpan={5} className="py-6 text-center text-muted-foreground">No complaints yet.</td></tr>}
            </tbody>
          </table>
        </div>
        <Link to="/complaints" className="mt-4 inline-block text-sm text-primary font-medium">View all complaints →</Link>
      </div>

      <OfficeImportCard />
    </div>
  );
}

const SAMPLE_CSV = `name,department,address,city,state,pincode,phone,email,latitude,longitude,hours
MeeSeva Kendra - Example Town,MeeSeva,Main Road,Example Town,Andhra Pradesh,500001,08000000000,,17.385,78.4867,9:00 AM - 5:00 PM
CSC - Sample Village,CSC,Village Panchayat Bhavan,Sample Village,Uttar Pradesh,226001,,,26.8467,80.9462,10:00 AM - 6:00 PM
`;

type ParsedRow = {
  name: string;
  department: string;
  address: string;
  city: string;
  state: string;
  pincode?: string | null;
  phone?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  hours?: string | null;
};

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error("CSV has no data rows. Add at least one office row below the header.");
  // Simple CSV split — supports quoted fields with commas.
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "";
    let inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (inQ) {
        if (ch === '"' && line[i + 1] === '"') { cur += '"'; i++; }
        else if (ch === '"') inQ = false;
        else cur += ch;
      } else {
        if (ch === ',') { out.push(cur); cur = ""; }
        else if (ch === '"') inQ = true;
        else cur += ch;
      }
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, "_"));
  const idx = (...keys: string[]) => keys.map((k) => headers.indexOf(k)).find((i) => i >= 0) ?? -1;
  const iName = idx("name"), iDept = idx("department"), iAddr = idx("address"),
    iCity = idx("city"), iState = idx("state"), iPin = idx("pincode"),
    iPhone = idx("phone"), iEmail = idx("email"), iLat = idx("latitude", "lat"),
    iLng = idx("longitude", "lng", "lon", "long"), iHours = idx("hours", "timings");
  const missingHeaders = [
    ["name", iName], ["city", iCity], ["state", iState], ["latitude/lat", iLat], ["longitude/lng", iLng],
  ].filter(([, i]) => i === -1).map(([k]) => k);
  if (missingHeaders.length > 0) {
    throw new Error(`CSV is missing required column${missingHeaders.length > 1 ? "s" : ""}: ${missingHeaders.join(", ")}.`);
  }
  const rows: ParsedRow[] = [];
  const errors: string[] = [];
  for (let i = 1; i < lines.length; i++) {
    const c = splitLine(lines[i]);
    const lineNo = i + 1;
    const rowErrors: string[] = [];
    const name = c[iName]?.trim();
    const city = c[iCity]?.trim();
    const state = c[iState]?.trim();
    const latRaw = c[iLat]?.trim();
    const lngRaw = c[iLng]?.trim();
    const lat = latRaw ? Number(latRaw) : NaN;
    const lng = lngRaw ? Number(lngRaw) : NaN;

    if (!name) rowErrors.push("missing name");
    if (!city) rowErrors.push("missing city");
    if (!state) rowErrors.push("missing state");
    if (!latRaw) rowErrors.push("missing latitude/lat");
    else if (!Number.isFinite(lat) || lat < -90 || lat > 90) rowErrors.push(`invalid latitude '${latRaw}'`);
    if (!lngRaw) rowErrors.push("missing longitude/lng");
    else if (!Number.isFinite(lng) || lng < -180 || lng > 180) rowErrors.push(`invalid longitude '${lngRaw}'`);

    if (rowErrors.length > 0) {
      errors.push(`Row ${lineNo}: ${rowErrors.join(", ")}`);
      continue;
    }

    rows.push({
      name,
      department: iDept >= 0 && c[iDept]?.trim() ? c[iDept].trim() : "Government Service Center",
      address: iAddr >= 0 && c[iAddr]?.trim() ? c[iAddr].trim() : `${city}, ${state}`,
      city,
      state,
      pincode: iPin >= 0 ? c[iPin] || null : null,
      phone: iPhone >= 0 ? c[iPhone] || null : null,
      email: iEmail >= 0 ? c[iEmail] || null : null,
      latitude: lat,
      longitude: lng,
      hours: iHours >= 0 ? c[iHours] || null : null,
    });
  }
  if (errors.length > 0) {
    throw new Error(`Fix these CSV errors before importing:\n${errors.slice(0, 30).join("\n")}${errors.length > 30 ? `\n…and ${errors.length - 30} more rows` : ""}`);
  }
  return rows;
}

function OfficeImportCard() {
  const { t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; updated: number; failed: number; errors: string[] } | null>(null);

  const downloadSample = () => {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "offices-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = async (file: File) => {
    setBusy(true);
    setResult(null);
    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) throw new Error("No valid rows found");
      const res = await importOffices({ data: { rows } });
      setResult(res);
      toast.success(`Import complete — ${res.inserted} added, ${res.updated} updated${res.failed ? `, ${res.failed} failed` : ""}`);
    } catch (e) {
      const message = (e as Error).message;
      setResult({ inserted: 0, updated: 0, failed: 0, errors: message.split("\n").filter(Boolean) });
      toast.error(message.split("\n")[0]);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-6 gradient-card border border-border rounded-2xl p-6">
      <h2 className="font-bold flex items-center gap-2"><Upload className="size-4 text-primary" /> {t("admin_import_offices")}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{t("admin_import_hint")}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={downloadSample} className="gap-2">
          <Download className="size-4" /> {t("admin_import_download")}
        </Button>
        <Button size="sm" disabled={busy} onClick={() => inputRef.current?.click()} className="gap-2">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          {busy ? t("admin_import_running") : t("admin_import_upload")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onFile(f);
          }}
        />
      </div>
      {result && (
        <div className="mt-4 rounded-lg border border-border bg-background/60 p-4 text-sm">
          <div className="flex flex-wrap gap-4">
            <span>✅ Added: <b>{result.inserted}</b></span>
            <span>♻️ Updated: <b>{result.updated}</b></span>
            <span>❌ Failed: <b>{result.failed}</b></span>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-3 space-y-1 text-xs text-destructive max-h-40 overflow-auto">
              {result.errors.map((e, i) => <li key={i}>• {e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

