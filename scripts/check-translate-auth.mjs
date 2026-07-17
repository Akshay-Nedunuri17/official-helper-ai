#!/usr/bin/env node
// CI guard: fail if the translate server function ever loses its auth middleware.
// Run with `node scripts/check-translate-auth.mjs` in CI (see .github/workflows/security-guard.yml).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const target = resolve(__dirname, "..", "src", "lib", "translate.functions.ts");

let source;
try {
  source = readFileSync(target, "utf8");
} catch (e) {
  console.error(`[security-guard] cannot read ${target}:`, e.message);
  process.exit(2);
}

const failures = [];

// 1. requireSupabaseAuth must be imported from the auth-middleware module.
if (!/from\s+["']@\/integrations\/supabase\/auth-middleware["']/.test(source)) {
  failures.push("translate.functions.ts must import from '@/integrations/supabase/auth-middleware'.");
}
if (!/\brequireSupabaseAuth\b/.test(source)) {
  failures.push("translate.functions.ts must reference `requireSupabaseAuth`.");
}

// 2. The middleware must actually be attached to the translateDict server fn.
//    Accept whitespace/newlines between .middleware([ ... requireSupabaseAuth ... ]).
const middlewareOnFn =
  /translateDict\s*=\s*createServerFn\s*\(\s*\{[^}]*\}\s*\)\s*\.middleware\s*\(\s*\[[^\]]*\brequireSupabaseAuth\b[^\]]*\]\s*\)/s;
if (!middlewareOnFn.test(source)) {
  failures.push(
    "translateDict must chain `.middleware([requireSupabaseAuth])` immediately after createServerFn(...).",
  );
}

if (failures.length > 0) {
  console.error("\n[security-guard] translate endpoint is not protected:\n");
  for (const f of failures) console.error(" - " + f);
  console.error(
    "\nRefusing to build. Restore the requireSupabaseAuth middleware on translateDict before merging.\n",
  );
  process.exit(1);
}

console.log("[security-guard] translate endpoint auth check: OK");
