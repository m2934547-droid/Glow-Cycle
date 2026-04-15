import { useGetCycles, useCreateCycle, useDeleteCycle, useGetCurrentCycle, getGetCyclesQueryKey, getGetCurrentCycleQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import { Trash2, Plus, Calendar as CalendarIcon, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

const cycleSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  cycleLength: z.coerce.number().min(15, "Min 15 days").max(45, "Max 45 days"),
  notes: z.string().optional(),
});

type CycleFormValues = z.infer<typeof cycleSchema>;

export default function Tracker() {
  const { data: cycles, isLoading: isCyclesLoading } = useGetCycles({ query: { queryKey: getGetCyclesQueryKey() } });
  const { data: currentCycle, isLoading: isCurrentLoading } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });
  
  const createCycle = useCreateCycle();
  const deleteCycle = useDeleteCycle();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<CycleFormValues>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      cycleLength: 28,
      notes: "",
    },
  });

  const onSubmit = (data: CycleFormValues) => {
    createCycle.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCyclesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCurrentCycleQueryKey() });
          toast({ title: "Period logged", description: "Your cycle has been updated." });
          form.reset({ ...data, notes: "" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to log period.", variant: "destructive" });
        },
      }
    );
  };

  const handleDelete = (id: number) => {
    deleteCycle.mutate(
      { cycleId: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCyclesQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetCurrentCycleQueryKey() });
          toast({ title: "Entry deleted" });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to delete entry.", variant: "destructive" });
        },
      }
    );
  };

  if (isCyclesLoading || isCurrentLoading) {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        <Skeleton className="h-10 w-48" />
        <div className="grid md:grid-cols-2 gap-6">
          <Skeleton className="h-96 rounded-[2rem]" />
          <Skeleton className="h-96 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">Cycle Tracker</h1>
        <p className="text-muted-foreground mt-2">Log your period and view predictions.</p>
      </motion.div>

      <div className="grid md:grid-cols-12 gap-8">
        {/* Left Column - Log Form & Predictions */}
        <div className="md:col-span-5 space-y-8">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card className="rounded-[2rem] border-primary/10 shadow-md overflow-hidden bg-card/80 backdrop-blur-xl">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-serif">
                  <Plus className="h-5 w-5 text-primary" /> Log New Period
                </CardTitle>
                <CardDescription>Enter the first day of your period.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Date</FormLabel>
                          <FormControl>
                            <Input type="date" className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="cycleLength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Average Cycle Length (days)</FormLabel>
                          <FormControl>
                            <Input type="number" className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes (optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Symptoms, flow, mood..." className="rounded-xl resize-none h-24" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" className="w-full rounded-xl hover-elevate mt-2" disabled={createCycle.isPending}>
                      {createCycle.isPending ? "Saving..." : "Log Period"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </motion.div>

          {currentCycle && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card className="rounded-[2rem] border-primary/10 shadow-md bg-gradient-to-br from-secondary/30 to-background overflow-hidden">
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-serif">Current Cycle Insights</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-primary" /> Next Period
                    </span>
                    <span className="font-medium text-foreground">
                      {format(new Date(currentCycle.nextPeriodDate), "MMM d, yyyy")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                      <CalendarIcon className="h-4 w-4 text-purple-500" /> Ovulation
                    </span>
                    <span className="font-medium text-foreground">
                      {format(new Date(currentCycle.ovulationDate), "MMM d")}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                      <span className="h-4 w-4 rounded-full bg-pink-200 border border-pink-300 inline-block"></span> Fertile Window
                    </span>
                    <span className="font-medium text-foreground text-sm text-right">
                      {format(new Date(currentCycle.fertileWindowStart), "MMM d")} - {format(new Date(currentCycle.fertileWindowEnd), "MMM d")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>

        {/* Right Column - History */}
        <div className="md:col-span-7">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="h-full">
            <Card className="rounded-[2rem] border-primary/10 shadow-md h-full flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-serif">Cycle History</CardTitle>
                <CardDescription>Your past logged periods.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                {!cycles || cycles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center text-muted-foreground">
                    <CalendarIcon className="h-12 w-12 opacity-20 mb-3" />
                    <p>No cycles logged yet.</p>
                    <p className="text-sm mt-1">Add your first period to see history.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cycles.map((cycle, index) => {
                      // Calculate actual length based on the next cycle in the list
                      let actualLength = cycle.cycleLength;
                      if (index > 0) {
                        const nextCycleDate = new Date(cycles[index - 1].startDate);
                        const thisCycleDate = new Date(cycle.startDate);
                        actualLength = differenceInDays(nextCycleDate, thisCycleDate);
                      }

                      return (
                        <div key={cycle.id} className="p-4 rounded-2xl border bg-card hover:bg-muted/50 transition-colors flex items-start justify-between group">
                          <div>
                            <p className="font-medium text-lg text-foreground">
                              {format(new Date(cycle.startDate), "MMMM d, yyyy")}
                            </p>
                            <p className="text-sm text-muted-foreground mt-1">
                              {actualLength} days
                            </p>
                            {cycle.notes && (
                              <p className="text-sm text-foreground/80 mt-2 bg-secondary/20 p-2 rounded-lg italic">
                                "{cycle.notes}"
                              </p>
                            )}
                          </div>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => handleDelete(cycle.id)}
                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Delete entry"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
