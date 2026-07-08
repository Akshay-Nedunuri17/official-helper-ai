export type SavedLocation = {
  lat: number;
  lng: number;
  accuracy: number | null;
  label: string;
  source: "gps" | "manual" | "map";
  savedAt: number;
};

export const SAVED_LOCATION_KEY = "jansahayak_last_location_v1";

export function readSavedLocation(): SavedLocation | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(SAVED_LOCATION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedLocation>;
    if (typeof parsed.lat !== "number" || typeof parsed.lng !== "number") return null;
    if (parsed.lat < -90 || parsed.lat > 90 || parsed.lng < -180 || parsed.lng > 180) return null;
    return {
      lat: parsed.lat,
      lng: parsed.lng,
      accuracy: typeof parsed.accuracy === "number" ? parsed.accuracy : null,
      label: parsed.label || "Saved location",
      source: parsed.source === "gps" || parsed.source === "manual" || parsed.source === "map" ? parsed.source : "manual",
      savedAt: typeof parsed.savedAt === "number" ? parsed.savedAt : Date.now(),
    };
  } catch {
    return null;
  }
}

export function saveLocation(location: Omit<SavedLocation, "savedAt">) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SAVED_LOCATION_KEY, JSON.stringify({ ...location, savedAt: Date.now() }));
  } catch {}
}

export function clearSavedLocation() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SAVED_LOCATION_KEY);
  } catch {}
}

export function haversineKm(a: [number, number], b: [number, number]) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
