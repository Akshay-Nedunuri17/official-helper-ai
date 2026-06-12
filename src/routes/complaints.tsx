import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Camera, MapPin, Plus, Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { toast } from "sonner";

export const Route = createFileRoute("/complaints")({ component: Complaints });

const CATEGORIES = ["Roads & Infrastructure", "Water Supply", "Sanitation", "Electricity", "Public Health", "Education", "Corruption", "Other"];

function Complaints() {
  const { user, loading } = useAuth();
  const { lang } = useI18n();
  const nav = useNavigate();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [trackQ, setTrackQ] = useState("");

  useEffect(() => { if (!loading && !user) nav({ to: "/auth" }); }, [user, loading, nav]);

  const { data: complaints = [] } = useQuery({
    queryKey: ["complaints", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("complaints").select("*").order("created_at", { ascending: false })).data ?? [],
  });

  const filtered = trackQ
    ? complaints.filter((c) => c.tracking_number.toLowerCase().includes(trackQ.toLowerCase()))
    : complaints;

  if (!user) return null;

  return (
    <div className="container mx-auto px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-bold">{lang === "en" ? "Citizen Complaints" : "పౌర ఫిర్యాదులు"}</h1>
          <p className="text-muted-foreground mt-2">{lang === "en" ? "Report civic issues with photo and location. Track status anytime." : "ఫోటో మరియు స్థానంతో ఫిర్యాదు చేయండి. స్థితిని ట్రాక్ చేయండి."}</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 gradient-hero text-primary-foreground border-0"><Plus className="size-4" /> {lang === "en" ? "New complaint" : "కొత్త ఫిర్యాదు"}</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
            <DialogHeader><DialogTitle>{lang === "en" ? "File a complaint" : "ఫిర్యాదు ఫైల్ చేయండి"}</DialogTitle></DialogHeader>
            <ComplaintForm onDone={() => { setOpen(false); qc.invalidateQueries({ queryKey: ["complaints"] }); }} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-8 max-w-md">
        <Label className="text-xs">{lang === "en" ? "Track by tracking number" : "ట్రాకింగ్ నంబర్‌తో ట్రాక్ చేయండి"}</Label>
        <Input value={trackQ} onChange={(e) => setTrackQ(e.target.value)} placeholder="JS-XXXXXXXX" className="mt-1" />
      </div>

      <div className="mt-8 grid md:grid-cols-2 gap-4">
        {filtered.map((c) => <ComplaintCard key={c.id} c={c} />)}
        {filtered.length === 0 && (
          <div className="md:col-span-2 text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
            {lang === "en" ? "No complaints yet. Click 'New complaint' to file one." : "ఫిర్యాదులు లేవు."}
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { I: any; cls: string }> = {
    submitted: { I: Clock, cls: "bg-saffron/10 text-saffron border-saffron/30" },
    in_progress: { I: AlertCircle, cls: "bg-primary/10 text-primary border-primary/30" },
    resolved: { I: CheckCircle2, cls: "bg-green-500/10 text-green-600 border-green-500/30" },
    rejected: { I: AlertCircle, cls: "bg-destructive/10 text-destructive border-destructive/30" },
  };
  const { I, cls } = map[status] ?? map.submitted;
  return <Badge variant="outline" className={`gap-1 ${cls}`}><I className="size-3" />{status.replace("_", " ")}</Badge>;
}

function ComplaintCard({ c }: { c: any }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!c.photo_url) return;
    supabase.storage.from("complaint-photos").createSignedUrl(c.photo_url, 3600).then(({ data }) => {
      if (data?.signedUrl) setPhotoUrl(data.signedUrl);
    });
  }, [c.photo_url]);

  return (
    <div className="gradient-card rounded-xl border border-border p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-mono text-muted-foreground">{c.tracking_number}</div>
          <h3 className="mt-1 font-bold leading-tight">{c.title}</h3>
          <div className="text-xs text-saffron font-semibold mt-1 uppercase">{c.category}</div>
        </div>
        <StatusBadge status={c.status} />
      </div>
      <p className="mt-3 text-sm text-muted-foreground line-clamp-3">{c.description}</p>
      {photoUrl && <img src={photoUrl} alt="Complaint" className="mt-3 rounded-lg w-full max-h-48 object-cover" loading="lazy" />}
      {c.address && <div className="mt-3 text-xs text-muted-foreground flex items-start gap-1.5"><MapPin className="size-3 mt-0.5 shrink-0" />{c.address}</div>}
      {c.admin_response && <div className="mt-3 p-3 rounded-md bg-secondary text-sm"><strong>Response:</strong> {c.admin_response}</div>}
      <div className="mt-3 text-xs text-muted-foreground">Filed {new Date(c.created_at).toLocaleDateString()}</div>
    </div>
  );
}

function ComplaintForm({ onDone }: { onDone: () => void }) {
  const { user } = useAuth();
  const { lang } = useI18n();
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loc, setLoc] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState("");

  const captureLocation = () => {
    if (!navigator.geolocation) return toast.error("Geolocation not supported");
    navigator.geolocation.getCurrentPosition(
      (p) => { setLoc({ lat: p.coords.latitude, lng: p.coords.longitude }); toast.success("Location captured"); },
      () => toast.error("Could not get location"),
    );
  };

  const submit = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      if (!title.trim() || !description.trim()) throw new Error("Title and description required");
      let photo_url: string | null = null;
      if (file) {
        const ext = file.name.split(".").pop() ?? "jpg";
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { error } = await supabase.storage.from("complaint-photos").upload(path, file);
        if (error) throw error;
        photo_url = path;
      }
      const { error } = await supabase.from("complaints").insert({
        user_id: user.id, category, title: title.trim(), description: description.trim(),
        photo_url, latitude: loc?.lat ?? null, longitude: loc?.lng ?? null, address: address.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success(lang === "en" ? "Complaint filed" : "ఫిర్యాదు ఫైల్ చేయబడింది"); onDone(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="space-y-4 mt-2">
      <div>
        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="ct">Title</Label>
        <Input id="ct" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="cd">Description</Label>
        <Textarea id="cd" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={1500} rows={4} className="mt-1" />
      </div>
      <div>
        <Label htmlFor="ca">Address (optional)</Label>
        <Input id="ca" value={address} onChange={(e) => setAddress(e.target.value)} className="mt-1" />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" onClick={() => document.getElementById("cphoto")?.click()} className="gap-2">
          <Camera className="size-4" /> {file ? file.name.slice(0, 14) : "Photo"}
        </Button>
        <input id="cphoto" type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <Button type="button" variant="outline" onClick={captureLocation} className="gap-2">
          <MapPin className="size-4" /> {loc ? `${loc.lat.toFixed(3)}, ${loc.lng.toFixed(3)}` : "Location"}
        </Button>
      </div>
      <Button onClick={() => submit.mutate()} disabled={submit.isPending} className="w-full gradient-hero text-primary-foreground border-0">
        {submit.isPending && <Loader2 className="size-4 animate-spin" />}
        Submit complaint
      </Button>
    </div>
  );
}
