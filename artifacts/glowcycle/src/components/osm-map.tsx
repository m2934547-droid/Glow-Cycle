import { useEffect, useMemo } from "react";
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap, useMapEvents } from "react-leaflet";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { makeBrandMarkerIcon, type MapTone } from "@/components/map-utils";

export type OsmMarker = {
  id: string;
  position: [number, number];
  title: string;
  description?: string;
  tone?: MapTone;
  active?: boolean;
  label?: string;
  draggable?: boolean;
};

function ViewportController({
  center,
  zoom,
  markers,
  route,
}: {
  center: [number, number];
  zoom: number;
  markers: OsmMarker[];
  route?: Array<[number, number]>;
}) {
  const map = useMap();

  useEffect(() => {
    if (route && route.length > 1) {
      map.fitBounds(route, { padding: [36, 36], maxZoom: 13 });
      return;
    }

    if (markers.length > 1) {
      map.fitBounds(markers.map((marker) => marker.position), { padding: [36, 36], maxZoom: 13 });
      return;
    }

    map.setView(center, zoom);
  }, [center, zoom, markers, map, route]);

  return null;
}

function ClickHandler({ onMapClick }: { onMapClick?: (position: [number, number]) => void }) {
  useMapEvents({
    click(event) {
      onMapClick?.([event.latlng.lat, event.latlng.lng]);
    },
  });

  return null;
}

export function OsmMap({
  center,
  zoom,
  markers = [],
  route,
  selectedPosition,
  selectedLabel,
  onMapClick,
  onSelectedPositionChange,
  className,
}: {
  center: [number, number];
  zoom: number;
  markers?: OsmMarker[];
  route?: Array<[number, number]>;
  selectedPosition?: [number, number] | null;
  selectedLabel?: string;
  onMapClick?: (position: [number, number]) => void;
  onSelectedPositionChange?: (position: [number, number]) => void;
  className?: string;
}) {
  const selectedMarker = useMemo<OsmMarker | null>(() => {
    if (!selectedPosition) return null;
    return {
      id: "selected-location",
      position: selectedPosition,
      title: selectedLabel ?? "Selected location",
      tone: "primary",
      active: true,
      draggable: true,
      label: "Selected",
    };
  }, [selectedPosition, selectedLabel]);

  const routePoints = route ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn("overflow-hidden rounded-[2rem] border border-[#F5DCE7] bg-white shadow-[0_24px_60px_rgba(255,92,168,0.08)]", className)}
    >
      <div className="relative h-full min-h-[360px]">
        <MapContainer center={center} zoom={zoom} className="h-full min-h-[360px] w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <ClickHandler onMapClick={onMapClick} />
          <ViewportController center={center} zoom={zoom} markers={markers.concat(selectedMarker ? [selectedMarker] : [])} route={routePoints} />

          {routePoints.length > 1 && <Polyline positions={routePoints} pathOptions={{ color: "#FF5CA8", weight: 4, opacity: 0.7 }} />}

          {[...markers, ...(selectedMarker ? [selectedMarker] : [])].map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              icon={makeBrandMarkerIcon({ tone: marker.tone, active: marker.active, label: marker.label })}
              draggable={marker.draggable}
              eventHandlers={{
                dragend(event) {
                  const latlng = event.target.getLatLng();
                  onSelectedPositionChange?.([latlng.lat, latlng.lng]);
                },
                click() {
                  if (marker.draggable && selectedMarker) return;
                },
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <p className="font-semibold text-[#3F2533]">{marker.title}</p>
                  {marker.description ? <p className="text-sm text-[#8F7181]">{marker.description}</p> : null}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </motion.div>
  );
}
