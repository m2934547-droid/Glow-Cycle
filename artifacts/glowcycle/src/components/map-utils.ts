import L from "leaflet";

export type MapTone = "primary" | "rose" | "emerald" | "violet";

const toneStyles: Record<MapTone, string> = {
  primary: "#FF5CA8",
  rose: "#FB7185",
  emerald: "#10B981",
  violet: "#8B5CF6",
};

export function makeBrandMarkerIcon(options?: { tone?: MapTone; active?: boolean; label?: string }) {
  const tone = options?.tone ?? "primary";
  const color = toneStyles[tone];
  const active = options?.active ?? false;
  const label = options?.label ?? "";

  return L.divIcon({
    className: "bg-transparent border-0",
    html: `
      <div class="relative flex items-center justify-center">
        <div class="absolute inset-0 rounded-full ${active ? "animate-ping opacity-30" : "opacity-10"}" style="background:${color};width:3rem;height:3rem;transform:translate(-0.5rem,-0.5rem);"></div>
        <div class="relative flex h-8 w-8 items-center justify-center rounded-full border-4 border-white shadow-[0_12px_24px_rgba(255,92,168,0.24)]" style="background:${color};">
          <div class="h-2.5 w-2.5 rounded-full bg-white"></div>
        </div>
        ${label ? `<span class="absolute top-[2.25rem] inline-flex rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-[#4A2C3A] shadow-sm">${label}</span>` : ""}
      </div>
    `,
    iconSize: [40, 56],
    iconAnchor: [20, 44],
    popupAnchor: [0, -38],
  });
}

export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const r = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return r * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
