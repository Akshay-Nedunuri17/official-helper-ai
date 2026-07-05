import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Search, FileText, Clock, IndianRupee, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/services")({ component: Services });

function Services() {
  const { t, lang } = useI18n();
  const [q, setQ] = useState("");
  const { data = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => (await supabase.from("services").select("*").order("name_en")).data ?? [],
  });

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
