import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Profile = z.object({
  age: z.number().int().min(0).max(120).optional(),
  income: z.string().max(60).optional(),       // e.g. "Below ₹2L/yr"
  occupation: z.string().max(80).optional(),   // e.g. "Farmer", "Student"
  state: z.string().max(60).optional(),
  gender: z.string().max(20).optional(),
  category: z.string().max(30).optional(),     // SC/ST/OBC/General/Minority
}).optional();

const Input = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  lang: z.string().min(2).max(8).default("en"),
  langName: z.string().min(2).max(40).optional(),
  profile: Profile,
});


export const chatAI = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const userState = data.profile?.state;
    // Prioritise: state-specific → central → others. Pull state schemes first, then top central.
    const cols = "name_en,category,ministry,eligibility_en,benefits_en,documents,apply_url,state,district,gender,min_age,max_age,income_limit,occupation";
    const stateQ = userState
      ? supabaseAdmin.from("schemes").select(cols).eq("state", userState).limit(40)
      : null;
    const centralQ = supabaseAdmin.from("schemes").select(cols).eq("state", "All India").limit(60);
    const [stateRes, centralRes] = await Promise.all([stateQ, centralQ]);
    const stateSchemes = (stateRes?.data ?? []) as any[];
    const centralSchemes = (centralRes?.data ?? []) as any[];

    const fmt = (s: any, i: number, tag: string) =>
      `${i + 1}. [${tag}] ${s.name_en} (${s.category}${s.ministry ? ", " + s.ministry : ""}, ${s.state}${s.district ? " · " + s.district : ""}) — Eligibility: ${s.eligibility_en ?? "—"}. Benefits: ${s.benefits_en ?? "—"}. Docs: ${(s.documents ?? []).join(", ")}. Apply: ${s.apply_url ?? "—"}`;
    const knowledge = [
      ...stateSchemes.map((s, i) => fmt(s, i, `STATE:${userState}`)),
      ...centralSchemes.map((s, i) => fmt(s, stateSchemes.length + i, "CENTRAL")),
    ].join("\n");
    

    const p = data.profile;
    const profileBlock = p && Object.values(p).some(Boolean)
      ? `\nUSER PROFILE (use this to personalize recommendations):
- Age: ${p.age ?? "—"}
- Gender: ${p.gender ?? "—"}
- Occupation: ${p.occupation ?? "—"}
- Annual income: ${p.income ?? "—"}
- State: ${p.state ?? "—"}
- Category: ${p.category ?? "—"}
Prioritize schemes whose eligibility matches these attributes (state-specific schemes first when state matches, age-bound schemes when age fits, women-only schemes only if female, BPL/income schemes when low income, occupation-relevant schemes like farmer/student/artisan).`
      : "";

    const system = `You are JanSahayak, a friendly AI assistant helping Indian citizens find government schemes, services, eligibility, required documents, and office procedures.
- Reply in ${data.lang === "te" ? "Telugu (తెలుగు)" : "clear English"}.
- Be concise. Use markdown: bold scheme names, bullet points, short paragraphs.
- RANKING ORDER (strict): when recommending schemes, list STATE-specific schemes for the user's state first, then CENTRAL (All India) schemes, then mention others only if directly relevant.
- For each recommended scheme, include: 1) why it fits the user (state/age/income/occupation match), 2) key benefit, 3) required documents (compact), 4) official apply link.
- Recommend the top 3-5 most relevant schemes.
- If you don't know, say so honestly and point to india.gov.in or the relevant ministry.
${profileBlock}

KNOWLEDGE BASE (real schemes in this app — STATE entries are prioritised):
${knowledge}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [{ role: "system", content: system }, ...data.messages],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please add credits to continue.");
      throw new Error(`AI error: ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content ?? "Sorry, I couldn't respond.";
    return { reply };
  });
