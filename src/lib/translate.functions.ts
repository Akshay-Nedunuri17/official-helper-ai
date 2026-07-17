import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({
  targetLanguage: z.string().trim().min(2).max(40),
  entries: z
    .record(z.string().min(1).max(80), z.string().min(1).max(500))
    .refine((r) => Object.keys(r).length <= 200, {
      message: "Too many entries (max 200 per request).",
    }),
});

async function writeAuditLog(row: {
  user_id: string;
  target_language: string;
  entries_count: number;
  total_chars: number;
  duration_ms: number;
  status: "ok" | "error";
  error?: string | null;
  ip?: string | null;
  user_agent?: string | null;
}) {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("translate_audit_logs").insert(row);
  } catch (e) {
    // Never let audit failures break the caller.
    console.error("translate audit log failed", e);
  }
}

export const translateDict = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const startedAt = Date.now();
    const userId = context.userId;
    const ip = (() => {
      try {
        return getRequestIP({ xForwardedFor: true }) ?? null;
      } catch {
        return null;
      }
    })();
    const userAgent = (() => {
      try {
        return getRequestHeader("user-agent") ?? null;
      } catch {
        return null;
      }
    })();

    const entries = data.entries;
    const keys = Object.keys(entries);
    const totalChars = keys.reduce((n, k) => n + k.length + (entries[k]?.length ?? 0), 0);

    if (keys.length === 0) {
      await writeAuditLog({
        user_id: userId,
        target_language: data.targetLanguage,
        entries_count: 0,
        total_chars: 0,
        duration_ms: Date.now() - startedAt,
        status: "ok",
        ip,
        user_agent: userAgent,
      });
      return { translations: {} as Record<string, string> };
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) {
      await writeAuditLog({
        user_id: userId,
        target_language: data.targetLanguage,
        entries_count: keys.length,
        total_chars: totalChars,
        duration_ms: Date.now() - startedAt,
        status: "error",
        error: "Missing LOVABLE_API_KEY",
        ip,
        user_agent: userAgent,
      });
      throw new Error("Missing LOVABLE_API_KEY");
    }

    const system = `You are a professional UI localization engine. Translate each English UI string into ${data.targetLanguage} (native script). Keep translations concise, natural, and appropriate for a citizen-services mobile web app. Preserve placeholders like {name}, punctuation, emojis, and proper nouns/product/service-center names exactly as written: "JanSahayak", "MeeSeva", "CSC", "e-Sevai", "Akshaya", "e-Mitra", "Karnataka One", "Sewa Kendra", "Jan Seva Kendra", "Lok Seva", "Lok Mitra", "Antyodaya Saral", "RTO", "Aadhaar", "UIDAI". Return STRICT JSON only: an object mapping the same keys to translated strings. No commentary.`;
    const user = `Translate values into ${data.targetLanguage}. Keys must remain identical.\n\n${JSON.stringify(entries, null, 2)}`;

    try {
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
        const msg =
          res.status === 429
            ? "Rate limit. Try again shortly."
            : res.status === 402
              ? "AI credits exhausted."
              : `Translate error: ${text.slice(0, 200)}`;
        await writeAuditLog({
          user_id: userId,
          target_language: data.targetLanguage,
          entries_count: keys.length,
          total_chars: totalChars,
          duration_ms: Date.now() - startedAt,
          status: "error",
          error: `${res.status}: ${msg}`.slice(0, 500),
          ip,
          user_agent: userAgent,
        });
        throw new Error(msg);
      }

      const json = await res.json();
      const content = json.choices?.[0]?.message?.content ?? "{}";
      let parsed: Record<string, string> = {};
      try {
        parsed = JSON.parse(content);
      } catch {
        const m = content.match(/\{[\s\S]*\}/);
        if (m) parsed = JSON.parse(m[0]);
      }
      const translations: Record<string, string> = {};
      for (const k of keys) translations[k] = typeof parsed[k] === "string" ? parsed[k] : entries[k];

      await writeAuditLog({
        user_id: userId,
        target_language: data.targetLanguage,
        entries_count: keys.length,
        total_chars: totalChars,
        duration_ms: Date.now() - startedAt,
        status: "ok",
        ip,
        user_agent: userAgent,
      });
      return { translations };
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      if (!/Translate error|Rate limit|AI credits/.test(message)) {
        await writeAuditLog({
          user_id: userId,
          target_language: data.targetLanguage,
          entries_count: keys.length,
          total_chars: totalChars,
          duration_ms: Date.now() - startedAt,
          status: "error",
          error: message.slice(0, 500),
          ip,
          user_agent: userAgent,
        });
      }
      throw e;
    }
  });
