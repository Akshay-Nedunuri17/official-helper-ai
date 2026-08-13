import { Link } from "@tanstack/react-router";
import { Home, Search, Sparkles, MapPin, LayoutGrid } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/** Thumb-friendly bottom bar with the 5 most used destinations (mobile only). */
export function MobileNav({ onMore }: { onMore: () => void }) {
  const { t } = useI18n();

  const items = [
    { to: "/", I: Home, label: t("nav_home"), exact: true },
    { to: "/schemes", I: Search, label: t("nav_schemes"), exact: false },
    { to: "/assistant", I: Sparkles, label: t("nav_assistant"), exact: false },
    { to: "/offices", I: MapPin, label: t("nav_offices"), exact: false },
  ];

  return (
    <nav
      aria-label="Primary"
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur-xl pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="grid grid-cols-5">
        {items.map(({ to, I, label, exact }) => (
          <li key={to}>
            <Link
              to={to}
              activeOptions={{ exact }}
              className="flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
              activeProps={{ className: "flex flex-col items-center gap-1 py-2.5 text-[11px] font-semibold text-primary" }}
            >
              <I className="size-5" />
              <span className="truncate max-w-[64px]">{label}</span>
            </Link>
          </li>
        ))}
        <li>
          <button
            type="button"
            onClick={onMore}
            className="w-full flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground"
          >
            <LayoutGrid className="size-5" />
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}
