import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { translateDict } from "./translate.functions";

// 22 scheduled languages of India + English
export const LANGUAGES = [
  { code: "en", name: "English", native: "English" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
  { code: "mr", name: "Marathi", native: "मराठी" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ" },
  { code: "ml", name: "Malayalam", native: "മലയാളം" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ" },
  { code: "as", name: "Assamese", native: "অসমীয়া" },
  { code: "mai", name: "Maithili", native: "मैथिली" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ" },
  { code: "ks", name: "Kashmiri", native: "کٲشُر" },
  { code: "ne", name: "Nepali", native: "नेपाली" },
  { code: "kok", name: "Konkani", native: "कोंकणी" },
  { code: "sd", name: "Sindhi", native: "سنڌي" },
  { code: "doi", name: "Dogri", native: "डोगरी" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্" },
  { code: "brx", name: "Bodo", native: "बड़ो" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्" },
] as const;

export type Lang = (typeof LANGUAGES)[number]["code"];

const dict = {
  appName: "JanSahayak",
  tagline: "Your AI guide to Indian government schemes & services",
  nav_home: "Home",
  nav_assistant: "AI Assistant",
  nav_schemes: "Schemes",
  nav_services: "Services",
  nav_offices: "Offices",
  nav_dashboard: "Dashboard",
  nav_admin: "Admin",
  nav_wizard: "Eligibility",
  nav_updates: "Updates",
  nav_complaints: "Complaints",
  signin: "Sign in",
  signout: "Sign out",
  signup: "Sign up",
  google: "Continue with Google",
  email: "Email",
  password: "Password",
  fullname: "Full name",
  search_placeholder: "Search schemes, documents, eligibility…",
  voice_search: "Voice search",
  explore: "Explore schemes",
  ask_ai: "Ask the AI",
  eligibility: "Eligibility",
  required_docs: "Required documents",
  benefits: "Benefits",
  apply_now: "Apply now",
  save: "Save",
  saved: "Saved",
  category: "Category",
  all: "All",
  favorites: "Favorites",
  profile: "Profile",
  no_favorites: "You haven't saved any schemes yet.",
  chat_placeholder: "Ask anything — e.g. 'Schemes for farmers in Andhra Pradesh'",
  send: "Send",
  procedure: "Procedure",
  fee: "Fee",
  processing_time: "Processing time",
  department: "Department",
  hours: "Hours",
  phone: "Phone",
  address: "Address",
  admin_only: "Admin access only.",
  welcome: "Welcome",
  hero_cta_primary: "Find a scheme",
  hero_cta_secondary: "Chat with AI",
  stats_schemes: "Government schemes",
  stats_services: "Civic services",
  stats_offices: "Office locations",
  why_title: "Built for every Indian citizen",
  why_1_t: "AI-powered discovery",
  why_1_d: "Describe your situation; get matched schemes instantly.",
  why_2_t: "Multilingual",
  why_2_d: "Full support for all 22 scheduled Indian languages.",
  why_3_t: "Verified info",
  why_3_d: "Eligibility, documents, fees and official portals in one place.",
  services_office_hint: "Visit your nearest MeeSeva, e-Sevai, CSC, Sewa Kendra, Jan Seva Kendra, or district government office to complete these services. Locations across small towns, tehsils and cities all over India are listed on the",
} as const;

export type Key = keyof typeof dict;

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
  translating: boolean;
}

const Ctx = createContext<I18nCtx | null>(null);

const CACHE_PREFIX = "js_i18n_v2_";
const cacheKey = (lang: Lang) => `${CACHE_PREFIX}${lang}`;

function readCache(lang: Lang): Record<string, string> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(lang));
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, string>;
  } catch {
    return null;
  }
}

function writeCache(lang: Lang, data: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(cacheKey(lang), JSON.stringify(data));
  } catch {}
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");
  const [translations, setTranslations] = useState<Record<string, string> | null>(null);
  const [translating, setTranslating] = useState(false);

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (stored && LANGUAGES.some((l) => l.code === stored)) setLangState(stored);
  }, []);

  useEffect(() => {
    let cancelled = false;
    if (lang === "en") {
      setTranslations(null);
      return;
    }
    const cached = readCache(lang);
    const englishKeys = Object.keys(dict);
    // If cache exists and contains all current keys, use it
    if (cached && englishKeys.every((k) => typeof cached[k] === "string")) {
      setTranslations(cached);
      return;
    }
    const meta = LANGUAGES.find((l) => l.code === lang);
    if (!meta) return;
    setTranslating(true);
    // Merge with any partial cache
    const partial = cached ?? {};
    const missing: Record<string, string> = {};
    for (const k of englishKeys) {
      if (typeof partial[k] !== "string") missing[k] = (dict as Record<string, string>)[k];
    }
    (async () => {
      try {
        const res = await translateDict({ data: { targetLanguage: meta.name, entries: missing } });
        if (cancelled) return;
        const merged = { ...partial, ...res.translations };
        writeCache(lang, merged);
        setTranslations(merged);
      } catch (e) {
        console.warn("i18n translate failed", e);
        if (!cancelled) setTranslations(partial);
      } finally {
        if (!cancelled) setTranslating(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const value = useMemo<I18nCtx>(() => ({
    lang,
    setLang,
    translating,
    t: (k: Key) => {
      if (lang === "en") return dict[k];
      return (translations && translations[k]) || dict[k];
    },
  }), [lang, translations, translating]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
