import { useEffect, useMemo, useRef } from "react";
import { useParams } from "wouter";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { getGetOrderTrackingQueryKey, useGetOrderTracking } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { OsmMap } from "@/components/osm-map";
import { useToast } from "@/hooks/use-toast";
import { ArrowRight, Clock3, Loader2, MapPin, Package, RefreshCcw, Route, Sparkles, Truck } from "lucide-react";
import { cn } from "@/lib/utils";

const DEFAULT_CENTER: [number, number] = [30.7398, 76.7829];

function StatusBadge({ status }: { status: "complete" | "current" | "pending" }) {
  return (
    <Badge
      className={cn(
        "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
        status === "complete"
          ? "bg-emerald-50 text-emerald-700"
          : status === "current"
            ? "bg-[#FFF0F6] text-[#FF5CA8]"
            : "bg-white text-[#9D7D8C]",
      )}
    >
      {status === "complete" ? "Completed" : status === "current" ? "Current" : "Pending"}
    </Badge>
  );
}

export default function TrackingPage() {
  const { orderId = "" } = useParams<{ orderId: string }>();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const orderQuery = useGetOrderTracking(orderId, {
    query: {
      queryKey: getGetOrderTrackingQueryKey(orderId),
      enabled: !!orderId,
      refetchInterval: 30000,
    },
  });

  const seenInitialEvent = useRef(false);

  useEffect(() => {
    if (!orderId) return;

    const source = new EventSource(`/api/orders/${orderId}/tracking/stream`);
    source.addEventListener("tracking", (evt) => {
      try {
        const payload = JSON.parse((evt as MessageEvent).data) as { events?: unknown[] };
        if (seenInitialEvent.current) {
          toast({ title: "Tracking updated", description: "Your shipment location changed." });
        } else {
          seenInitialEvent.current = true;
        }

        if (Array.isArray(payload.events) && payload.events.length > 0) {
          queryClient.invalidateQueries({ queryKey: getGetOrderTrackingQueryKey(orderId) });
        }
      } catch {
        queryClient.invalidateQueries({ queryKey: getGetOrderTrackingQueryKey(orderId) });
      }
    });

    source.onerror = () => {
      source.close();
    };

    return () => source.close();
  }, [orderId, queryClient, toast]);

  const tracking = orderQuery.data;
  const routePoints = useMemo<[number, number][]>(() => tracking?.events.map((event) => [event.latitude, event.longitude]) ?? [], [tracking]);
  const currentPosition = tracking?.currentEvent ? ([tracking.currentEvent.latitude, tracking.currentEvent.longitude] as [number, number]) : null;
  const completedCount = tracking?.stages.filter((stage) => stage.status === "complete").length ?? 0;
  const progress = tracking?.stages.length ? Math.round((completedCount / tracking.stages.length) * 100) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-2">
        <p className="text-[11px] uppercase tracking-[0.24em] text-[#AF7A92]">Live Order Tracking</p>
        <h1 className="font-serif text-3xl font-bold text-foreground md:text-4xl">
          Order <span className="text-primary">{orderId}</span>
        </h1>
        <p className="max-w-2xl text-lg text-muted-foreground">
          Track the current shipment location, inspect the route history, and watch live admin updates as they happen.
        </p>
      </motion.div>

      {orderQuery.isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-36 rounded-[2rem]" />
          <Skeleton className="h-[520px] rounded-[2rem]" />
        </div>
      ) : orderQuery.isError ? (
        <Card className="rounded-[2rem] border-destructive/20 bg-destructive/5">
          <CardContent className="space-y-4 p-8">
            <p className="text-lg font-medium text-destructive">We could not load this tracking record.</p>
            <p className="text-sm text-muted-foreground">Please retry or return to your order list.</p>
            <Button variant="outline" onClick={() => orderQuery.refetch()} className="rounded-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : tracking ? (
        <div className="space-y-6">
          <Card className="overflow-hidden rounded-[2rem] border-primary/10 shadow-sm">
            <CardHeader className="border-b border-border/40 bg-primary/5 pb-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <CardTitle className="font-serif text-2xl">Shipment progress</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Placed on {new Date(tracking.order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="rounded-full bg-white px-3 py-1 text-primary shadow-sm hover:bg-white">
                    <Sparkles className="mr-1.5 h-3.5 w-3.5" />
                    Live updates
                  </Badge>
                  <Button variant="outline" onClick={() => orderQuery.refetch()} className="rounded-full">
                    <RefreshCcw className="mr-2 h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-3">
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-white text-primary">
                    <Package className="mr-1.5 h-3.5 w-3.5" />
                    {tracking.order.itemCount} item{tracking.order.itemCount !== 1 ? "s" : ""}
                  </Badge>
                  <Badge variant="outline" className="rounded-full border-primary/20 bg-white text-primary">
                    Rs. {tracking.order.total.toFixed(0)}
                  </Badge>
                </div>

                <div className="rounded-[1.75rem] border border-[#F5DCE7] bg-[#FFF7FB] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#3F2533]">Current location</p>
                      <p className="mt-1 truncate text-sm text-[#8F7181]">
                        {tracking.currentEvent ? tracking.currentEvent.title : "No live location yet"}
                      </p>
                    </div>
                    <div className="rounded-full bg-white p-3 text-primary shadow-sm">
                      <Truck className="h-6 w-6" />
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#AF7A92]">Progress</p>
                      <p className="mt-2 font-serif text-3xl font-semibold text-[#3F2533]">{progress}%</p>
                    </div>
                    <div className="rounded-2xl bg-white p-4 shadow-sm">
                      <p className="text-[11px] uppercase tracking-[0.2em] text-[#AF7A92]">Updated</p>
                      <p className="mt-2 text-sm font-medium text-[#3F2533]">
                        {tracking.currentEvent ? new Date(tracking.currentEvent.createdAt).toLocaleString("en-IN") : "Waiting for the next scan"}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-[#4A2C3A]">
                    <Route className="h-4 w-4 text-primary" />
                    Tracking timeline
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${progress}%` }} />
                  </div>

                  <div className="space-y-3 pt-2">
                    {tracking.stages.map((stage, index) => (
                      <motion.div
                        key={`${stage.title}-${index}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04 }}
                        className="flex items-start gap-3 rounded-2xl border border-border/70 bg-white p-4 shadow-sm"
                      >
                        <div
                          className={cn(
                            "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-4 border-[#FFF7FB]",
                            stage.status === "complete"
                              ? "bg-emerald-500 text-white"
                              : stage.status === "current"
                                ? "bg-[#FF5CA8] text-white"
                                : "bg-white text-[#CFA9B9]",
                          )}
                        >
                          {stage.status === "complete" ? "✓" : stage.status === "current" ? "●" : "○"}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium text-foreground">{stage.title}</p>
                            <StatusBadge status={stage.status} />
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">{stage.description}</p>
                          {stage.timestamp ? (
                            <p className="mt-2 text-xs text-[#AF7A92]">{new Date(stage.timestamp).toLocaleString("en-IN")}</p>
                          ) : null}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <OsmMap
                  center={currentPosition ?? DEFAULT_CENTER}
                  zoom={currentPosition ? 12 : 11}
                  markers={tracking.events.map((event, index) => ({
                    id: String(event.id),
                    position: [event.latitude, event.longitude],
                    title: event.title,
                    description: event.description,
                    tone: index === tracking.events.length - 1 ? "primary" : "rose",
                    active: index === tracking.events.length - 1,
                    label: index === tracking.events.length - 1 ? "Current" : undefined,
                  }))}
                  route={routePoints}
                  selectedPosition={currentPosition}
                  selectedLabel={tracking.currentEvent?.title ?? "Shipment"}
                />

                <Card className="rounded-[1.75rem] border-primary/10 bg-[#FFF7FB] shadow-sm">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-[#3F2533]">Tracking history</p>
                      <Clock3 className="h-4 w-4 text-primary" />
                    </div>
                    {tracking.events.length === 0 ? (
                      <p className="rounded-2xl bg-white p-4 text-sm text-muted-foreground">
                        No manual tracking events have been added yet. The shipment route will appear as soon as the admin updates the order.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {tracking.events.map((event, index) => (
                          <div key={event.id} className="rounded-2xl bg-white p-4 shadow-sm">
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="font-medium text-foreground">{event.title}</p>
                                <p className="mt-1 text-sm text-muted-foreground">{event.description}</p>
                              </div>
                              {index === tracking.events.length - 1 ? <Badge className="rounded-full bg-primary text-white">Current</Badge> : null}
                            </div>
                            <div className="mt-3 flex items-center gap-2 text-xs text-[#AF7A92]">
                              <MapPin className="h-3.5 w-3.5 text-primary" />
                              {event.latitude.toFixed(4)}, {event.longitude.toFixed(4)}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
