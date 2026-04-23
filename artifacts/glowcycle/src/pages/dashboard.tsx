import { useGetMe, useGetCurrentCycle, useGetMotivationalQuote, getGetMeQueryKey, getGetCurrentCycleQueryKey, getGetMotivationalQuoteQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Droplet, Heart, Activity, Sparkles, User as UserIcon } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { SharedWithMe } from "@/components/shared-with-me";

export default function Dashboard() {
  const { data: user, isLoading: isUserLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const { data: currentCycle, isLoading: isCycleLoading } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });
  const { data: quote, isLoading: isQuoteLoading } = useGetMotivationalQuote({ query: { queryKey: getGetMotivationalQuoteQueryKey() } });

  const getPhaseColor = (phase?: string) => {
    switch (phase?.toLowerCase()) {
      case 'menstrual': return 'bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/30 dark:text-rose-300';
      case 'follicular': return 'bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-900/30 dark:text-pink-300';
      case 'ovulation': return 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300';
      case 'luteal': return 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300';
      default: return 'bg-secondary text-secondary-foreground border-secondary/50';
    }
  };

  const getBmiColor = (category?: string) => {
    if (!category) return 'text-muted-foreground';
    if (category.toLowerCase().includes('normal')) return 'text-green-600 dark:text-green-400';
    if (category.toLowerCase().includes('under')) return 'text-blue-600 dark:text-blue-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  if (isUserLoading || isCycleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-[2rem]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <motion.div 
        initial={{ opacity: 0, y: -10 }} 
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
            {(() => {
              const h = new Date().getHours();
              if (h < 12) return "Good morning";
              if (h < 17) return "Good afternoon";
              return "Good evening";
            })()}, <span className="text-primary">{user?.name}</span>
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">Here's your wellness overview today.</p>
        </div>
      </motion.div>

      <SharedWithMe />

      {/* Quote Section */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} 
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
      >
        <Card className="bg-gradient-to-br from-primary/10 to-secondary/20 border-none shadow-sm rounded-[2rem] overflow-hidden">
          <CardContent className="p-8 flex items-center gap-6">
            <div className="hidden sm:flex h-16 w-16 rounded-full bg-white/50 backdrop-blur items-center justify-center shrink-0">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <div>
              {isQuoteLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-6 w-full max-w-lg" />
                  <Skeleton className="h-4 w-32" />
                </div>
              ) : (
                <>
                  <p className="text-xl md:text-2xl font-serif italic text-foreground/80 leading-relaxed">
                    "{quote?.text}"
                  </p>
                  <p className="text-sm font-medium text-primary mt-3">— {quote?.author}</p>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Cycle Status */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-4 w-4" /> Current Phase
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentCycle ? (
                <div className="space-y-4">
                  <div className={cn("inline-flex px-4 py-1.5 rounded-full text-sm font-medium border capitalize", getPhaseColor(currentCycle.currentPhase))}>
                    {currentCycle.currentPhase} Phase
                  </div>
                  <div>
                    <p className="text-3xl font-serif font-bold">Day {currentCycle.cycleDay}</p>
                    <p className="text-sm text-muted-foreground mt-1">of your cycle</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">No cycle data available. Log your period to get predictions.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Next Period */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Droplet className="h-4 w-4" /> Next Period
              </CardTitle>
            </CardHeader>
            <CardContent>
              {currentCycle ? (
                <div className="space-y-2">
                  <p className="text-4xl font-serif font-bold text-primary">
                    {currentCycle.daysUntilNextPeriod}
                  </p>
                  <p className="text-sm text-muted-foreground">Days remaining</p>
                  <p className="text-xs font-medium text-foreground mt-4 pt-4 border-t border-border/50">
                    Predicted: {new Date(currentCycle.nextPeriodDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">Waiting for data...</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Health Profile */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate overflow-hidden">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <UserIcon className="h-4 w-4" /> Your Body
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-3xl font-serif font-bold">{user?.bmi}</p>
                    <p className="text-sm text-muted-foreground">BMI</p>
                  </div>
                  <p className={cn("text-sm font-medium mt-1", getBmiColor(user?.bmiCategory))}>
                    {user?.bmiCategory || 'Unknown'}
                  </p>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground pt-4 border-t border-border/50">
                  <div><span className="font-medium text-foreground">{user?.heightCm}</span> cm</div>
                  <div><span className="font-medium text-foreground">{user?.weightKg}</span> kg</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Tips teaser */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
          <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate bg-secondary/10 overflow-hidden relative">
            <div className="absolute -right-4 -bottom-4 opacity-10">
              <Heart className="h-32 w-32" />
            </div>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2 relative z-10">
                <Heart className="h-4 w-4" /> Self Care
              </CardTitle>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="space-y-2">
                <p className="font-medium text-foreground leading-snug">
                  {currentCycle?.currentPhase === 'menstrual' ? "Rest and hydrate today." : 
                   currentCycle?.currentPhase === 'follicular' ? "Try a light workout!" :
                   currentCycle?.currentPhase === 'ovulation' ? "Your energy is peaking!" :
                   "Focus on nourishing foods."}
                </p>
                <p className="text-sm text-muted-foreground mt-4">
                  Check your <a href="/wellness" className="text-primary hover:underline">Wellness</a> tab for full daily tips.
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
