import { Link } from "@tanstack/react-router";
import { Moon, Sun, Languages, Sparkles, Menu, X, LogOut, Loader2, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";
import { useI18n, LANGUAGES } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export function Header() {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t, translating } = useI18n();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  const links = [
    { to: "/", label: t("nav_home") },
    { to: "/assistant", label: t("nav_assistant") },
    { to: "/schemes", label: t("nav_schemes") },
    { to: "/wizard", label: t("nav_wizard") },
    { to: "/updates", label: t("nav_updates") },
    { to: "/services", label: t("nav_services") },
    { to: "/offices", label: t("nav_offices") },
    { to: "/complaints", label: t("nav_complaints") },
  ];
  if (user) links.push({ to: "/dashboard", label: t("nav_dashboard") });
  if (isAdmin) links.push({ to: "/admin", label: t("nav_admin") });

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="container mx-auto flex items-center gap-4 px-4 h-16">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="size-9 grid place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow">
            <Sparkles className="size-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">{t("appName")}</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-1 ml-6">
          {links.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              activeProps={{ className: "px-3 py-2 rounded-md text-sm font-medium text-foreground bg-secondary" }}
              activeOptions={{ exact: l.to === "/" }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-1.5" aria-label="language">
                {translating ? <Loader2 className="size-4 animate-spin" /> : <Languages className="size-4" />}
                <span className="text-xs font-semibold">{currentLang.native}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="max-h-[70vh] overflow-y-auto w-56">
              <DropdownMenuLabel>Choose language</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {LANGUAGES.map((l) => (
                <DropdownMenuItem key={l.code} onClick={() => setLang(l.code)} className="flex items-center justify-between">
                  <span className="flex flex-col">
                    <span className="text-sm">{l.native}</span>
                    <span className="text-[10px] text-muted-foreground">{l.name}</span>
                  </span>
                  {l.code === lang && <Check className="size-4 text-primary" />}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" onClick={toggle} aria-label="theme">
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>

          {user ? (
            <Button variant="outline" size="sm" onClick={() => supabase.auth.signOut()} className="hidden sm:inline-flex gap-2">
              <LogOut className="size-4" />
              {t("signout")}
            </Button>
          ) : (
            <Link to="/auth" className="hidden sm:block">
              <Button size="sm" className="gradient-hero text-primary-foreground border-0">{t("signin")}</Button>
            </Link>
          )}

          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((o) => !o)}>
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <nav className="container mx-auto px-4 py-2 flex flex-col">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="px-3 py-3 rounded-md text-sm font-medium text-foreground hover:bg-secondary"
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link to="/auth" onClick={() => setOpen(false)} className="px-3 py-3 text-sm font-medium text-primary">
                {t("signin")}
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
