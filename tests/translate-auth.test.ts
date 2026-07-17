import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const SOURCE = readFileSync(
  resolve(process.cwd(), "src/lib/translate.functions.ts"),
  "utf8",
);

/**
 * Static-analysis regression tests. These do NOT hit the network; instead they
 * assert that the translate server function is wired up so that unauthenticated
 * callers are rejected before the handler runs, and that the handler cannot be
 * shipped without the auth middleware.
 *
 * If someone deletes `requireSupabaseAuth`, these tests fail — and the
 * `scripts/check-translate-auth.mjs` guard fails the CI build for the same
 * reason.
 */
describe("translateDict security posture", () => {
  it("imports requireSupabaseAuth from the auth middleware module", () => {
    expect(SOURCE).toMatch(
      /import\s*\{[^}]*\brequireSupabaseAuth\b[^}]*\}\s*from\s*["']@\/integrations\/supabase\/auth-middleware["']/,
    );
  });

  it("attaches requireSupabaseAuth middleware to the exported server fn", () => {
    expect(SOURCE).toMatch(
      /translateDict\s*=\s*createServerFn\s*\(\s*\{[^}]*\}\s*\)\s*\.middleware\s*\(\s*\[[^\]]*\brequireSupabaseAuth\b[^\]]*\]\s*\)/s,
    );
  });

  it("validates input with Zod before the handler runs", () => {
    expect(SOURCE).toMatch(/\.inputValidator\s*\(/);
    // Cap on entries and per-string length must be enforced server-side.
    expect(SOURCE).toMatch(/\.max\(\s*200\s*\)|<=\s*200/);
    expect(SOURCE).toMatch(/\.max\(\s*500\s*\)/);
  });

  it("does not export an unauthenticated variant of translateDict", () => {
    // There must be exactly one createServerFn call in this file, and it must
    // be the middleware-protected one above. This catches a footgun where
    // someone adds a second "public" export beside the protected one.
    const createServerFnCount = (SOURCE.match(/createServerFn\s*\(/g) ?? []).length;
    expect(createServerFnCount).toBe(1);
  });

  it("reads LOVABLE_API_KEY only inside the handler, never at module scope", () => {
    // Split the module: everything before `.handler(` is "module scope".
    const handlerIdx = SOURCE.indexOf(".handler(");
    expect(handlerIdx).toBeGreaterThan(-1);
    const moduleScope = SOURCE.slice(0, handlerIdx);
    expect(moduleScope).not.toMatch(/process\.env\.LOVABLE_API_KEY/);
  });
});
