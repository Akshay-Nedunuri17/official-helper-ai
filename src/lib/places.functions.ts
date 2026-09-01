import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const inputSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  query: z.string().trim().min(2).max(80).optional(),
  radiusMeters: z.number().int().min(500).max(50000).default(15000),
});

export type LivePlace = {
  id: string;
  name: string;
  department: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  rating?: number | null;
  openNow?: boolean | null;
};

// Small in-memory cache (per worker instance) to avoid repeat Google billing.
const cache = new Map<string, { at: number; data: LivePlace[] }>();
const TTL_MS = 10 * 60 * 1000;

export const searchNearbyGovCenters = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<LivePlace[]> => {
    const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
    const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
    if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps connector is not configured.");
    }

    const textQuery =
      (data.query && data.query.length >= 2 ? data.query : "government service center") +
      " near me";

    // round coords so nearby requests share cache entries
    const key = [
      data.latitude.toFixed(2),
      data.longitude.toFixed(2),
      data.radiusMeters,
      textQuery.toLowerCase(),
    ].join("|");
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

    const res = await fetch("https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
        "Content-Type": "application/json",
        "X-Goog-FieldMask":
          "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.primaryTypeDisplayName,places.currentOpeningHours.openNow,places.addressComponents",
      },
      body: JSON.stringify({
        textQuery,
        maxResultCount: 15,
        locationBias: {
          circle: {
            center: { latitude: data.latitude, longitude: data.longitude },
            radius: data.radiusMeters,
          },
        },
      }),
    });

    if (res.status === 403) {
      const details: Array<{ reason?: string }> = ((await res.json()) as any)?.error?.details ?? [];
      const reason = details.find((d) => d.reason)?.reason;
      if (reason === "API_KEY_HTTP_REFERRER_BLOCKED") {
        throw new Error(
          'Google Maps server key is referrer-restricted. In Google Cloud Console, set the server key\'s application restrictions to "None" or "IP addresses".',
        );
      }
      if (reason === "API_KEY_SERVICE_BLOCKED") {
        throw new Error(
          "Google Maps server key does not allow the Places API. Add it to the server key's allowed-APIs list.",
        );
      }
      throw new Error("Google Maps request was denied (403).");
    }

    if (!res.ok) {
      const body = await res.text();
      console.error(`[places] gateway failed [${res.status}]: ${body}`);
      throw new Error(`Places lookup failed [${res.status}]: ${body}`);
    }

    const json = (await res.json()) as any;
    const places: LivePlace[] = (json.places ?? []).map((p: any) => {
      const city =
        (p.addressComponents ?? []).find((c: any) =>
          (c.types ?? []).includes("locality"),
        )?.longText ??
        (p.addressComponents ?? []).find((c: any) =>
          (c.types ?? []).includes("administrative_area_level_2"),
        )?.longText ??
        "";
      return {
        id: `g_${p.id}`,
        name: p.displayName?.text ?? "Government office",
        department: p.primaryTypeDisplayName?.text ?? "Google Maps result",
        address: p.formattedAddress ?? "",
        city,
        latitude: p.location?.latitude,
        longitude: p.location?.longitude,
        rating: p.rating ?? null,
        openNow: p.currentOpeningHours?.openNow ?? null,
      };
    }).filter((p: LivePlace) => typeof p.latitude === "number" && typeof p.longitude === "number");

    cache.set(key, { at: Date.now(), data: places });
    return places;
  });

/* ------------------------------------------------------------------ *
 * All-India search: any city / district / pincode, any office category
 * ------------------------------------------------------------------ */

export const OFFICE_CATEGORIES: Record<string, string[]> = {
  all: [
    "MeeSeva / CSC common service centre",
    "government office",
    "RTO regional transport office",
    "district collector office",
    "government hospital",
    "post office",
  ],
  csc: ["MeeSeva center", "Common Service Centre CSC", "e-Seva citizen service centre"],
  rto: ["RTO regional transport office", "transport department office"],
  collector: ["district collector office", "tehsildar mandal revenue office"],
  municipal: ["municipal corporation office", "gram panchayat office"],
  hospital: ["government hospital", "primary health centre PHC"],
  police: ["police station"],
  post: ["post office", "head post office"],
  aadhaar: ["Aadhaar enrolment centre", "UIDAI Aadhaar seva kendra"],
  passport: ["Passport Seva Kendra", "post office passport seva kendra"],
  employment: ["employment exchange office", "district industries centre"],
  bank: ["nationalised bank branch", "India Post Payments Bank"],
};

const areaSchema = z.object({
  area: z.string().trim().min(2).max(80).optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  category: z.string().trim().max(30).default("all"),
});

export type AreaSearchResult = {
  center: { latitude: number; longitude: number; label: string } | null;
  places: LivePlace[];
};

const areaCache = new Map<string, { at: number; data: AreaSearchResult }>();

function gatewayHeaders() {
  const LOVABLE_API_KEY = process.env["LOVABLE_API_KEY"];
  const GOOGLE_MAPS_API_KEY = process.env["GOOGLE_MAPS_API_KEY"];
  if (!LOVABLE_API_KEY || !GOOGLE_MAPS_API_KEY) {
    throw new Error("Google Maps connector is not configured.");
  }
  return {
    Authorization: `Bearer ${LOVABLE_API_KEY}`,
    "X-Connection-Api-Key": GOOGLE_MAPS_API_KEY,
    "Content-Type": "application/json",
  };
}

function mapPlaces(json: any): LivePlace[] {
  return ((json?.places ?? []) as any[])
    .map((p) => {
      const comps = p.addressComponents ?? [];
      const city =
        comps.find((c: any) => (c.types ?? []).includes("locality"))?.longText ??
        comps.find((c: any) => (c.types ?? []).includes("administrative_area_level_2"))?.longText ??
        "";
      return {
        id: `g_${p.id}`,
        name: p.displayName?.text ?? "Government office",
        department: p.primaryTypeDisplayName?.text ?? "Government office",
        address: p.formattedAddress ?? "",
        city,
        latitude: p.location?.latitude,
        longitude: p.location?.longitude,
        rating: p.rating ?? null,
        openNow: p.currentOpeningHours?.openNow ?? null,
      } as LivePlace;
    })
    .filter((p) => typeof p.latitude === "number" && typeof p.longitude === "number");
}

export const searchGovOfficesInArea = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => areaSchema.parse(data))
  .handler(async ({ data }): Promise<AreaSearchResult> => {
    const headers = gatewayHeaders();
    const key = `${(data.area ?? "").toLowerCase()}|${data.latitude?.toFixed(2)}|${data.longitude?.toFixed(2)}|${data.category}`;
    const hit = areaCache.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.data;

    let center: AreaSearchResult["center"] = null;

    if (data.area) {
      const geo = await fetch(
        `https://connector-gateway.lovable.dev/google_maps/maps/api/geocode/json?address=${encodeURIComponent(
          data.area,
        )}&components=country:IN`,
        { headers },
      );
      if (!geo.ok) {
        const body = await geo.text();
        throw new Error(`Location lookup failed [${geo.status}]: ${body}`);
      }
      const gj = (await geo.json()) as any;
      const first = gj?.results?.[0];
      if (!first) throw new Error(`Could not find "${data.area}" in India. Try a city, district or pincode.`);
      center = {
        latitude: first.geometry.location.lat,
        longitude: first.geometry.location.lng,
        label: first.formatted_address,
      };
    } else if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      center = { latitude: data.latitude, longitude: data.longitude, label: "Your location" };
    } else {
      throw new Error("Provide a city, district or pincode.");
    }

    const queries = OFFICE_CATEGORIES[data.category] ?? OFFICE_CATEGORIES["all"]!;

    const results = await Promise.all(
      queries.map(async (q) => {
        const res = await fetch(
          "https://connector-gateway.lovable.dev/google_maps/places/v1/places:searchText",
          {
            method: "POST",
            headers: {
              ...headers,
              "X-Goog-FieldMask":
                "places.id,places.displayName,places.formattedAddress,places.location,places.rating,places.primaryTypeDisplayName,places.currentOpeningHours.openNow,places.addressComponents",
            },
            body: JSON.stringify({
              textQuery: `${q} in ${center!.label}`,
              maxResultCount: 20,
              regionCode: "IN",
              locationBias: {
                circle: {
                  center: { latitude: center!.latitude, longitude: center!.longitude },
                  radius: 30000,
                },
              },
            }),
          },
        );
        if (!res.ok) {
          console.error(`[places] area query failed [${res.status}] ${q}`);
          return [] as LivePlace[];
        }
        return mapPlaces(await res.json());
      }),
    );

    const seen = new Set<string>();
    const places: LivePlace[] = [];
    for (const list of results) {
      for (const p of list) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        places.push(p);
      }
    }

    const out = { center, places };
    areaCache.set(key, { at: Date.now(), data: out });
    return out;
  });
