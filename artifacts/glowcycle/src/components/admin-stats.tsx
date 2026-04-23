import { useAdminGetStats, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Activity, ShoppingBag, IndianRupee, Package, Shield, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string | number; sub?: string; color: string }) => (
  <Card className={`rounded-[2rem] border-primary/10 shadow-sm ${color}`}>
    <CardContent className="p-6">
      <Icon className="h-8 w-8 mb-4 opacity-70" />
      <p className="text-3xl font-bold font-serif">{value}</p>
      <p className="text-muted-foreground font-medium mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

export function AdminStats() {
  const { data: stats, isLoading } = useAdminGetStats({ query: { queryKey: getAdminGetStatsQueryKey() } });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-6 w-48" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-32 rounded-[2rem]" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" /> Last 30 Days
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard
            icon={IndianRupee}
            label="Revenue Generated"
            value={`₹${((stats as any).revenueLastl30Days ?? 0).toLocaleString("en-IN")}`}
            sub="From completed orders"
            color="bg-green-50 dark:bg-green-900/20 text-green-700"
          />
          <StatCard
            icon={Package}
            label="Orders Placed"
            value={(stats as any).ordersLast30Days ?? 0}
            sub="Completed checkouts"
            color="bg-pink-50 dark:bg-pink-900/20 text-pink-700"
          />
          <StatCard
            icon={ShoppingBag}
            label="Items Ordered"
            value={(stats as any).itemsOrderedLast30Days ?? 0}
            sub="Total units sold"
            color="bg-purple-50 dark:bg-purple-900/20 text-purple-700"
          />
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Platform Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard icon={Users} label="Total Users" value={stats.totalUsers} color="bg-blue-50 dark:bg-blue-900/20 text-blue-700" />
          <StatCard icon={Activity} label="New Users (30d)" value={stats.activeUsersThisMonth} color="bg-amber-50 dark:bg-amber-900/20 text-amber-700" />
          <StatCard icon={ShoppingBag} label="Products in Store" value={stats.totalProducts} color="bg-rose-50 dark:bg-rose-900/20 text-rose-700" />
          <StatCard icon={Activity} label="Cycles Tracked" value={stats.totalCycles} color="bg-teal-50 dark:bg-teal-900/20 text-teal-700" />
        </div>
      </div>
    </motion.div>
  );
}
