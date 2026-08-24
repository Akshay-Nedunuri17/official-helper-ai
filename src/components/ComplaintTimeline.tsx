import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, Send, Building2, FileText, Landmark, MessageSquare, Circle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const ICONS: Record<string, any> = {
  filed: FileText,
  routed: Building2,
  forwarded: Send,
  portal: Landmark,
  response: MessageSquare,
  status: CheckCircle2,
};

export function ComplaintTimeline({ complaintId }: { complaintId: string }) {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["complaint-events", complaintId],
    queryFn: async () =>
      (
        await supabase
          .from("complaint_events")
          .select("*")
          .eq("complaint_id", complaintId)
          .order("created_at", { ascending: true })
      ).data ?? [],
  });

  if (isLoading) return <div className="text-xs text-muted-foreground">Loading history…</div>;
  if (events.length === 0) return <div className="text-xs text-muted-foreground">No updates recorded yet.</div>;

  return (
    <ol className="relative space-y-4 border-l border-border pl-5">
      {events.map((e) => {
        const I = ICONS[e.event_type] ?? Circle;
        return (
          <li key={e.id} className="relative">
            <span className="absolute -left-[29px] grid size-6 place-items-center rounded-full border border-border bg-background text-primary">
              <I className="size-3" aria-hidden="true" />
            </span>
            <div className="text-sm font-semibold leading-tight">{e.title}</div>
            {e.detail && <p className="mt-0.5 text-xs text-muted-foreground whitespace-pre-line">{e.detail}</p>}
            <div className="mt-0.5 text-[11px] text-muted-foreground">
              {new Date(e.created_at).toLocaleString()}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
