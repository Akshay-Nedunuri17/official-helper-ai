// Shared quick-filter definitions for government service centers across India.
// Each entry maps a friendly label to substrings matched against the department name.
export type CenterType = {
  key: string;
  label: string;
  match: string[]; // case-insensitive substring match against department
  emoji?: string;
};

export const CENTER_TYPES: CenterType[] = [
  { key: "meeseva", label: "MeeSeva", match: ["meeseva", "praja palana"], emoji: "🏛️" },
  { key: "csc", label: "CSC", match: ["csc", "common service", "digital india", "devbhoomi"], emoji: "💻" },
  { key: "esevai", label: "e-Sevai", match: ["e-sevai", "e-seva"], emoji: "📄" },
  { key: "akshaya", label: "Akshaya", match: ["akshaya"], emoji: "🪷" },
  { key: "emitra", label: "e-Mitra", match: ["e-mitra"], emoji: "🤝" },
  { key: "karnatakaone", label: "Karnataka One", match: ["karnataka one"], emoji: "🟡" },
  { key: "sewa", label: "Sewa Kendra", match: ["sewa kendra"], emoji: "🛎️" },
  { key: "janseva", label: "Jan Seva Kendra", match: ["jan seva"], emoji: "🏢" },
  { key: "lokseva", label: "Lok Seva / Lok Mitra", match: ["lok seva", "lok mitra"], emoji: "🧾" },
  { key: "saral", label: "Antyodaya Saral", match: ["antyodaya", "saral"], emoji: "📋" },
  { key: "rto", label: "RTO", match: ["rto", "transport"], emoji: "🚗" },
  { key: "revenue", label: "Revenue / Tahsildar", match: ["revenue", "tahsildar", "collectorate"], emoji: "📜" },
  { key: "municipal", label: "Municipal / ULB", match: ["municipal", "urban local"], emoji: "🏙️" },
  { key: "hospital", label: "Hospital / PHC", match: ["hospital", "phc", "chc", "health"], emoji: "🏥" },
  { key: "aadhaar", label: "Aadhaar / UIDAI", match: ["aadhaar", "uidai"], emoji: "🆔" },
  { key: "passport", label: "Passport", match: ["passport", "external affairs"], emoji: "🛂" },
  { key: "employment", label: "Employment", match: ["employment", "labour"], emoji: "💼" },
  { key: "agriculture", label: "Agriculture", match: ["agriculture"], emoji: "🌾" },
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
