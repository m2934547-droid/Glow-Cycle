import { useEffect, useMemo, useState, useDeferredValue, startTransition } from "react";
import { motion } from "framer-motion";
import {
  getGetNearestStoreQueryKey,
  useGeoSearch,
  useGetNearestStore,
  useGetStores,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OsmMap } from "@/components/osm-map";
import { cn } from "@/lib/utils";
import { haversineKm } from "@/components/map-utils";
import { useToast } from "@/hooks/use-toast";
import { LocateFixed, MapPin, Search, Store, ArrowRight, BadgeInfo, Loader2 } from "lucide-react";

const DEFAULT_CENTER: [number, number] = [30.7398, 76.7829];

export default function StoreLocator() {
  const { toast } = useToast();
  const storesQuery = useGetStores();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [referencePoint, setReferencePoint] = useState<[number, number] | null>(null);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const queryClient = useQueryClient();

  const geoQuery = useGeoSearch({ q: debouncedSearch, limit: 5 });
  const nearestQuery = useGetNearestStore(
    referencePoint ? { latitude: referencePoint[0], longitude: referencePoint[1] } : { latitude: NaN, longitude: NaN },
    {
      query: {
        queryKey: getGetNearestStoreQueryKey(
          referencePoint ? { latitude: referencePoint[0], longitude: referencePoint[1] } : { latitude: 0, longitude: 0 },
        ),
        enabled: !!referencePoint,
      },
    },
  );

  const stores = storesQuery.data ?? [];
  const searchResults = geoQuery.data ?? [];
  const sortedStores = useMemo(() => {
    if (!referencePoint) return stores;
    return [...stores].sort(
      (a, b) =>
        haversineKm(referencePoint[0], referencePoint[1], a.latitude, a.longitude) -
        haversineKm(referencePoint[0], referencePoint[1], b.latitude, b.longitude),
    );
  }, [stores, referencePoint]);

  const selectedStore = sortedStores.find((store) => store.id === selectedStoreId) ?? sortedStores[0] ?? null;

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(deferredSearch.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [deferredSearch]);

  useEffect(() => {
    if (referencePoint || typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => startTransition(() => setReferencePoint([position.coords.latitude, position.coords.longitude])),
      () => setReferencePoint(DEFAULT_CENTER),
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, [referencePoint]);

  const pickSearchResult = (result: (typeof searchResults)[number]) => {
    startTransition(() => {
      setReferencePoint([result.latitude, result.longitude]);
      setSelectedStoreId(null);
      queryClient.invalidateQueries({ queryKey: getGetNearestStoreQueryKey({ latitude: result.latitude, longitude: result.longitude }) });
      toast({ title: "Reference location set", description: result.address });
    });
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#AF7A92]">Store Network</p>
        <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
          Store <span className="text-primary">Locator</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Discover every GlowCycle location on OpenStreetMap, compare distances, and see which branch is nearest to you.
        </p>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.95fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-primary/5 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-2xl">Find a nearby store</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Search a location, use your current position, or tap the map to set a reference point.</p>
                </div>
                <Button variant="outline" onClick={() => setReferencePoint(DEFAULT_CENTER)} className="rounded-full border-primary/20 text-primary hover:bg-primary/5">
                  <LocateFixed className="mr-2 h-4 w-4" />
                  Reset to Chandigarh
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search city, district, area..." className="h-12 rounded-full pl-11" />
              </div>

              {geoQuery.isLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14 rounded-2xl" />
                  ))}
                </div>
              ) : geoQuery.isError ? (
                <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-sm font-medium text-destructive">Could not search locations</p>
                    <Button variant="outline" onClick={() => geoQuery.refetch()} className="rounded-full">
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : debouncedSearch.trim().length > 1 && (geoQuery.data ?? []).length === 0 ? (
                <Card className="rounded-2xl border-dashed">
                  <CardContent className="p-4 text-sm text-muted-foreground">No matching locations found.</CardContent>
                </Card>
              ) : debouncedSearch.trim().length > 1 ? (
                <div className="grid gap-2 md:grid-cols-2">
                  {searchResults.map((item) => (
                    <button
                      key={`${item.latitude}-${item.longitude}-${item.address}`}
                      type="button"
                      onClick={() => pickSearchResult(item)}
                      className="rounded-2xl border border-border/70 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                    >
                      <p className="font-medium text-foreground">{item.address}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{[item.city, item.state].filter(Boolean).join(", ") || item.country}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <Card className="rounded-2xl border-dashed">
                  <CardContent className="p-4 text-sm text-muted-foreground">Search a location to compare all nearby stores.</CardContent>
                </Card>
              )}
            </CardContent>
          </Card>

          <OsmMap
            center={referencePoint ?? DEFAULT_CENTER}
            zoom={referencePoint ? 12 : 11}
            markers={stores.map((store) => ({
              id: String(store.id),
              position: [store.latitude, store.longitude],
              title: store.name,
              description: store.address,
              tone: selectedStoreId === store.id ? "primary" : "rose",
              active: selectedStoreId === store.id,
              label: referencePoint ? `${haversineKm(referencePoint[0], referencePoint[1], store.latitude, store.longitude).toFixed(1)} km` : undefined,
            }))}
            selectedPosition={referencePoint}
            selectedLabel="Reference point"
            onMapClick={(position) => {
              setReferencePoint(position);
              setSelectedStoreId(null);
            }}
            onSelectedPositionChange={(position) => {
              setReferencePoint(position);
            }}
            className="border-none"
          />
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-primary/10 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-primary/5 pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-serif text-2xl">Nearest store</CardTitle>
                {nearestQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {!referencePoint ? (
                <Card className="rounded-2xl border-dashed">
                  <CardContent className="p-4 text-sm text-muted-foreground">Set a location to see your nearest store and delivery zone.</CardContent>
                </Card>
              ) : nearestQuery.isLoading ? (
                <div className="space-y-2">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 rounded-2xl" />
                  ))}
                </div>
              ) : nearestQuery.isError ? (
                <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-sm font-medium text-destructive">Could not compute nearest store</p>
                    <Button variant="outline" onClick={() => nearestQuery.refetch()} className="rounded-full">
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : nearestQuery.data ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-primary/10 bg-[#FFF7FB] p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">{nearestQuery.data.store.name}</p>
                      <p className="mt-1 text-sm text-muted-foreground">{nearestQuery.data.store.address}</p>
                    </div>
                    <Badge className="rounded-full bg-white px-3 py-1 text-primary shadow-sm hover:bg-white">
                      <Store className="mr-1.5 h-3.5 w-3.5" />
                      {nearestQuery.data.distanceKm.toFixed(1)} km
                    </Badge>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm text-[#8F7181]">
                      <BadgeInfo className="h-4 w-4 text-primary" />
                      {nearestQuery.data.deliveryZone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#8F7181]">
                      <MapPin className="h-4 w-4 text-primary" />
                      {nearestQuery.data.store.latitude.toFixed(4)}, {nearestQuery.data.store.longitude.toFixed(4)}
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-primary/10 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-primary/5 pb-4">
              <CardTitle className="font-serif text-2xl">All stores</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {storesQuery.isLoading ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-20 rounded-2xl" />
                  ))}
                </div>
              ) : storesQuery.isError ? (
                <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-sm font-medium text-destructive">Could not load stores</p>
                    <Button variant="outline" onClick={() => storesQuery.refetch()} className="rounded-full">
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : sortedStores.length === 0 ? (
                <Card className="rounded-2xl border-dashed">
                  <CardContent className="p-4 text-sm text-muted-foreground">No stores are available in the database yet.</CardContent>
                </Card>
              ) : (
                sortedStores.map((store) => {
                  const distance = referencePoint ? haversineKm(referencePoint[0], referencePoint[1], store.latitude, store.longitude) : null;
                  return (
                    <button
                      type="button"
                      key={store.id}
                      onClick={() => setSelectedStoreId(store.id)}
                      className={cn(
                        "w-full rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                        selectedStoreId === store.id ? "border-primary/20 bg-primary/5" : "border-border/70 bg-white",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{store.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{store.address}</p>
                        </div>
                        {distance !== null ? (
                          <Badge variant="outline" className="rounded-full border-primary/20 bg-white text-primary">
                            {distance.toFixed(1)} km
                          </Badge>
                        ) : null}
                      </div>
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          {selectedStore ? (
            <Card className="rounded-[2rem] border-primary/10 shadow-sm">
              <CardHeader className="border-b border-border/40 bg-primary/5 pb-4">
                <CardTitle className="font-serif text-2xl">Selected store</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                <p className="font-medium text-foreground">{selectedStore.name}</p>
                <p className="text-sm text-muted-foreground">{selectedStore.address}</p>
                <Button
                  className="rounded-full"
                  onClick={() => {
                    setReferencePoint([selectedStore.latitude, selectedStore.longitude]);
                    setSelectedStoreId(selectedStore.id);
                  }}
                >
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Use as reference point
                </Button>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
