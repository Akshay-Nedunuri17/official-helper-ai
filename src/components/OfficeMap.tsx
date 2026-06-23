import { MapContainer, TileLayer, Marker, Popup, Circle, useMap, useMapEvents } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect } from "react";

const icon = L.icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

const youIcon = L.divIcon({
  className: "",
  html: `<div style="width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid white;box-shadow:0 0 0 2px #2563eb,0 0 12px rgba(37,99,235,.6)"></div>`,
  iconSize: [18, 18], iconAnchor: [9, 9],
});

export type OfficePin = {
  id: string;
  name: string;
  department: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
};

function FitBounds({ offices, user }: { offices: OfficePin[]; user?: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    const pts: [number, number][] = offices.map((o) => [o.latitude, o.longitude]);
    if (user) pts.push(user);
    if (pts.length === 0) return;
    if (pts.length === 1) {
      map.setView(pts[0], 12);
    } else {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 12 });
    }
  }, [offices, user, map]);
  return null;
}

function ClickPicker({ onPick }: { onPick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      if (onPick) onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function OfficeMap({
  offices,
  height = 480,
  userLocation,
  accuracyMeters,
  pickMode = false,
  onPickLocation,
}: {
  offices: OfficePin[];
  height?: number;
  userLocation?: [number, number] | null;
  accuracyMeters?: number | null;
  pickMode?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
}) {
  const center: [number, number] = userLocation ?? (offices.length
    ? [offices[0].latitude, offices[0].longitude]
    : [20.5937, 78.9629]);

  return (
    <div
      className="rounded-2xl overflow-hidden border border-border shadow-elegant relative"
      style={{ height, cursor: pickMode ? "crosshair" : undefined }}
    >
      {pickMode && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-primary text-primary-foreground text-xs font-medium px-3 py-1.5 rounded-full shadow-lg pointer-events-none">
          Tap the map to set your location
        </div>
      )}
      <MapContainer center={center} zoom={5} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <FitBounds offices={offices} user={userLocation ?? null} />
        <ClickPicker onPick={pickMode ? onPickLocation : undefined} />
        {userLocation && (
          <>
            {accuracyMeters && accuracyMeters > 0 && (
              <Circle
                center={userLocation}
                radius={accuracyMeters}
                pathOptions={{ color: "#2563eb", fillColor: "#2563eb", fillOpacity: 0.12, weight: 1 }}
              />
            )}
            <Marker position={userLocation} icon={youIcon}>
              <Popup>
                You are here
                {accuracyMeters ? <div className="text-xs opacity-70">±{Math.round(accuracyMeters)} m accuracy</div> : null}
              </Popup>
            </Marker>
          </>
        )}
        <MarkerClusterGroup chunkedLoading maxClusterRadius={60}>
          {offices.map((o) => (
            <Marker key={o.id} position={[o.latitude, o.longitude]} icon={icon}>
              <Popup>
                <div className="text-sm">
                  <div className="font-semibold">{o.name}</div>
                  <div className="text-xs opacity-70">{o.department}</div>
                  <div className="mt-1">{o.address}, {o.city}</div>
                  {o.distanceKm != null && (
                    <div className="mt-1 text-xs font-medium text-blue-700">
                      {o.distanceKm.toFixed(1)} km away
                    </div>
                  )}
                  <a
                    className="mt-1 inline-block text-blue-600 underline"
                    target="_blank" rel="noreferrer"
                    href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`}
                  >Directions</a>
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>
      </MapContainer>
    </div>
  );
}
