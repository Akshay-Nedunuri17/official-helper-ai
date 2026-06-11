import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  messages: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() })),
  lang: z.enum(["en", "te"]).default("en"),
});

export const chatAI = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Pull a compact snapshot of schemes so the model can reference real data.
    const { data: schemes } = await supabaseAdmin
      .from("schemes")
      .select("name_en,category,ministry,eligibility_en,benefits_en,documents,apply_url,state")
      .limit(50);

    const knowledge = (schemes ?? []).map((s, i) =>
      `${i + 1}. ${s.name_en} [${s.category}, ${s.ministry ?? ""}, ${s.state}] — Eligibility: ${s.eligibility_en ?? "—"}. Benefits: ${s.benefits_en ?? "—"}. Docs: ${(s.documents ?? []).join(", ")}. Apply: ${s.apply_url ?? "—"}`
    ).join("\n");

    const system = `You are JanSahayak, a friendly AI assistant helping Indian citizens find government schemes, services, eligibility, required documents, and office procedures.
- Reply in ${data.lang === "te" ? "Telugu (తెలుగు)" : "clear English"}.
- Be concise, use bullet points, mention exact eligibility, documents, and official apply links when relevant.
- If user describes their situation, recommend the most relevant schemes from the knowledge below.
- If you don't know, say so honestly and suggest the official portal (india.gov.in or relevant ministry).

KNOWLEDGE BASE (real schemes available in this app):
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
