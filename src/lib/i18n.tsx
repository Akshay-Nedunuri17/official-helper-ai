import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "te";

const dict = {
  en: {
    appName: "JanSahayak",
    tagline: "Your AI guide to Indian government schemes & services",
    nav_home: "Home",
    nav_assistant: "AI Assistant",
    nav_schemes: "Schemes",
    nav_services: "Services",
    nav_offices: "Offices",
    nav_dashboard: "Dashboard",
    nav_admin: "Admin",
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
    why_2_t: "Bilingual",
    why_2_d: "Full support for English and తెలుగు.",
    why_3_t: "Verified info",
    why_3_d: "Eligibility, documents, fees and official portals in one place.",
  },
  te: {
    appName: "జన్ సహాయక్",
    tagline: "భారత ప్రభుత్వ పథకాలు & సేవలకు మీ AI మార్గదర్శి",
    nav_home: "హోమ్",
    nav_assistant: "AI సహాయకుడు",
    nav_schemes: "పథకాలు",
    nav_services: "సేవలు",
    nav_offices: "కార్యాలయాలు",
    nav_dashboard: "డాష్‌బోర్డ్",
    nav_admin: "అడ్మిన్",
    signin: "సైన్ ఇన్",
    signout: "సైన్ అవుట్",
    signup: "నమోదు",
    google: "Googleతో కొనసాగండి",
    email: "ఇమెయిల్",
    password: "పాస్‌వర్డ్",
    fullname: "పూర్తి పేరు",
    search_placeholder: "పథకాలు, పత్రాలు, అర్హతలను శోధించండి…",
    voice_search: "వాయిస్ శోధన",
    explore: "పథకాలను అన్వేషించండి",
    ask_ai: "AIని అడగండి",
    eligibility: "అర్హత",
    required_docs: "అవసరమైన పత్రాలు",
    benefits: "ప్రయోజనాలు",
    apply_now: "ఇప్పుడే దరఖాస్తు చేయండి",
    save: "సేవ్ చేయండి",
    saved: "సేవ్ అయింది",
    category: "వర్గం",
    all: "అన్నీ",
    favorites: "ఇష్టమైనవి",
    profile: "ప్రొఫైల్",
    no_favorites: "మీరు ఇంకా ఏ పథకాలను సేవ్ చేయలేదు.",
    chat_placeholder: "ఏదైనా అడగండి — ఉదా. 'ఆంధ్ర ప్రదేశ్‌లో రైతుల కోసం పథకాలు'",
    send: "పంపండి",
    procedure: "ప్రక్రియ",
    fee: "ఫీజు",
    processing_time: "ప్రాసెసింగ్ సమయం",
    department: "విభాగం",
    hours: "సమయాలు",
    phone: "ఫోన్",
    address: "చిరునామా",
    admin_only: "అడ్మిన్ ప్రాప్యత మాత్రమే.",
    welcome: "స్వాగతం",
    hero_cta_primary: "పథకాన్ని కనుగొనండి",
    hero_cta_secondary: "AIతో చాట్ చేయండి",
    stats_schemes: "ప్రభుత్వ పథకాలు",
    stats_services: "పౌర సేవలు",
    stats_offices: "కార్యాలయ ప్రదేశాలు",
    why_title: "ప్రతి భారతీయ పౌరుని కోసం నిర్మించబడింది",
    why_1_t: "AI-ఆధారిత ఆవిష్కరణ",
    why_1_d: "మీ పరిస్థితిని వివరించండి; సరిపోలే పథకాలను తక్షణమే పొందండి.",
    why_2_t: "ద్విభాషా",
    why_2_d: "ఇంగ్లీష్ మరియు తెలుగుకు పూర్తి మద్దతు.",
    why_3_t: "ధృవీకరించబడిన సమాచారం",
    why_3_d: "అర్హత, పత్రాలు, ఫీజులు మరియు అధికారిక పోర్టల్‌లు ఒకేచోట.",
  },
} as const;

type Key = keyof typeof dict["en"];

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: Key) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (stored === "en" || stored === "te") setLangState(stored);
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    if (typeof window !== "undefined") localStorage.setItem("lang", l);
  };

  const t = (k: Key) => dict[lang][k] ?? dict.en[k];
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n outside provider");
  return c;
}
