import { useEffect, useState } from "react";
import { Save, Loader2, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana","Himachal Pradesh",
  "Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha",
  "Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal",
  "Andaman and Nicobar Islands","Chandigarh","Dadra and Nagar Haveli and Daman and Diu","Delhi","Jammu and Kashmir","Ladakh","Lakshadweep","Puducherry",
];

type Profile = {
  full_name: string | null;
  phone: string | null;
  state: string | null;
  district: string | null;
  age: number | null;
  annual_income: number | null;
  occupation: string | null;
  caste_category: string | null;
  gender: string | null;
};

const EMPTY: Profile = {
  full_name: "", phone: "", state: "", district: "", age: null,
  annual_income: null, occupation: "", caste_category: "", gender: "",
};

export function ProfileEditor({ userId }: { userId: string }) {
  const [p, setP] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", userId).maybeSingle();
      if (data) setP({ ...EMPTY, ...data });
      setLoading(false);
    })();
  }, [userId]);

  const update = <K extends keyof Profile>(k: K, v: Profile[K]) => setP((prev) => ({ ...prev, [k]: v }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = {
        ...p,
        age: p.age ? Number(p.age) : null,
        annual_income: p.annual_income ? Number(p.annual_income) : null,
      };
      const { error } = await supabase.from("profiles").update(payload).eq("id", userId);
      if (error) throw error;
      toast.success("Profile saved. The AI will use this to personalize scheme matches.");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save");
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="gradient-card border border-border rounded-2xl p-10 grid place-items-center">
      <Loader2 className="size-5 animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="gradient-card border border-border rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <UserIcon className="size-5 text-primary" />
        <h2 className="text-xl font-bold">Your profile</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">Fill in your details so the AI assistant and eligibility wizard can match you to the right schemes.</p>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name">
          <Input value={p.full_name ?? ""} onChange={(e) => update("full_name", e.target.value)} />
        </Field>
        <Field label="Phone">
          <Input value={p.phone ?? ""} onChange={(e) => update("phone", e.target.value)} inputMode="tel" maxLength={15} />
        </Field>
        <Field label="State">
          <Select value={p.state ?? ""} onValueChange={(v) => update("state", v)}>
            <SelectTrigger><SelectValue placeholder="Select state" /></SelectTrigger>
            <SelectContent className="max-h-64">
              {STATES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="District">
          <Input value={p.district ?? ""} onChange={(e) => update("district", e.target.value)} />
        </Field>
        <Field label="Age">
          <Input type="number" min={0} max={120} value={p.age ?? ""} onChange={(e) => update("age", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Annual income (INR)">
          <Input type="number" min={0} value={p.annual_income ?? ""} onChange={(e) => update("annual_income", e.target.value ? Number(e.target.value) : null)} />
        </Field>
        <Field label="Occupation">
          <Select value={p.occupation ?? ""} onValueChange={(v) => update("occupation", v)}>
            <SelectTrigger><SelectValue placeholder="Select occupation" /></SelectTrigger>
            <SelectContent>
              {["Student","Farmer","Salaried","Self-employed","Unemployed","Retired","Homemaker","Other"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Gender">
          <Select value={p.gender ?? ""} onValueChange={(v) => update("gender", v)}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              {["Male","Female","Other","Prefer not to say"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Caste category">
          <Select value={p.caste_category ?? ""} onValueChange={(v) => update("caste_category", v)}>
            <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
            <SelectContent>
              {["General","OBC","SC","ST","EWS","Minority"].map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Button onClick={save} disabled={saving} className="mt-6 gradient-hero text-primary-foreground border-0 gap-2">
        {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
        Save profile
      </Button>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-wider text-muted-foreground">{label}</Label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
