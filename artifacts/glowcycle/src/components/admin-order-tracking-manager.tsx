import { useEffect, useMemo, useState, useDeferredValue, startTransition } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetAdminOrdersQueryKey,
  getGetOrderTrackingQueryKey,
  useCreateTrackingEvent,
  useGeoReverse,
  useGeoSearch,
  useGetAdminOrders,
  useGetOrderTracking,
} from "@workspace/api-client-react";
import { CreateTrackingEventBody } from "@workspace/api-zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OsmMap } from "@/components/osm-map";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Loader2, MapPin, PackageSearch, RefreshCcw, Search, Save, Truck } from "lucide-react";

const DEFAULT_CENTER: [number, number] = [30.7398, 76.7829];

export function AdminOrderTrackingManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [locationQuery, setLocationQuery] = useState("");
  const deferredLocationQuery = useDeferredValue(locationQuery);
  const [debouncedLocationQuery, setDebouncedLocationQuery] = useState("");
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const ordersQuery = useGetAdminOrders({ q: debouncedSearch }, { query: { queryKey: getGetAdminOrdersQueryKey({ q: debouncedSearch }) } });
  const trackingQuery = useGetOrderTracking(selectedOrderId, {
    query: {
      queryKey: getGetOrderTrackingQueryKey(selectedOrderId),
      enabled: !!selectedOrderId,
      refetchInterval: 30000,
    },
  });
  const createEvent = useCreateTrackingEvent();

  const geoQuery = useGeoSearch({ q: debouncedLocationQuery, limit: 5 });
  const reverseQuery = useGeoReverse(selectedPosition ? { latitude: selectedPosition[0], longitude: selectedPosition[1] } : { latitude: NaN, longitude: NaN });

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(deferredSearch.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [deferredSearch]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedLocationQuery(deferredLocationQuery.trim()), 260);
    return () => window.clearTimeout(timer);
  }, [deferredLocationQuery]);

  useEffect(() => {
    if (reverseQuery.data) {
      const city = reverseQuery.data.city || reverseQuery.data.state || reverseQuery.data.country || "the destination";
      setLocationQuery(reverseQuery.data.address);
      setTitle((prev) => prev || `Reached ${city}`);
      setDescription((prev) => prev || `Shipment has arrived at ${reverseQuery.data.address}.`);
    }
  }, [reverseQuery.data]);

  useEffect(() => {
    if (trackingQuery.data && !selectedPosition && trackingQuery.data.currentEvent) {
      setSelectedPosition([trackingQuery.data.currentEvent.latitude, trackingQuery.data.currentEvent.longitude]);
      setTitle(trackingQuery.data.currentEvent.title);
      setDescription(trackingQuery.data.currentEvent.description);
    }
  }, [trackingQuery.data, selectedPosition]);

  const orders = ordersQuery.data ?? [];
  const currentOrder = useMemo(
    () => orders.find((order) => order.orderId === selectedOrderId) ?? null,
    [orders, selectedOrderId],
  );

  const selectOrder = (orderId: string) => {
    startTransition(() => {
      setSelectedOrderId(orderId);
      setSelectedPosition(null);
      setLocationQuery("");
      setTitle("");
      setDescription("");
    });
  };

  const pickLocation = (position: [number, number]) => {
    startTransition(() => setSelectedPosition(position));
  };

  const submitEvent = async () => {
    if (!selectedOrderId) {
      toast({ title: "Choose an order", description: "Search and select an order first.", variant: "destructive" });
      return;
    }

    const payload = CreateTrackingEventBody.safeParse({
      title,
      description,
      latitude: selectedPosition?.[0],
      longitude: selectedPosition?.[1],
    });

    if (!payload.success) {
      toast({ title: "Check the details", description: payload.error.message, variant: "destructive" });
      return;
    }

    try {
      await createEvent.mutateAsync({ orderId: selectedOrderId, data: payload.data });
      await queryClient.invalidateQueries({ queryKey: getGetOrderTrackingQueryKey(selectedOrderId) });
      await queryClient.invalidateQueries({ queryKey: getGetAdminOrdersQueryKey({ q: debouncedSearch }) });
      toast({ title: "Tracking saved", description: "The new shipment position is live." });
      setLocationQuery("");
    } catch {
      toast({ title: "Could not save tracking", description: "Please try again.", variant: "destructive" });
    }
  };

  const orderRoute = trackingQuery.data?.events.map((event) => [event.latitude, event.longitude] as [number, number]) ?? [];

  return (
    <Card className="overflow-hidden rounded-[2rem] border-[#F5DCE7] bg-white shadow-[0_24px_60px_rgba(255,92,168,0.08)]">
      <CardHeader className="border-b border-[#F7E7EE] bg-gradient-to-r from-[#FFF6FA] to-white pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#AF7A92]">Admin Control</p>
            <CardTitle className="mt-1 font-serif text-2xl text-[#3F2533]">Order Tracking Manager</CardTitle>
            <p className="mt-1 text-sm text-[#8F7181]">Search an order, pick a location, and publish a new shipment update.</p>
          </div>
          <Badge className="rounded-full bg-[#FFF0F6] px-3 py-1 text-[#FF4D9D] shadow-sm hover:bg-[#FFF0F6]">
            <Truck className="mr-1.5 h-3.5 w-3.5" />
            Manual tracking
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by order ID, customer name, or email..." className="h-12 rounded-full pl-11" />
          </div>

          <div className="space-y-3">
            {ordersQuery.isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-20 rounded-2xl" />
                ))}
              </div>
            ) : ordersQuery.isError ? (
              <Card className="rounded-2xl border-destructive/20 bg-destructive/5">
                <CardContent className="space-y-3 p-4">
                  <p className="text-sm font-medium text-destructive">Could not load orders</p>
                  <Button variant="outline" onClick={() => ordersQuery.refetch()} className="rounded-full">
                    Retry
                  </Button>
                </CardContent>
              </Card>
            ) : orders.length === 0 ? (
              <Card className="rounded-2xl border-dashed">
                <CardContent className="p-4 text-sm text-muted-foreground">No matching orders found.</CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <button
                  key={order.orderId}
                  type="button"
                  onClick={() => selectOrder(order.orderId)}
                  className={cn(
                    "w-full rounded-2xl border p-4 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                    selectedOrderId === order.orderId ? "border-primary/20 bg-primary/5" : "border-border/70 bg-white",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground">{order.orderId}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {order.userName} - {order.userEmail}
                      </p>
                    </div>
                    <Badge variant="outline" className="rounded-full border-primary/20 bg-white text-primary">
                      Rs. {order.total.toFixed(0)}
                    </Badge>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#AF7A92]">
                    <span>{order.itemCount} item{order.itemCount !== 1 ? "s" : ""}</span>
                    <span>•</span>
                    <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                    <span>•</span>
                    <span>{order.trackingCount} updates</span>
                  </div>
                </button>
              ))
            )}
          </div>

          {currentOrder ? (
            <Card className="rounded-[1.75rem] border-primary/10 bg-[#FFF7FB] shadow-sm">
              <CardHeader className="border-b border-[#F5DCE7] pb-4">
                <CardTitle className="font-serif text-xl text-[#3F2533]">Selected order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 p-5">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium text-foreground">{currentOrder.orderId}</p>
                    <p className="text-sm text-muted-foreground">
                      {currentOrder.userName} - {currentOrder.userEmail}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-full" onClick={() => trackingQuery.refetch()}>
                    <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                    Refresh
                  </Button>
                </div>
                <div className="rounded-2xl bg-white p-4 shadow-sm">
                  <p className="text-xs uppercase tracking-[0.2em] text-[#AF7A92]">Latest scan</p>
                  <p className="mt-2 text-sm font-medium text-[#3F2533]">
                    {trackingQuery.data?.currentEvent?.title ?? "No live scans yet"}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {trackingQuery.data?.currentEvent?.description ?? "Pick a location and publish the first update."}
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="rounded-[1.75rem] border-dashed">
              <CardContent className="p-5 text-sm text-muted-foreground">
                Search and select an order to open the tracking manager.
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          <div className="space-y-3 rounded-[1.75rem] border border-[#F5DCE7] bg-[#FFF7FB] p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              <p className="text-sm font-medium text-[#3F2533]">Location search</p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={locationQuery} onChange={(e) => setLocationQuery(e.target.value)} placeholder="Search destination or distribution center..." className="h-12 rounded-full pl-11" />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              {geoQuery.isLoading ? (
                <>
                  <Skeleton className="h-14 rounded-2xl" />
                  <Skeleton className="h-14 rounded-2xl" />
                </>
              ) : geoQuery.data?.length ? (
                geoQuery.data.map((item) => (
                  <button
                    key={`${item.latitude}-${item.longitude}-${item.address}`}
                    type="button"
                    onClick={() => pickLocation([item.latitude, item.longitude])}
                    className="rounded-2xl border border-border/70 bg-white p-3 text-left shadow-sm transition-all duration-200 hover:border-primary/20 hover:shadow-md"
                  >
                    <p className="font-medium text-foreground">{item.address}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{[item.city, item.state].filter(Boolean).join(", ") || item.country}</p>
                  </button>
                ))
              ) : locationQuery.trim().length > 1 ? (
                <Card className="rounded-2xl border-dashed md:col-span-2">
                  <CardContent className="p-4 text-sm text-muted-foreground">No matching locations found.</CardContent>
                </Card>
              ) : (
                <Card className="rounded-2xl border-dashed md:col-span-2">
                  <CardContent className="p-4 text-sm text-muted-foreground">Search a location or click the map to set coordinates.</CardContent>
                </Card>
              )}
            </div>
          </div>

          <OsmMap
            center={selectedPosition ?? DEFAULT_CENTER}
            zoom={selectedPosition ? 12 : 11}
            markers={trackingQuery.data?.events.map((event, index) => ({
              id: String(event.id),
              position: [event.latitude, event.longitude],
              title: event.title,
              description: event.description,
              tone: index === trackingQuery.data!.events.length - 1 ? "primary" : "rose",
              active: index === trackingQuery.data!.events.length - 1,
              label: index === trackingQuery.data!.events.length - 1 ? "Current" : undefined,
            })) ?? []}
            route={orderRoute}
            selectedPosition={selectedPosition}
            selectedLabel="Selected update"
            onMapClick={pickLocation}
            onSelectedPositionChange={pickLocation}
            className="border-none"
          />

          <Card className="rounded-[1.75rem] border-primary/10 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-primary/5 pb-4">
              <CardTitle className="font-serif text-xl">Tracking update</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Title</p>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Reached Chandigarh" className="rounded-full" />
              </div>
              <div>
                <p className="mb-2 text-sm font-medium text-foreground">Description</p>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Shipment has arrived at Chandigarh distribution center."
                  rows={4}
                  className="resize-none rounded-2xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  value={selectedPosition ? selectedPosition[0].toFixed(6) : ""}
                  readOnly
                  placeholder="Latitude"
                  className="rounded-full bg-white"
                />
                <Input
                  value={selectedPosition ? selectedPosition[1].toFixed(6) : ""}
                  readOnly
                  placeholder="Longitude"
                  className="rounded-full bg-white"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={submitEvent} className="rounded-full" disabled={createEvent.isPending}>
                  {createEvent.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save tracking event
                </Button>
                <Button variant="outline" onClick={() => trackingQuery.refetch()} className="rounded-full">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Reload order
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[1.75rem] border-primary/10 bg-[#FFF7FB] shadow-sm">
            <CardContent className="space-y-3 p-4">
              <p className="text-sm font-medium text-[#3F2533]">Current route</p>
              <p className="text-sm text-muted-foreground">
                {trackingQuery.data?.events.length
                  ? `${trackingQuery.data.events.length} manual tracking update${trackingQuery.data.events.length !== 1 ? "s" : ""} on record.`
                  : "The order is waiting for its first manual location scan."}
              </p>
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );
}
