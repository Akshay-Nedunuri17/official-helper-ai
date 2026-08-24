import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, ExternalLink, Mail, Landmark, CheckCircle2, Phone } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { buildForwardEmail, portalForState, routeForCategory } from "@/lib/complaint-routing";
import { toast } from "sonner";

type Complaint = {
  id: string;
  tracking_number: string;
  category: string;
  title: string;
  description: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  routed_department: string | null;
  routed_email: string | null;
  portal_name: string | null;
  portal_url: string | null;
  portal_reference: string | null;
  portal_submitted_at: string | null;
  forwarded_at: string | null;
};

export function ComplaintHandoff({
  complaint,
  officeState,
  citizenEmail,
}: {
  complaint: Complaint;
  officeState?: string | null;
  citizenEmail?: string | null;
}) {
  const qc = useQueryClient();
  const [reference, setReference] = useState(complaint.portal_reference ?? "");
  const route = routeForCategory(complaint.category);
  const portals = portalForState(complaint.category, officeState);
  const department = complaint.routed_department ?? route.department;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["complaints"] });
    qc.invalidateQueries({ queryKey: ["complaint-events", complaint.id] });
    qc.invalidateQueries({ queryKey: ["dashboard-complaints"] });
  };

  const forward = useMutation({
    mutationFn: async () => {
      const { subject, body } = buildForwardEmail({
        tracking: complaint.tracking_number,
        category: complaint.category,
        title: complaint.title,
        description: complaint.description,
        address: complaint.address,
        latitude: complaint.latitude,
        longitude: complaint.longitude,
        citizenEmail,
        department,
      });
      const to = complaint.routed_email ?? "";
      window.open(
        `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
        "_blank",
      );
      const { error } = await supabase
        .from("complaints")
        .update({ forwarded_at: new Date().toISOString(), forward_status: "sent_by_citizen" })
        .eq("id", complaint.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Email drafted and forwarding recorded in your timeline");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  const markPortal = useMutation({
    mutationFn: async (portalName: string) => {
      const { error } = await supabase
        .from("complaints")
        .update({
          portal_name: portalName,
          portal_reference: reference.trim() || null,
          portal_submitted_at: new Date().toISOString(),
        })
        .eq("id", complaint.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Recorded as submitted on the official portal");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-4">
      <div className="flex items-start gap-2">
        <Building2 className="size-4 mt-0.5 text-primary shrink-0" />
        <div className="text-sm">
          <div className="font-semibold">{department}</div>
          {complaint.routed_email ? (
            <div className="text-xs text-muted-foreground break-all">{complaint.routed_email}</div>
          ) : (
            <div className="text-xs text-muted-foreground">No published email for this office — use the portal below.</div>
          )}
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <Button
          variant="outline"
          size="sm"
          className="gap-2"
          disabled={!complaint.routed_email || forward.isPending}
          onClick={() => forward.mutate()}
        >
          <Mail className="size-4" />
          {complaint.forwarded_at ? "Forward again" : "Forward to department"}
        </Button>
        {portals.state && (
          <Button asChild variant="outline" size="sm" className="gap-2">
            <a href={portals.state.url} target="_blank" rel="noopener noreferrer">
              <Landmark className="size-4" /> {portals.state.name} <ExternalLink className="size-3" />
            </a>
          </Button>
        )}
        <Button asChild variant="outline" size="sm" className="gap-2">
          <a href={portals.central.url} target="_blank" rel="noopener noreferrer">
            <Landmark className="size-4" /> {portals.central.name} <ExternalLink className="size-3" />
          </a>
        </Button>
      </div>

      {complaint.portal_submitted_at ? (
        <div className="flex items-center gap-2 text-xs text-emerald-600">
          <CheckCircle2 className="size-4" />
          Submitted to {complaint.portal_name ?? "the official portal"}
          {complaint.portal_reference ? ` · ref ${complaint.portal_reference}` : ""}
        </div>
      ) : (
        <div className="space-y-2">
          <Label className="text-xs" htmlFor={`ref-${complaint.id}`}>
            Portal reference / registration number (optional)
          </Label>
          <div className="flex gap-2">
            <Input
              id={`ref-${complaint.id}`}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. DOCAF/E/2026/0012345"
              className="h-9"
            />
            <Button
              size="sm"
              disabled={markPortal.isPending}
              onClick={() => markPortal.mutate(portals.state?.name ?? portals.central.name)}
            >
              I submitted it
            </Button>
          </div>
        </div>
      )}

      <p className="text-[11px] text-muted-foreground flex items-start gap-1.5">
        <Phone className="size-3 mt-0.5 shrink-0" />
        JanSahayak stores your complaint and helps you route it. Official action happens only after it reaches the
        department email or the government grievance portal above.
      </p>
    </div>
  );
}
