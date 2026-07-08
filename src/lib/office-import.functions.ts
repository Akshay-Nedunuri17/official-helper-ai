import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Row = z.object({
  name: z.string().min(2),
  department: z.string().min(2),
  address: z.string().min(2),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  hours: z.string().optional().nullable(),
});

const Input = z.object({ rows: z.array(Row).min(1).max(5000) });

export const importOffices = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin",
    });
    if (!isAdmin) throw new Error("Forbidden: admin only");

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Dedupe by (name + city + state) — upsert-style by matching existing rows.
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const row of data.rows) {
      try {
        const { data: existing } = await supabaseAdmin
          .from("offices")
          .select("id")
          .eq("name", row.name)
          .eq("city", row.city)
          .eq("state", row.state)
          .maybeSingle();

        const payload = {
          name: row.name,
          department: row.department,
          address: row.address,
          city: row.city,
          state: row.state,
          pincode: row.pincode ?? null,
          phone: row.phone ?? null,
          email: row.email ?? null,
          latitude: row.latitude ?? null,
          longitude: row.longitude ?? null,
          hours: row.hours ?? null,
        };

        if (existing?.id) {
          const { error } = await supabaseAdmin.from("offices").update(payload).eq("id", existing.id);
          if (error) throw error;
          updated++;
        } else {
          const { error } = await supabaseAdmin.from("offices").insert(payload);
          if (error) throw error;
          inserted++;
        }
      } catch (e) {
        errors.push(`${row.name} (${row.city}): ${(e as Error).message}`);
      }
    }

    return { inserted, updated, failed: errors.length, errors: errors.slice(0, 20) };
  });
