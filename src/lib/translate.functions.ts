import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  targetLanguage: z.string().min(2).max(40), // display name, e.g. "Hindi"
  entries: z.record(z.string(), z.string()), // key -> English source string
});

export const translateDict = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const entries = data.entries;
    const keys = Object.keys(entries);
    if (keys.length === 0) return { translations: {} as Record<string, string> };

    const system = `You are a professional UI localization engine. Translate each English UI string into ${data.targetLanguage} (native script). Keep translations concise, natural, and appropriate for a citizen-services mobile web app. Preserve placeholders like {name}, punctuation, emojis, and proper nouns/product/service-center names exactly as written: "JanSahayak", "MeeSeva", "CSC", "e-Sevai", "Akshaya", "e-Mitra", "Karnataka One", "Sewa Kendra", "Jan Seva Kendra", "Lok Seva", "Lok Mitra", "Antyodaya Saral", "RTO", "Aadhaar", "UIDAI". Return STRICT JSON only: an object mapping the same keys to translated strings. No commentary.`;
    const user = `Translate values into ${data.targetLanguage}. Keys must remain identical.\n\n${JSON.stringify(entries, null, 2)}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("Rate limit. Try again shortly.");
      if (res.status === 402) throw new Error("AI credits exhausted.");
      throw new Error(`Translate error: ${text.slice(0, 200)}`);
    }
    const json = await res.json();
    const content = json.choices?.[0]?.message?.content ?? "{}";
    let parsed: Record<string, string> = {};
    try {
      parsed = JSON.parse(content);
    } catch {
      // try to extract JSON block
      const m = content.match(/\{[\s\S]*\}/);
      if (m) parsed = JSON.parse(m[0]);
    }
    // Fill any missing keys with English fallback
    const translations: Record<string, string> = {};
    for (const k of keys) translations[k] = typeof parsed[k] === "string" ? parsed[k] : entries[k];
    return { translations };
  });
