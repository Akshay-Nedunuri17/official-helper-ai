import { useI18n } from "@/lib/i18n";

export function Footer() {
  const { t } = useI18n();
  return (
    <footer className="border-t border-border mt-20">
      <div className="container mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} {t("appName")} — {t("tagline")}</p>
        <p className="text-xs">Not an official government portal. Information is sourced for guidance only.</p>
      </div>
    </footer>
  );
}
