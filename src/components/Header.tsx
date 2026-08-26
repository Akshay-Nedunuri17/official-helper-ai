import { Link } from "@tanstack/react-router";
import { Moon, Sun, Languages, Sparkles, Menu, X, LogOut, Loader2, Check, ChevronDown } from "lucide-react";
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
import { NotificationBell } from "@/components/NotificationBell";
import { MobileNav } from "@/components/MobileNav";

export function Header() {
  const { theme, toggle } = useTheme();
  const { lang, setLang, t, translating } = useI18n();
  const { user, isAdmin } = useAuth();
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find((l) => l.code === lang) ?? LANGUAGES[0];

  // Only the few things most people come for stay in the top bar.
  const primary = [
    { to: "/schemes", label: t("nav_schemes"), hint: "Find schemes you qualify for" },
    { to: "/assistant", label: t("nav_assistant"), hint: "Ask questions in your language" },
    { to: "/services", label: t("nav_services"), hint: "Certificates, licences, documents" },
    { to: "/offices", label: t("nav_offices"), hint: "Nearest government offices" },
  ];

  // Everything else is grouped so the nav never feels crowded.
  const more = [
    { to: "/wizard", label: t("nav_wizard"), hint: "Answer 6 questions, get matches" },
    { to: "/updates", label: t("nav_updates"), hint: "New and trending schemes" },
    { to: "/complaints", label: t("nav_complaints"), hint: "Report a civic issue" },
    { to: "/track", label: t("nav_track"), hint: "Check status with your number" },
    { to: "/helplines", label: t("nav_helplines"), hint: "Toll-free government numbers" },
  ];
  if (user) more.push({ to: "/dashboard", label: t("nav_dashboard"), hint: "Saved schemes and profile" });
  if (isAdmin) more.push({ to: "/admin", label: t("nav_admin"), hint: "Platform analytics" });

  const allLinks = [{ to: "/", label: t("nav_home"), hint: "Start here" }, ...primary, ...more];

  return (
    <>
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-background/85 border-b border-border">
        <div className="container mx-auto flex items-center gap-4 px-4 h-16">
          <Link to="/" className="flex items-center gap-2 shrink-0" aria-label={t("appName")}>
            <div className="size-9 grid place-items-center rounded-xl gradient-hero text-primary-foreground shadow-glow">
              <Sparkles className="size-5" />
            </div>
            <span className="font-display font-bold text-lg tracking-tight">{t("appName")}</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1 ml-6" aria-label="Main">
            {primary.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                activeProps={{ className: "px-3 py-2 rounded-md text-sm font-semibold text-foreground bg-secondary" }}
              >
                {l.label}
              </Link>
            ))}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1 text-muted-foreground font-medium">
                  {t("nav_more")} <ChevronDown className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-72">
                <DropdownMenuLabel>More on JanSahayak</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {more.map((l) => (
                  <DropdownMenuItem key={l.to} asChild>
                    <Link to={l.to} className="flex flex-col items-start gap-0.5 cursor-pointer">
                      <span className="text-sm font-medium">{l.label}</span>
                      <span className="text-xs text-muted-foreground">{l.hint}</span>
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-1.5" aria-label="Change language">
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

            <NotificationBell />

            <Button variant="ghost" size="icon" onClick={toggle} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>
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

            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              onClick={() => setOpen((o) => !o)}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="lg:hidden border-t border-border bg-background max-h-[70vh] overflow-y-auto">
            <nav className="container mx-auto px-4 py-3 flex flex-col" aria-label="All pages">
              {allLinks.map((l) => (
                <Link
                  key={l.to}
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="px-3 py-3 rounded-lg hover:bg-secondary"
                >
                  <div className="text-sm font-semibold">{l.label}</div>
                  <div className="text-xs text-muted-foreground">{l.hint}</div>
                </Link>
              ))}
              {user ? (
                <button
                  onClick={() => { setOpen(false); void supabase.auth.signOut(); }}
                  className="mt-2 px-3 py-3 text-left text-sm font-semibold text-destructive"
                >
                  {t("signout")}
                </button>
              ) : (
                <Link to="/auth" onClick={() => setOpen(false)} className="mt-2 px-3 py-3 text-sm font-semibold text-primary">
                  {t("signin")}
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>

      <MobileNav onMore={() => setOpen((o) => !o)} />
    </>
  );
}
