import { useEffect, useMemo, useState, useDeferredValue, startTransition } from "react";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateAddress,
  useDeleteAddress,
  useGeoReverse,
  useGeoSearch,
  useGetAddresses,
  useUpdateAddress,
  getGetAddressesQueryKey,
} from "@workspace/api-client-react";
import { AddressBody } from "@workspace/api-zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OsmMap } from "@/components/osm-map";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, Search, Save, Pencil, Trash2, RotateCcw, Sparkles } from "lucide-react";

type DraftAddress = {
  address: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  country: string;
  postalCode: string;
};

const DEFAULT_CENTER: [number, number] = [30.7398, 76.7829];

function AddressSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <Skeleton key={i} className="h-32 rounded-[1.75rem]" />
      ))}
    </div>
  );
}

export default function Addresses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const addressesQuery = useGetAddresses();
  const createAddress = useCreateAddress();
  const updateAddress = useUpdateAddress();
  const deleteAddress = useDeleteAddress();

  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [editingAddressId, setEditingAddressId] = useState<number | null>(null);
  const [draft, setDraft] = useState<DraftAddress>({
    address: "",
    latitude: DEFAULT_CENTER[0],
    longitude: DEFAULT_CENTER[1],
    city: "",
    state: "",
    country: "India",
    postalCode: "",
  });

  const searchQuery = useGeoSearch({ q: debouncedSearch, limit: 6 });
  const reverseQuery = useGeoReverse(selectedPosition ? { latitude: selectedPosition[0], longitude: selectedPosition[1] } : { latitude: NaN, longitude: NaN });

  const suggestions = searchQuery.data ?? [];
  const savedAddresses = addressesQuery.data ?? [];

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(deferredSearch.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [deferredSearch]);

  useEffect(() => {
    if (reverseQuery.data) {
      setDraft((prev) => ({
        ...prev,
        address: reverseQuery.data.address,
        latitude: reverseQuery.data.latitude,
        longitude: reverseQuery.data.longitude,
        city: reverseQuery.data.city,
        state: reverseQuery.data.state,
        country: reverseQuery.data.country,
        postalCode: reverseQuery.data.postalCode ?? prev.postalCode,
      }));
    }
  }, [reverseQuery.data]);

  useEffect(() => {
    if (selectedPosition || typeof navigator === "undefined" || !navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: [number, number] = [position.coords.latitude, position.coords.longitude];
        startTransition(() => setSelectedPosition(next));
      },
      () => {
        setSelectedPosition(DEFAULT_CENTER);
      },
      { enableHighAccuracy: true, timeout: 5000 },
    );
  }, [selectedPosition]);

  const selectedSummary = useMemo(() => {
    if (!selectedPosition) return null;
    return {
      title: draft.address || "Selected location",
      subtitle: [draft.city, draft.state, draft.country].filter(Boolean).join(", "),
      coordinates: `${draft.latitude.toFixed(4)}, ${draft.longitude.toFixed(4)}`,
    };
  }, [selectedPosition, draft]);

  const pickSuggestion = (result: (typeof suggestions)[number]) => {
    startTransition(() => {
      setSelectedPosition([result.latitude, result.longitude]);
      setDraft({
        address: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
        city: result.city,
        state: result.state,
        country: result.country,
        postalCode: result.postalCode ?? "",
      });
      setEditingAddressId(null);
    });
  };

  const beginEdit = (item: (typeof savedAddresses)[number]) => {
    startTransition(() => {
      setEditingAddressId(item.id);
      setSelectedPosition([item.latitude, item.longitude]);
      setDraft({
        address: item.address,
        latitude: item.latitude,
        longitude: item.longitude,
        city: item.city,
        state: item.state,
        country: item.country,
        postalCode: item.postalCode,
      });
    });
  };

  const resetDraft = () => {
    startTransition(() => {
      setEditingAddressId(null);
      setSelectedPosition(null);
      setSearch("");
      setDraft({
        address: "",
        latitude: DEFAULT_CENTER[0],
        longitude: DEFAULT_CENTER[1],
        city: "",
        state: "",
        country: "India",
        postalCode: "",
      });
    });
  };

  const saveAddress = async () => {
    const payload = AddressBody.safeParse(draft);
    if (!payload.success) {
      toast({ title: "Check the address", description: payload.error.message, variant: "destructive" });
      return;
    }

    try {
      if (editingAddressId) {
        await updateAddress.mutateAsync({ addressId: editingAddressId, data: payload.data });
        toast({ title: "Address updated", description: "Your delivery address was saved." });
      } else {
        await createAddress.mutateAsync(payload.data);
        toast({ title: "Address saved", description: "Your delivery address is now stored." });
      }

      await queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      resetDraft();
    } catch {
      toast({ title: "Could not save address", description: "Please try again.", variant: "destructive" });
    }
  };

  const deleteSavedAddress = async (id: number) => {
    try {
      await deleteAddress.mutateAsync(id);
      await queryClient.invalidateQueries({ queryKey: getGetAddressesQueryKey() });
      if (editingAddressId === id) resetDraft();
      toast({ title: "Address deleted", description: "The saved delivery location was removed." });
    } catch {
      toast({ title: "Delete failed", description: "We could not remove that address.", variant: "destructive" });
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#AF7A92]">Delivery Tools</p>
        <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
          Address <span className="text-primary">Picker</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Search with OpenStreetMap, place the marker on the map, and save precise delivery locations for faster checkout.
        </p>
      </motion.div>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-primary/5 pb-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-2xl">Find a location</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">Autocomplete, reverse geocoding, and drag-to-adjust all work together.</p>
                </div>
                <Badge className="rounded-full bg-white px-3 py-1 text-primary shadow-sm hover:bg-white">
                  <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                  Live geocoding
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search city, street, locality..."
                  className="h-12 rounded-full pl-11"
                />
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_0.95fr]">
                <div className="space-y-3">
                  {searchQuery.isLoading ? (
                    <div className="space-y-2">
                      {[...Array(3)].map((_, i) => (
                        <Skeleton key={i} className="h-16 rounded-2xl" />
                      ))}
                    </div>
                  ) : searchQuery.isError ? (
                    <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
                      <CardContent className="space-y-3 p-4">
                        <p className="text-sm font-medium text-destructive">Search failed</p>
                        <Button variant="outline" onClick={() => searchQuery.refetch()} className="rounded-full">
                          Retry
                        </Button>
                      </CardContent>
                    </Card>
                  ) : suggestions.length === 0 ? (
                    <Card className="rounded-2xl border-dashed">
                      <CardContent className="p-4 text-sm text-muted-foreground">
                        Type at least two characters to search addresses.
                      </CardContent>
                    </Card>
                  ) : (
                    suggestions.map((item) => (
                      <button
                        key={`${item.latitude}-${item.longitude}-${item.address}`}
                        type="button"
                        onClick={() => pickSuggestion(item)}
                        className="w-full rounded-2xl border border-border/70 bg-white p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md"
                      >
                        <p className="font-medium text-foreground">{item.address}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {item.city || item.state ? [item.city, item.state].filter(Boolean).join(", ") : item.country}
                        </p>
                      </button>
                    ))
                  )}
                </div>

                <Card className="rounded-[1.75rem] border-primary/10 bg-[#FFF7FB]">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-primary" />
                      <p className="text-sm font-medium text-foreground">Confirmation card</p>
                    </div>
                    {selectedSummary ? (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3 rounded-2xl bg-white p-4 shadow-sm">
                        <p className="font-medium text-foreground">{selectedSummary.title}</p>
                        <p className="text-sm text-muted-foreground">{selectedSummary.subtitle || "Location selected on the map"}</p>
                        <div className="flex flex-wrap gap-2 text-xs text-[#AF7A92]">
                          <Badge variant="outline" className="rounded-full border-[#F0D9E3] bg-[#FFF7FB] text-[#AF7A92]">
                            {selectedSummary.coordinates}
                          </Badge>
                        </div>
                      </motion.div>
                    ) : (
                      <p className="rounded-2xl bg-white p-4 text-sm text-muted-foreground">
                        Pick a point on the map or select a suggestion to see the confirmation card.
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button onClick={saveAddress} className="rounded-full" disabled={createAddress.isPending || updateAddress.isPending}>
                        {createAddress.isPending || updateAddress.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {editingAddressId ? "Update Address" : "Save Address"}
                      </Button>
                      <Button variant="outline" onClick={resetDraft} className="rounded-full">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Reset
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          <OsmMap
            center={selectedPosition ?? DEFAULT_CENTER}
            zoom={selectedPosition ? 14 : 12}
            selectedPosition={selectedPosition}
            selectedLabel={draft.address || "Selected delivery point"}
            onMapClick={(position) => {
              setSelectedPosition(position);
              setSearch("");
            }}
            onSelectedPositionChange={(position) => {
              setSelectedPosition(position);
            }}
            className="border-none"
          />
        </div>

        <div className="space-y-6">
          <Card className="rounded-[2rem] border-primary/10 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-primary/5 pb-4">
              <CardTitle className="font-serif text-2xl">Address details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Address</p>
                <Textarea
                  value={draft.address}
                  onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
                  rows={4}
                  placeholder="House no, street, area, landmark"
                  className="resize-none rounded-2xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input value={draft.city} onChange={(e) => setDraft((prev) => ({ ...prev, city: e.target.value }))} placeholder="City" className="rounded-full" />
                <Input value={draft.state} onChange={(e) => setDraft((prev) => ({ ...prev, state: e.target.value }))} placeholder="State" className="rounded-full" />
                <Input value={draft.country} onChange={(e) => setDraft((prev) => ({ ...prev, country: e.target.value }))} placeholder="Country" className="rounded-full" />
                <Input value={draft.postalCode} onChange={(e) => setDraft((prev) => ({ ...prev, postalCode: e.target.value }))} placeholder="Postal code" className="rounded-full" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={Number.isFinite(draft.latitude) ? draft.latitude.toFixed(6) : ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, latitude: Number(e.target.value) || 0 }))}
                  placeholder="Latitude"
                  className="rounded-full"
                />
                <Input
                  value={Number.isFinite(draft.longitude) ? draft.longitude.toFixed(6) : ""}
                  onChange={(e) => setDraft((prev) => ({ ...prev, longitude: Number(e.target.value) || 0 }))}
                  placeholder="Longitude"
                  className="rounded-full"
                />
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-primary" />
                <span>Drag the marker or tap the map to refresh these coordinates.</span>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-primary/10 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-primary/5 pb-4">
              <div className="flex items-center justify-between gap-3">
                <CardTitle className="font-serif text-2xl">Saved addresses</CardTitle>
                {addressesQuery.isFetching ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : null}
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {addressesQuery.isLoading ? (
                <AddressSkeleton />
              ) : addressesQuery.isError ? (
                <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
                  <CardContent className="space-y-3 p-4">
                    <p className="text-sm font-medium text-destructive">Could not load saved addresses</p>
                    <Button variant="outline" onClick={() => addressesQuery.refetch()} className="rounded-full">
                      Retry
                    </Button>
                  </CardContent>
                </Card>
              ) : savedAddresses.length === 0 ? (
                <Card className="rounded-2xl border-dashed">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    No saved addresses yet. Pick a location and save it to build your delivery book.
                  </CardContent>
                </Card>
              ) : (
                savedAddresses.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "rounded-2xl border p-4 shadow-sm transition-all duration-200",
                      editingAddressId === item.id ? "border-primary/20 bg-primary/5" : "border-border/70 bg-white",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-medium text-foreground">{item.address}</p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {[item.city, item.state, item.country].filter(Boolean).join(", ")}
                        </p>
                        <p className="mt-2 text-xs text-[#AF7A92]">
                          {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-2">
                        <Button variant="outline" size="icon" className="rounded-full" onClick={() => beginEdit(item)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full text-destructive hover:bg-destructive/5" onClick={() => deleteSavedAddress(item.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
