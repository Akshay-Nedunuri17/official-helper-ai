import { useEffect, useState, type ReactElement } from "react";
import type { OfficePin } from "./OfficeMap";

type OfficeMapProps = {
  offices: OfficePin[];
  height?: number;
  userLocation?: [number, number] | null;
  accuracyMeters?: number | null;
  pickMode?: boolean;
  onPickLocation?: (lat: number, lng: number) => void;
};

export function ClientOfficeMap(props: OfficeMapProps) {
  const [MapComponent, setMapComponent] = useState<null | ((props: OfficeMapProps) => ReactElement)>(null);

  useEffect(() => {
    let mounted = true;
    import("./OfficeMap").then((module) => {
      if (mounted) setMapComponent(() => module.OfficeMap);
    });
    return () => { mounted = false; };
  }, []);

  if (!MapComponent) {
    return (
      <div
        className="rounded-2xl border border-border grid place-items-center text-muted-foreground"
        style={{ height: props.height ?? 480 }}
      >
        Loading map…
      </div>
    );
  }

  return <MapComponent {...props} />;
}
