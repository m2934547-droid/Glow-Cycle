import { useState } from "react";
import { useGetWellnessTips, useGetCurrentCycle, getGetWellnessTipsQueryKey, getGetCurrentCycleQueryKey } from "@workspace/api-client-react";
import { GetWellnessTipsPhase } from "@workspace/api-zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { HeartPulse, Droplets, Apple, Dumbbell, Coffee, Smile } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MusicSuggestions } from "@/components/music-suggestions";

export default function Wellness() {
  const { data: currentCycle, isLoading: isCycleLoading } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });
  
  const [selectedPhase, setSelectedPhase] = useState<GetWellnessTipsPhase | undefined>(undefined);
  
  const activePhase = selectedPhase || (currentCycle?.currentPhase as GetWellnessTipsPhase) || 'menstrual';

  const { data: tips, isLoading: isTipsLoading } = useGetWellnessTips(
    { phase: activePhase },
    { query: { queryKey: getGetWellnessTipsQueryKey({ phase: activePhase }) } }
  );

  const phases: { id: GetWellnessTipsPhase; label: string; color: string }[] = [
    { id: 'menstrual', label: 'Menstrual', color: 'bg-rose-100 text-rose-700 border-rose-200' },
    { id: 'follicular', label: 'Follicular', color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { id: 'ovulation', label: 'Ovulation', color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { id: 'luteal', label: 'Luteal', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  ];

  if (isCycleLoading) {
    return (
      <div className="space-y-6 max-w-5xl mx-auto">
        <Skeleton className="h-12 w-64 rounded-xl" />
        <Skeleton className="h-[200px] rounded-[2rem]" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[300px] rounded-[2rem]" />
          <Skeleton className="h-[300px] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <HeartPulse className="h-8 w-8 text-primary" />
          Wellness Guide
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Personalized self-care, nutrition, and exercise advice for every phase of your cycle.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="flex flex-wrap gap-2 p-1 bg-muted/50 rounded-2xl w-fit">
          {phases.map((phase) => (
            <button
              key={phase.id}
              onClick={() => setSelectedPhase(phase.id)}
              className={cn(
                "px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300",
                activePhase === phase.id 
                  ? "bg-background shadow-sm text-foreground" 
                  : "text-muted-foreground hover:bg-background/50"
              )}
            >
              {phase.label} Phase
              {currentCycle?.currentPhase === phase.id && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-primary font-bold">Current</span>
              )}
            </button>
          ))}
        </div>
      </motion.div>

      {isTipsLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-[200px] rounded-[2rem]" />
          <Skeleton className="h-[200px] rounded-[2rem]" />
          <Skeleton className="h-[200px] rounded-[2rem]" />
          <Skeleton className="h-[200px] rounded-[2rem]" />
        </div>
      ) : tips ? (
        <div className="space-y-8">
          <motion.div 
            key={activePhase}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="rounded-[2rem] border-primary/10 shadow-md bg-gradient-to-r from-primary/5 to-secondary/10 overflow-hidden">
              <CardContent className="p-8">
                <h2 className="text-2xl font-serif font-bold text-foreground capitalize mb-2">
                  The {tips.phase} Phase
                </h2>
                <p className="text-muted-foreground leading-relaxed">
                  {tips.phaseDescription}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <MusicSuggestions phase={activePhase} />

          <div className="grid md:grid-cols-2 gap-6">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate overflow-hidden">
                <CardHeader className="bg-orange-50/50 dark:bg-orange-950/20 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-serif text-orange-700 dark:text-orange-400">
                    <Apple className="h-5 w-5" /> Nutrition
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {tips.dietTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 shrink-0" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate overflow-hidden">
                <CardHeader className="bg-blue-50/50 dark:bg-blue-950/20 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-serif text-blue-700 dark:text-blue-400">
                    <Dumbbell className="h-5 w-5" /> Movement
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {tips.exerciseTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate overflow-hidden">
                <CardHeader className="bg-rose-50/50 dark:bg-rose-950/20 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-serif text-rose-700 dark:text-rose-400">
                    <Coffee className="h-5 w-5" /> Self Care
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {tips.selfCareTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 shrink-0" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
              <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate overflow-hidden">
                <CardHeader className="bg-purple-50/50 dark:bg-purple-950/20 pb-4">
                  <CardTitle className="flex items-center gap-2 text-xl font-serif text-purple-700 dark:text-purple-400">
                    <Smile className="h-5 w-5" /> Mood & Mindset
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <ul className="space-y-4">
                    {tips.moodTips.map((tip, i) => (
                      <li key={i} className="flex gap-3 text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
                        <span className="leading-relaxed">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
