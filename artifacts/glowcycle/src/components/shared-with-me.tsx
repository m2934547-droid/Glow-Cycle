import { useGetSharedWithMe, getGetSharedWithMeQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Heart, Calendar } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const PHASE_STYLES: Record<string, { bg: string; text: string; emoji: string }> = {
  menstrual: { bg: "bg-rose-100 dark:bg-rose-900/30", text: "text-rose-700 dark:text-rose-300", emoji: "" },
  follicular: { bg: "bg-pink-100 dark:bg-pink-900/30", text: "text-pink-700 dark:text-pink-300", emoji: "" },
  ovulation: { bg: "bg-purple-100 dark:bg-purple-900/30", text: "text-purple-700 dark:text-purple-300", emoji: "" },
  luteal: { bg: "bg-amber-100 dark:bg-amber-900/30", text: "text-amber-700 dark:text-amber-300", emoji: "" },
};

export function SharedWithMe() {
  const { data: notifications, isLoading } = useGetSharedWithMe({ query: { queryKey: getGetSharedWithMeQueryKey() } });

  if (isLoading) {
    return <Skeleton className="h-40 rounded-[2rem]" />;
  }

  if (!notifications || notifications.length === 0) {
    return null;
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
      <Card className="rounded-[2rem] border-primary/10 shadow-md overflow-hidden bg-card/80 backdrop-blur-xl">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-pink-50 dark:from-primary/10 dark:to-pink-900/10 border-b border-primary/10">
          <CardTitle className="text-xl font-serif flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Cycle Updates from People You Care About
          </CardTitle>
          <CardDescription>
            {notifications.length} {notifications.length === 1 ? "person has" : "people have"} added you as a trusted partner.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          {notifications.map((n, i) => {
            const styles = PHASE_STYLES[n.currentPhase] ?? PHASE_STYLES.follicular;
            return (
              <motion.div
                key={`${n.ownerEmail}-${i}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                className={cn("rounded-2xl p-5 border", styles.bg, "border-current/10")}
              >
                <div className="flex items-start gap-4">
                  <div className={cn("w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center font-bold text-lg shrink-0", styles.text)}>
                    {n.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{n.ownerName}</p>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-background/60 text-muted-foreground capitalize">
                        {n.relationship}
                      </span>
                      <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", styles.text, "bg-background/60")}>
                        {n.currentPhase} phase · day {n.cycleDay}
                      </span>
                    </div>
                    <p className={cn("text-sm leading-relaxed", styles.text)}>{n.message}</p>
                    <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      Next period: {new Date(n.nextPeriodDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      <span className="opacity-60">·</span>
                      <Heart className="h-3 w-3 text-primary" />
                      Be supportive
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </CardContent>
      </Card>
    </motion.div>
  );
}
