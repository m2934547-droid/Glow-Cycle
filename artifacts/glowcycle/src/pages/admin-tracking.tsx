import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AdminOrderTrackingManager } from "@/components/admin-order-tracking-manager";

export default function AdminTracking() {
  return (
    <div className="mx-auto max-w-7xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
        <Link href="/dashboard">
          <Button variant="ghost" className="rounded-full px-0 text-muted-foreground hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to dashboard
          </Button>
        </Link>
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.24em] text-[#AF7A92]">Admin Control</p>
          <h1 className="flex items-center gap-3 font-serif text-3xl font-bold text-foreground md:text-4xl">
            <Truck className="h-8 w-8 text-primary" />
            Order Tracking Manager
          </h1>
          <p className="max-w-3xl text-lg text-muted-foreground">
            Search any order, place a manual shipment update on the map, and publish the event to the customer tracking page in real time.
          </p>
        </div>
      </motion.div>

      <AdminOrderTrackingManager />
    </div>
  );
}
