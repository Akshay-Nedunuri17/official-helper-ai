import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, MapPin, Paperclip, ExternalLink, Radio } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { ComplaintTimeline } from "@/components/ComplaintTimeline";
import { toast } from "sonner";

export function AdminComplaintAlerts() {
  const qc = useQueryClient();
  const [live, setLive] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);
  const [newIds, setNewIds] = useState<string[]>([]);

  const { data: complaints = [] } = useQuery({
    queryKey: ["admin-live-complaints"],
    queryFn: async () =>
      (await supabase.from("complaints").select("*").order("created_at", { ascending: false }).limit(15)).data ?? [],
  });

  useEffect(() => {
    const channel = supabase
      .channel("admin-complaints")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "complaints" }, (payload) => {
        const c = payload.new as any;
        setNewIds((ids) => [c.id, ...ids]);
        toast.warning(`New complaint · ${c.category}`, {
          description: `${c.tracking_number} — ${c.title}`,
          action: { label: "View", onClick: () => setSelected(c) },
          duration: 10000,
        });
        qc.invalidateQueries({ queryKey: ["admin-live-complaints"] });
        qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "complaints" }, () => {
        qc.invalidateQueries({ queryKey: ["admin-live-complaints"] });
      })
      .subscribe((status) => setLive(status === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, [qc]);

  return (
    <div className="mt-6 gradient-card border border-border rounded-2xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold flex items-center gap-2">
          <BellRing className="size-4 text-primary" /> Live complaint alerts
        </h2>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <Radio className={`size-3 ${live ? "text-emerald-500" : "text-muted-foreground"}`} />
          {live ? "Listening in real time" : "Connecting…"}
        </Badge>
      </div>

      <ul className="mt-4 space-y-2">
        {complaints.map((c: any) => (
          <li
            key={c.id}
            className={`flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm ${
              newIds.includes(c.id) ? "border-primary bg-primary/5" : "border-border"
            }`}
          >
            <div className="min-w-0">
              <div className="font-semibold truncate">{c.title}</div>
              <div className="text-xs text-muted-foreground">
                <span className="font-mono">{c.tracking_number}</span> · {c.category} ·{" "}
                {new Date(c.created_at).toLocaleString()}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {c.routed_department ?? "Unrouted"}{c.address ? ` · ${c.address}` : ""}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {c.photo_url && <Paperclip className="size-4 text-muted-foreground" aria-label="Has attachment" />}
              <Badge variant="outline" className="capitalize text-xs">{c.status.replace("_", " ")}</Badge>
              <Button size="sm" variant="outline" onClick={() => setSelected(c)}>Details</Button>
            </div>
          </li>
        ))}
        {complaints.length === 0 && <li className="text-sm text-muted-foreground">No complaints yet.</li>}
      </ul>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-auto">
          <DialogHeader><DialogTitle>{selected?.title}</DialogTitle></DialogHeader>
          {selected && <ComplaintDetail c={selected} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ComplaintDetail({ c }: { c: any }) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!c.photo_url) return;
    supabase.storage.from("complaint-photos").createSignedUrl(c.photo_url, 3600).then(({ data }) => {
      if (data?.signedUrl) setPhotoUrl(data.signedUrl);
    });
  }, [c.photo_url]);

  return (
    <div className="space-y-4 text-sm">
      <div className="text-xs text-muted-foreground font-mono">{c.tracking_number} · {c.category}</div>
      <p className="whitespace-pre-line">{c.description}</p>
      {c.address && (
        <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
          <MapPin className="size-3 mt-0.5" /> {c.address}
        </div>
      )}
      {c.latitude && c.longitude && (
        <a
          className="inline-flex items-center gap-1 text-xs text-primary"
          href={`https://www.google.com/maps?q=${c.latitude},${c.longitude}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open location on map <ExternalLink className="size-3" />
        </a>
      )}
      {photoUrl ? (
        <img src={photoUrl} alt="Complaint attachment" className="rounded-lg w-full max-h-72 object-cover" />
      ) : c.photo_url ? (
        <div className="text-xs text-muted-foreground">Loading attachment…</div>
      ) : null}
      <div className="pt-2 border-t border-border">
        <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Timeline</div>
        <ComplaintTimeline complaintId={c.id} />
      </div>
    </div>
  );
}
