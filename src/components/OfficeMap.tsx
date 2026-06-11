import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix default icon paths (Leaflet's default points to broken CDN paths in bundlers)
const icon = L.icon({
  iconUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://cdn.jsdelivr.net/npm/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41],
});

export type OfficePin = {
  id: string;
  name: string;
  department: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
};

export function OfficeMap({ offices, height = 420 }: { offices: OfficePin[]; height?: number }) {
  const center: [number, number] = offices.length
    ? [offices[0].latitude, offices[0].longitude]
    : [20.5937, 78.9629]; // India centroid

  return (
    <div className="rounded-2xl overflow-hidden border border-border shadow-elegant" style={{ height }}>
      <MapContainer center={center} zoom={offices.length === 1 ? 13 : 5} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {offices.map((o) => (
          <Marker key={o.id} position={[o.latitude, o.longitude]} icon={icon}>
            <Popup>
              <div className="text-sm">
                <div className="font-semibold">{o.name}</div>
                <div className="text-xs opacity-70">{o.department}</div>
                <div className="mt-1">{o.address}, {o.city}</div>
                <a
                  className="mt-1 inline-block text-blue-600 underline"
                  target="_blank" rel="noreferrer"
                  href={`https://www.google.com/maps/dir/?api=1&destination=${o.latitude},${o.longitude}`}
                >Directions</a>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
