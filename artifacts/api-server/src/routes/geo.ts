import { Router, type IRouter } from "express";
import { GeoReverseQuery, GeoReverseResponse, GeoSearchQuery, GeoSearchResponse } from "@workspace/api-zod";

const router: IRouter = Router();
const NOMINATIM_BASE = "https://nominatim.openstreetmap.org";

function normalizeLocation(address: Record<string, string | undefined>, displayName: string, latitude: number, longitude: number) {
  return {
    displayName,
    address: displayName,
    latitude,
    longitude,
    city: address.city ?? address.town ?? address.village ?? address.county ?? "",
    state: address.state ?? address.region ?? "",
    country: address.country ?? "",
    postalCode: address.postcode,
  };
}

async function fetchNominatim(url: string): Promise<any> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "Accept-Language": "en-IN,en;q=0.9",
      "User-Agent": "GlowCycle/1.0 (OpenStreetMap Nominatim)",
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with ${response.status}`);
  }

  return response.json();
}

router.get("/geo/search", async (req, res): Promise<void> => {
  const parsed = GeoSearchQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    q: parsed.data.q,
    limit: String(parsed.data.limit ?? 8),
  });

  const raw = await fetchNominatim(`${NOMINATIM_BASE}/search?${params.toString()}`);
  const results = Array.isArray(raw)
    ? raw.map((item: any) =>
        normalizeLocation(
          item.address ?? {},
          item.display_name ?? item.name ?? "",
          Number(item.lat ?? 0),
          Number(item.lon ?? 0),
        ),
      )
    : [];

  res.json(GeoSearchResponse.parse(results));
});

router.get("/geo/reverse", async (req, res): Promise<void> => {
  const parsed = GeoReverseQuery.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const params = new URLSearchParams({
    format: "jsonv2",
    addressdetails: "1",
    lat: String(parsed.data.latitude),
    lon: String(parsed.data.longitude),
  });

  const raw = await fetchNominatim(`${NOMINATIM_BASE}/reverse?${params.toString()}`);
  const payload = normalizeLocation(
    raw.address ?? {},
    raw.display_name ?? "",
    Number(raw.lat ?? parsed.data.latitude),
    Number(raw.lon ?? parsed.data.longitude),
  );

  res.json(GeoReverseResponse.parse(payload));
});

export default router;
