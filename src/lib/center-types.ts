// Shared quick-filter definitions for government service centers across India.
// Each entry maps a friendly label to substrings matched against the department name.
export type CenterType = {
  key: string;
  label: string;
  labelKey?: string;
  match: string[]; // case-insensitive substring match against department
  emoji?: string;
};

export const CENTER_TYPES: CenterType[] = [
  { key: "meeseva", label: "MeeSeva", labelKey: "center_meeseva", match: ["meeseva", "praja palana"], emoji: "🏛️" },
  { key: "csc", label: "CSC", labelKey: "center_csc", match: ["csc", "common service", "digital india", "devbhoomi"], emoji: "💻" },
  { key: "esevai", label: "e-Sevai", labelKey: "center_esevai", match: ["e-sevai", "e-seva"], emoji: "📄" },
  { key: "akshaya", label: "Akshaya", labelKey: "center_akshaya", match: ["akshaya"], emoji: "🪷" },
  { key: "emitra", label: "e-Mitra", labelKey: "center_emitra", match: ["e-mitra"], emoji: "🤝" },
  { key: "karnatakaone", label: "Karnataka One", labelKey: "center_karnatakaone", match: ["karnataka one"], emoji: "🟡" },
  { key: "sewa", label: "Sewa Kendra", labelKey: "center_sewa", match: ["sewa kendra"], emoji: "🛎️" },
  { key: "janseva", label: "Jan Seva Kendra", labelKey: "center_janseva", match: ["jan seva"], emoji: "🏢" },
  { key: "lokseva", label: "Lok Seva / Lok Mitra", labelKey: "center_lokseva", match: ["lok seva", "lok mitra"], emoji: "🧾" },
  { key: "saral", label: "Antyodaya Saral", labelKey: "center_saral", match: ["antyodaya", "saral"], emoji: "📋" },
  { key: "rto", label: "RTO", labelKey: "center_rto", match: ["rto", "transport"], emoji: "🚗" },
  { key: "revenue", label: "Revenue / Tahsildar", labelKey: "center_revenue", match: ["revenue", "tahsildar", "collectorate"], emoji: "📜" },
  { key: "municipal", label: "Municipal / ULB", labelKey: "center_municipal", match: ["municipal", "urban local"], emoji: "🏙️" },
  { key: "hospital", label: "Hospital / PHC", labelKey: "center_hospital", match: ["hospital", "phc", "chc", "health"], emoji: "🏥" },
  { key: "aadhaar", label: "Aadhaar / UIDAI", labelKey: "center_aadhaar", match: ["aadhaar", "uidai"], emoji: "🆔" },
  { key: "passport", label: "Passport", labelKey: "center_passport", match: ["passport", "external affairs"], emoji: "🛂" },
  { key: "employment", label: "Employment", labelKey: "center_employment", match: ["employment", "labour"], emoji: "💼" },
  { key: "agriculture", label: "Agriculture", labelKey: "center_agriculture", match: ["agriculture"], emoji: "🌾" },
];

// Service-center-like departments used for the "Nearest service centers" section.
export const SERVICE_CENTER_KEYS = [
  "meeseva", "csc", "esevai", "akshaya", "emitra", "karnatakaone",
  "sewa", "janseva", "lokseva", "saral",
];

export function matchesCenter(department: string, ct: CenterType): boolean {
  const d = (department || "").toLowerCase();
  return ct.match.some((m) => d.includes(m));
}

export function isServiceCenter(department: string): boolean {
  return CENTER_TYPES
    .filter((c) => SERVICE_CENTER_KEYS.includes(c.key))
    .some((c) => matchesCenter(department, c));
}
