import { useEffect, useState } from "react";
import { Bell, Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Prefs = {
  trending_schemes: boolean;
  complaint_updates: boolean;
  announcements: boolean;
};

const DEFAULTS: Prefs = {
  trending_schemes: true,
  complaint_updates: true,
  announcements: true,
};

const ITEMS: { key: keyof Prefs; title: string; desc: string }[] = [
  { key: "trending_schemes", title: "Trending schemes", desc: "Alert me when new trending government schemes are added." },
  { key: "complaint_updates", title: "Complaint updates", desc: "Notify me when the status of my complaint changes." },
  { key: "announcements", title: "Announcements", desc: "General platform news and important updates." },
];

export function NotificationPreferences({ userId }: { userId: string }) {
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("profiles")
        .select("notification_prefs")
        .eq("id", userId)
        .maybeSingle();
      const p = (data as any)?.notification_prefs;
      if (p && typeof p === "object") setPrefs({ ...DEFAULTS, ...p });
      setLoading(false);
    })();
  }, [userId]);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ notification_prefs: prefs } as any)
      .eq("id", userId);
    setSaving(false);
    if (error) toast.error(error.message);
    else toast.success("Notification preferences saved");
  };

  return (
    <div className="gradient-card border border-border rounded-2xl p-6">
      <h2 className="font-bold flex items-center gap-2">
        <Bell className="size-4 text-primary" /> Notification preferences
      </h2>
      <p className="text-sm text-muted-foreground mt-1">Choose which events you want to be notified about.</p>

      {loading ? (
        <div className="py-8 grid place-items-center"><Loader2 className="size-4 animate-spin text-muted-foreground" /></div>
      ) : (
        <div className="mt-5 space-y-4">
          {ITEMS.map((item) => (
            <div key={item.key} className="flex items-start justify-between gap-4 border-b border-border pb-4 last:border-b-0 last:pb-0">
              <div className="min-w-0">
                <Label htmlFor={`pref-${item.key}`} className="font-medium">{item.title}</Label>
                <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
              </div>
              <Switch
                id={`pref-${item.key}`}
                checked={prefs[item.key]}
                onCheckedChange={(v) => setPrefs((p) => ({ ...p, [item.key]: v }))}
              />
            </div>
          ))}
          <Button onClick={save} disabled={saving} className="gap-2 mt-2">
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save preferences
          </Button>
        </div>
      )}
    </div>
  );
}
