import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  tracking: z
    .string()
    .trim()
    .min(4)
    .max(24)
    .regex(/^[A-Za-z]{2}-[A-Za-z0-9]{4,20}$/, "Invalid tracking number format"),
});

export const trackComplaint = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows, error } = await supabaseAdmin.rpc("get_complaint_status", {
      _tracking: data.tracking,
    });
    if (error) {
      console.error("track lookup failed", error);
      throw new Error("Lookup failed. Please try again.");
    }
    const row = Array.isArray(rows) ? rows[0] : rows;
    return { complaint: row ?? null };
  });
