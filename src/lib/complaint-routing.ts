// Maps a complaint category + location to the right government department,
// office and official grievance portal.

export const COMPLAINT_CATEGORIES = [
  "Roads & Infrastructure",
  "Water Supply",
  "Sanitation",
  "Electricity",
  "Public Health",
  "Education",
  "Corruption",
  "Other",
] as const;

export type ComplaintCategory = (typeof COMPLAINT_CATEGORIES)[number];

type Routing = {
  department: string;
  /** Keywords matched against the `department` / `name` of offices. */
  officeKeywords: string[];
  /** Central escalation portal for this category. */
  portal: { name: string; url: string };
};

export const CATEGORY_ROUTING: Record<string, Routing> = {
  "Roads & Infrastructure": {
    department: "Public Works / Municipal Engineering",
    officeKeywords: ["municipal", "corporation", "public works", "pwd", "panchayat", "ulb"],
    portal: { name: "CPGRAMS (Public Grievance Portal)", url: "https://pgportal.gov.in/" },
  },
  "Water Supply": {
    department: "Water Supply & Sewerage Board",
    officeKeywords: ["water", "municipal", "corporation", "panchayat", "ulb"],
    portal: { name: "CPGRAMS (Public Grievance Portal)", url: "https://pgportal.gov.in/" },
  },
  Sanitation: {
    department: "Municipal Sanitation / Swachh Bharat",
    officeKeywords: ["municipal", "corporation", "sanitation", "health", "panchayat", "ulb"],
    portal: { name: "Swachhata / CPGRAMS", url: "https://pgportal.gov.in/" },
  },
  Electricity: {
    department: "State Electricity Distribution Company (DISCOM)",
    officeKeywords: ["electricity", "discom", "power", "energy"],
    portal: { name: "CPGRAMS (Ministry of Power)", url: "https://pgportal.gov.in/" },
  },
  "Public Health": {
    department: "Health & Family Welfare Department",
    officeKeywords: ["hospital", "health", "phc", "chc", "medical", "aiims"],
    portal: { name: "CPGRAMS (Ministry of Health)", url: "https://pgportal.gov.in/" },
  },
  Education: {
    department: "School / Higher Education Department",
    officeKeywords: ["education", "school", "college", "university", "deo"],
    portal: { name: "CPGRAMS (Ministry of Education)", url: "https://pgportal.gov.in/" },
  },
  Corruption: {
    department: "Anti-Corruption Bureau / Vigilance",
    officeKeywords: ["vigilance", "anti-corruption", "collector", "police"],
    portal: { name: "CVC Complaint Portal", url: "https://portal.cvc.gov.in/" },
  },
  Other: {
    department: "District Collectorate / Grievance Cell",
    officeKeywords: ["collector", "collectorate", "revenue", "tahsildar", "meeseva", "csc"],
    portal: { name: "CPGRAMS (Public Grievance Portal)", url: "https://pgportal.gov.in/" },
  },
};

/** State-specific grievance portals — used in preference to CPGRAMS when known. */
export const STATE_PORTALS: Record<string, { name: string; url: string }> = {
  "andhra pradesh": { name: "AP Spandana", url: "https://spandana.ap.gov.in/" },
  telangana: { name: "Telangana Prajavani", url: "https://prajavani.telangana.gov.in/" },
  "tamil nadu": { name: "TN CM Cell Petition", url: "https://cmcell.tn.gov.in/" },
  karnataka: { name: "Karnataka Janaspandana (IPGRS)", url: "https://ipgrs.karnataka.gov.in/" },
  kerala: { name: "Kerala CMO Public Grievance", url: "https://cmo.kerala.gov.in/grievance/" },
  maharashtra: { name: "Aaple Sarkar Grievance", url: "https://grievances.maharashtra.gov.in/" },
  "uttar pradesh": { name: "UP Jansunwai (IGRS)", url: "https://jansunwai.up.nic.in/" },
  "madhya pradesh": { name: "MP CM Helpline", url: "https://cmhelpline.mp.gov.in/" },
  rajasthan: { name: "Rajasthan Sampark", url: "https://sampark.rajasthan.gov.in/" },
  gujarat: { name: "Gujarat SWAGAT", url: "https://swagat.gujarat.gov.in/" },
  bihar: { name: "Bihar Lok Shikayat Nivaran", url: "https://lokshikayat.bihar.gov.in/" },
  "west bengal": { name: "WB CM Grievance Cell", url: "https://cmo.wb.gov.in/" },
  odisha: { name: "Odisha Mo Sarkar / CM Grievance", url: "https://cmgcorissa.gov.in/" },
  punjab: { name: "Punjab PGRS", url: "https://connect.punjab.gov.in/" },
  haryana: { name: "Haryana CM Window", url: "https://cmoffice.haryana.gov.in/" },
  jharkhand: { name: "Jharkhand CM Jan Samvad", url: "https://cmjharkhand.nic.in/" },
  chhattisgarh: { name: "Chhattisgarh Jan Shikayat", url: "https://cmo.cg.gov.in/" },
  assam: { name: "Assam CM Grievance Cell", url: "https://cmgrievance.assam.gov.in/" },
  uttarakhand: { name: "Uttarakhand CM Helpline", url: "https://cmhelpline.uk.gov.in/" },
  "himachal pradesh": { name: "HP e-Samadhan", url: "https://esamadhan.hp.gov.in/" },
  delhi: { name: "Delhi PGMS", url: "https://pgms.delhi.gov.in/" },
  goa: { name: "Goa Grievance Portal", url: "https://goaonline.gov.in/" },
};

export const CPGRAMS = { name: "CPGRAMS (Public Grievance Portal)", url: "https://pgportal.gov.in/" };

export function routeForCategory(category: string): Routing {
  return CATEGORY_ROUTING[category] ?? CATEGORY_ROUTING["Other"]!;
}

export function portalForState(category: string, state?: string | null) {
  const statePortal = state ? STATE_PORTALS[state.trim().toLowerCase()] : undefined;
  return { state: statePortal ?? null, central: routeForCategory(category).portal };
}

type OfficeLike = {
  id: string;
  name: string;
  department: string;
  address: string;
  city: string;
  state: string;
  email?: string | null;
  phone?: string | null;
};

/** Picks the best matching office for a category within the user's city/state. */
export function pickOffice<T extends OfficeLike>(
  offices: T[],
  category: string,
  city?: string | null,
  state?: string | null,
): T | null {
  const { officeKeywords } = routeForCategory(category);
  const c = city?.trim().toLowerCase();
  const s = state?.trim().toLowerCase();

  const score = (o: T) => {
    const hay = `${o.name} ${o.department}`.toLowerCase();
    let n = 0;
    officeKeywords.forEach((k, i) => {
      if (hay.includes(k)) n += officeKeywords.length - i;
    });
    if (n === 0) return -1;
    if (c && o.city.toLowerCase() === c) n += 40;
    if (s && o.state.toLowerCase() === s) n += 15;
    if (o.email) n += 5;
    return n;
  };

  let best: T | null = null;
  let bestScore = 0;
  for (const o of offices) {
    const sc = score(o);
    if (sc > bestScore) {
      best = o;
      bestScore = sc;
    }
  }
  return best;
}

export function buildForwardEmail(input: {
  tracking: string;
  category: string;
  title: string;
  description: string;
  address?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  citizenEmail?: string | null;
  department: string;
}) {
  const subject = `Citizen grievance ${input.tracking} — ${input.category}: ${input.title}`;
  const lines = [
    `Respected Sir/Madam,`,
    ``,
    `A citizen has reported the following grievance through JanSahayak.`,
    ``,
    `Tracking number : ${input.tracking}`,
    `Department      : ${input.department}`,
    `Category        : ${input.category}`,
    `Subject         : ${input.title}`,
    input.address ? `Location        : ${input.address}` : null,
    input.latitude && input.longitude
      ? `Map             : https://www.google.com/maps?q=${input.latitude},${input.longitude}`
      : null,
    input.citizenEmail ? `Citizen contact : ${input.citizenEmail}` : null,
    ``,
    `Details:`,
    input.description,
    ``,
    `Kindly look into the matter and update the citizen at the contact above.`,
    ``,
    `Regards,`,
    `JanSahayak — Citizen Services Assistant`,
  ].filter(Boolean);
  return { subject, body: lines.join("\n") };
}
