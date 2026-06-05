import { useMemo, useState } from "react";
import { format, differenceInDays } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Truck, MapPinned, CircleDot, CircleCheckBig, Clock3, ArrowRight, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type DeliveryStep = {
  city: string;
  status: string;
  note: string;
};

const deliveryRoute: DeliveryStep[] = [
  { city: "Gobingarh", status: "Dispatched", note: "Packed and handed to the dispatch team." },
  { city: "Salaani Village", status: "In Transit", note: "Moving through the local delivery route." },
  { city: "Amloh", status: "Destination", note: "Final delivery stop for the customer." },
];

type StepState = "pending" | "in-transit" | "arrived";

function getActiveStep(createdAt: string) {
  const daysSinceOrder = differenceInDays(new Date(), new Date(createdAt));

  if (daysSinceOrder <= 1) return 0;
  if (daysSinceOrder <= 3) return 1;
  return 2;
}

function statusLabel(status: StepState) {
  switch (status) {
    case "arrived":
      return "Arrived";
    case "in-transit":
      return "In Transit";
    default:
      return "Pending";
  }
}

export function OrderDeliveryTimeline({
  orderId,
  createdAt,
  className,
}: {
  orderId: string;
  createdAt: string;
  className?: string;
}) {
  const activeStep = getActiveStep(createdAt);

  return (
    <div
      className={cn(
        "rounded-[2rem] border border-[#F6DCE7] bg-[#FFF7FB] p-5 shadow-[0_14px_36px_rgba(255,92,168,0.08)]",
        className
      )}
    >
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#AF7A92]">Delivery Track</p>
          <h3 className="mt-1 font-serif text-xl font-semibold text-[#3F2533]">Order {orderId}</h3>
          <p className="mt-1 text-sm text-[#8F7181]">Manual location updates for the customer order history.</p>
        </div>
        <Badge className="rounded-full bg-white px-3 py-1 text-[#FF4D9D] shadow-sm hover:bg-white">
          {deliveryRoute[activeStep]?.status ?? "Dispatched"}
        </Badge>
      </div>

      <div className="relative pl-10">
        <div className="absolute left-4 top-1 bottom-2 border-l-2 border-dotted border-white/95" />

        <div className="space-y-5">
          {deliveryRoute.map((step, index) => {
            const isActive = index === activeStep;
            const isDone = index < activeStep;

            return (
              <div key={step.city} className="relative">
                <div
                  className={cn(
                    "absolute -left-2 top-1 flex h-8 w-8 items-center justify-center rounded-full border-4 border-[#FFF7FB] shadow-sm",
                    isActive
                      ? "bg-[#FF4D9D] text-white shadow-[0_10px_22px_rgba(255,77,157,0.28)]"
                      : isDone
                        ? "bg-[#FFE0EC] text-[#FF4D9D]"
                        : "bg-white text-[#CFA9B9]"
                  )}
                >
                  {isActive ? <Truck className="h-4 w-4" /> : isDone ? <CircleCheckBig className="h-4 w-4" /> : <CircleDot className="h-4 w-4" />}
                </div>

                <div className="rounded-2xl bg-white/90 p-4 pr-5 shadow-[0_10px_24px_rgba(255,92,168,0.06)]">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#3F2533]">{step.city}</p>
                    <Badge
                      variant="outline"
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
                        isActive
                          ? "border-[#FF4D9D]/25 bg-[#FFF0F6] text-[#FF4D9D]"
                          : isDone
                            ? "border-[#FFD5E3] bg-[#FFF7FB] text-[#9C6D84]"
                            : "border-[#F0DFE8] bg-white text-[#AE8C9D]"
                      )}
                    >
                      {step.status}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm leading-relaxed text-[#816573]">{step.note}</p>

                  <div className="mt-3 flex items-center gap-2 text-xs text-[#AF7A92]">
                    <MapPinned className="h-3.5 w-3.5 text-[#FF4D9D]" />
                    <span>{index === 0 ? "Dispatched" : index === 1 ? "In route" : "Destination point"}</span>
                    {isActive && <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F6] px-2 py-0.5 text-[#FF4D9D]"><Clock3 className="h-3 w-3" /> Active stop</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function AdminOrderLocationPanel() {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState(
    deliveryRoute.map((step, index) => ({
      ...step,
      status: index === 0 ? ("in-transit" as StepState) : ("pending" as StepState),
      updatedAt: index === 0 ? "Just now" : "Waiting",
    }))
  );
  const [activityLog, setActivityLog] = useState<string[]>([
    "Gobingarh marked as dispatched.",
    "Salaani Village is queued for the next update.",
  ]);

  const currentMilestone = useMemo(
    () => milestones.find((milestone) => milestone.status !== "arrived") ?? milestones[milestones.length - 1],
    [milestones]
  );

  const pushLog = (message: string) => {
    setActivityLog((prev) => [message, ...prev].slice(0, 4));
  };

  const updateStatus = (index: number) => {
    setMilestones((prev) =>
      prev.map((milestone, milestoneIndex) =>
        milestoneIndex === index
          ? {
              ...milestone,
              status: milestone.status === "arrived" ? "arrived" : "in-transit",
              updatedAt: "Updated just now",
            }
          : milestone
      )
    );

    pushLog(`${deliveryRoute[index].city} set to In Transit.`);
    toast({ title: "Status updated", description: `${deliveryRoute[index].city} is now in transit.` });
  };

  const markArrived = (index: number) => {
    setMilestones((prev) =>
      prev.map((milestone, milestoneIndex) =>
        milestoneIndex === index
          ? {
              ...milestone,
              status: "arrived",
              updatedAt: "Arrived just now",
            }
          : milestone
      )
    );

    pushLog(`${deliveryRoute[index].city} marked as arrived.`);
    toast({ title: "Arrival saved", description: `${deliveryRoute[index].city} has been marked arrived.` });
  };

  return (
    <Card className="rounded-[2rem] border-[#F5DCE7] bg-white shadow-[0_24px_60px_rgba(255,92,168,0.08)] overflow-hidden">
      <CardHeader className="border-b border-[#F7E7EE] bg-gradient-to-r from-[#FFF6FA] to-white pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.24em] text-[#AF7A92]">Order Control</p>
            <CardTitle className="mt-1 font-serif text-2xl text-[#3F2533]">Manual Location Updates</CardTitle>
            <p className="mt-1 text-sm text-[#8F7181]">Use the admin panel to move the delivery milestone forward.</p>
          </div>
          <div className="rounded-full bg-[#FFF0F6] p-3 text-[#FF4D9D]">
            <History className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 p-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          {milestones.map((milestone, index) => {
            const isCurrent = currentMilestone.city === milestone.city;
            return (
              <div key={milestone.city} className="rounded-2xl border border-[#F6E3EC] bg-[#FFF9FC] p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#3F2533]">{milestone.city}</p>
                      <Badge
                        className={cn(
                          "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                          milestone.status === "arrived"
                            ? "bg-emerald-50 text-emerald-700"
                            : milestone.status === "in-transit"
                              ? "bg-[#FFF0F6] text-[#FF4D9D]"
                              : "bg-white text-[#9D7D8C]"
                        )}
                      >
                        {statusLabel(milestone.status)}
                      </Badge>
                      {isCurrent && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF0F6] px-2.5 py-0.5 text-[11px] font-medium text-[#FF4D9D]">
                          <Truck className="h-3 w-3" />
                          Active
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-[#8F7181]">{milestone.note}</p>
                    <p className="mt-1 text-xs text-[#AF7A92]">{milestone.updatedAt}</p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => updateStatus(index)}
                      className="rounded-full bg-[#FF4D9D] px-4 text-white shadow-[0_10px_20px_rgba(255,77,157,0.2)] hover:bg-[#F53B91]"
                    >
                      Update Status
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => markArrived(index)}
                      className="rounded-full border-[#F0CADA] text-[#FF4D9D] hover:bg-[#FFF0F6] hover:text-[#FF4D9D]"
                    >
                      Mark Arrived
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-3xl border border-[#F6E3EC] bg-[#FFF7FB] p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] text-[#AF7A92]">Text Log</p>
              <h4 className="mt-1 font-serif text-lg font-semibold text-[#3F2533]">Current Movement</h4>
            </div>
            <ArrowRight className="h-5 w-5 text-[#FF4D9D]" />
          </div>

          <div className="mt-4 space-y-3">
            {activityLog.map((entry, index) => (
              <div key={`${entry}-${index}`} className="rounded-2xl bg-white px-4 py-3 text-sm text-[#6F5565] shadow-sm">
                {entry}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
