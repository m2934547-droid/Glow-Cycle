import { useEffect } from "react";
import {
  useGetCycles,
  useCreateCycle,
  useDeleteCycle,
  useGetCurrentCycle,
  useGetMe,
  useUpdateProfile,
  getGetCyclesQueryKey,
  getGetCurrentCycleQueryKey,
  getGetMeQueryKey,
  type GetMeQueryResult,
} from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format, differenceInDays } from "date-fns";
import { Trash2, Plus, Calendar as CalendarIcon, Droplets, Activity, Scale, Ruler, ShieldCheck, HeartPulse } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { calculateBmi, formatProfileDate, getBmiCategory, useProfileStore } from "@/lib/profile-store";

const cycleSchema = z.object({
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().optional(),
  cycleLength: z.coerce.number().min(15, "Min 15 days").max(45, "Max 45 days"),
  notes: z.string().optional(),
}).refine((d) => !d.endDate || d.endDate >= d.startDate, {
  message: "End date must be on or after start date",
  path: ["endDate"],
});

type CycleFormValues = z.infer<typeof cycleSchema>;

const healthSchema = z.object({
  heightCm: z.coerce.number().min(80, "Height should be at least 80 cm").max(260, "Height looks too high"),
  weightKg: z.coerce.number().min(25, "Weight should be at least 25 kg").max(400, "Weight looks too high"),
  bloodGroup: z.string().min(1, "Please select a blood group"),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  medications: z.string().optional(),
});

type HealthFormValues = z.infer<typeof healthSchema>;

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

function HealthSummary({
  heightCm,
  weightKg,
  bloodGroup,
}: {
  heightCm?: number;
  weightKg?: number;
  bloodGroup?: string;
}) {
  const bmi = calculateBmi(weightKg, heightCm);
  const bmiCategory = getBmiCategory(bmi);

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-2xl border border-border bg-background/70 p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">BMI</p>
        <div className="mt-2 flex items-end gap-2">
          <span className="font-serif text-2xl font-semibold text-foreground">{bmi ?? "N/A"}</span>
          <span
            className={cn(
              "mb-0.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold",
              bmiCategory === "Underweight"
                ? "border-blue-200 bg-blue-100 text-blue-800"
                : bmiCategory === "Normal"
                  ? "border-green-200 bg-green-100 text-green-800"
                  : bmiCategory === "Overweight"
                    ? "border-orange-200 bg-orange-100 text-orange-800"
                    : "border-rose-200 bg-rose-100 text-rose-800"
            )}
          >
            {bmiCategory}
          </span>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          Body mass index updates automatically from height and weight.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-background/70 p-4">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Health context</p>
        <div className="mt-2 space-y-2 text-sm text-foreground">
          <p className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span>Blood group: {bloodGroup || "Not set"}</span>
          </p>
          <p className="flex items-center gap-2">
            <HeartPulse className="h-4 w-4 text-primary" />
            <span>Cycle insights stay personal and easy to read.</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Tracker() {
  const { data: cycles, isLoading: isCyclesLoading } = useGetCycles({ query: { queryKey: getGetCyclesQueryKey() } });
  const { data: currentCycle, isLoading: isCurrentLoading } = useGetCurrentCycle({ query: { queryKey: getGetCurrentCycleQueryKey() } });
  const queryClient = useQueryClient();
  const cachedUser = queryClient.getQueryData<GetMeQueryResult>(getGetMeQueryKey());
  const { data: currentUser } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      initialData: cachedUser,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
    },
  });

  const createCycle = useCreateCycle();
  const deleteCycle = useDeleteCycle();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();
  const [profileStore, setProfileStore] = useProfileStore(currentUser ?? cachedUser);

  const form = useForm<CycleFormValues>({
    resolver: zodResolver(cycleSchema),
    defaultValues: {
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      cycleLength: 28,
      notes: "",
    },
  });

  const healthForm = useForm<HealthFormValues>({
    resolver: zodResolver(healthSchema),
    defaultValues: {
      heightCm: currentUser?.heightCm ?? 0,
      weightKg: currentUser?.weightKg ?? 0,
      bloodGroup: profileStore?.bloodGroup ?? "",
      allergies: profileStore?.allergies ?? "",
      medicalConditions: profileStore?.medicalConditions ?? "",
      medications: profileStore?.medications ?? "",
    },
  });

  const liveHeight = healthForm.watch("heightCm");
  const liveWeight = healthForm.watch("weightKg");
  const liveBloodGroup = healthForm.watch("bloodGroup");
  const liveBmi = calculateBmi(liveWeight, liveHeight);
  const liveBmiCategory = getBmiCategory(liveBmi);

  useEffect(() => {
    if (!currentUser) return;

    healthForm.reset({
      heightCm: currentUser.heightCm ?? 0,
      weightKg: currentUser.weightKg ?? 0,
      bloodGroup: profileStore?.bloodGroup ?? "",
      allergies: profileStore?.allergies ?? "",
      medicalConditions: profileStore?.medicalConditions ?? "",
      medications: profileStore?.medications ?? "",
    });
  }, [currentUser, profileStore, healthForm]);

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

  const onHealthSubmit = (data: HealthFormValues) => {
    if (!currentUser) return;

    updateProfile.mutate(
      {
        data: {
          heightCm: data.heightCm,
          weightKg: data.weightKg,
        },
      },
      {
        onSuccess: () => {
          queryClient.setQueryData<GetMeQueryResult>(getGetMeQueryKey(), (current) =>
            current
              ? {
                  ...current,
                  heightCm: data.heightCm,
                  weightKg: data.weightKg,
                  bmi: calculateBmi(data.weightKg, data.heightCm) ?? current.bmi,
                  bmiCategory: getBmiCategory(calculateBmi(data.weightKg, data.heightCm)),
                }
              : current
          );

          setProfileStore((current) =>
            current
              ? {
                  ...current,
                  bloodGroup: data.bloodGroup,
                  allergies: data.allergies?.trim() ?? "",
                  medicalConditions: data.medicalConditions?.trim() ?? "",
                  medications: data.medications?.trim() ?? "",
                  lastUpdatedAt: new Date().toISOString(),
                }
              : current
          );

          toast({ title: "Health data saved", description: "Your BMI and health context were updated." });
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save health data.", variant: "destructive" });
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
                    <div className="grid grid-cols-2 gap-3">
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
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Date <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                            <FormControl>
                              <Input type="date" className="rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
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

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}>
            <Card className="rounded-[2rem] border-primary/10 shadow-md overflow-hidden bg-card/80 backdrop-blur-xl">
              <CardHeader className="bg-primary/5 pb-4">
                <CardTitle className="flex items-center gap-2 text-xl font-serif">
                  <Activity className="h-5 w-5 text-primary" /> Personal Health Information
                </CardTitle>
                <CardDescription>These details stay with your tracker and help contextualize cycle insights.</CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <Form {...healthForm}>
                  <form onSubmit={healthForm.handleSubmit(onHealthSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <FormField
                        control={healthForm.control}
                        name="heightCm"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Height (cm)</FormLabel>
                            <FormControl>
                              <Input type="number" className="rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={healthForm.control}
                        name="weightKg"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Weight (kg)</FormLabel>
                            <FormControl>
                              <Input type="number" className="rounded-xl" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={healthForm.control}
                      name="bloodGroup"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Blood Group</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger className="rounded-xl">
                                <SelectValue placeholder="Select blood group" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {BLOOD_GROUPS.map((group) => (
                                <SelectItem key={group} value={group}>
                                  {group}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={healthForm.control}
                      name="allergies"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Allergies</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Optional allergies..." className="rounded-xl resize-none h-20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={healthForm.control}
                      name="medicalConditions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medical Conditions</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Optional conditions..." className="rounded-xl resize-none h-20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={healthForm.control}
                      name="medications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medications</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Optional medications..." className="rounded-xl resize-none h-20" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <HealthSummary
                      heightCm={liveHeight}
                      weightKg={liveWeight}
                      bloodGroup={liveBloodGroup}
                    />

                    <Button type="submit" className="w-full rounded-xl hover-elevate" disabled={updateProfile.isPending}>
                      {updateProfile.isPending ? "Saving..." : "Save Health Information"}
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
                  <div className="flex justify-between items-center pb-3 border-b border-border/50">
                    <span className="text-muted-foreground text-sm flex items-center gap-2">
                      <Scale className="h-4 w-4 text-primary" /> BMI Context
                    </span>
                    <span className="font-medium text-foreground text-sm text-right">
                      {liveBmi ?? "N/A"} {liveBmi ? `(${liveBmiCategory})` : ""}
                    </span>
                  </div>
                  {profileStore?.allergies || profileStore?.medicalConditions || profileStore?.medications ? (
                    <div className="rounded-2xl border border-border/50 bg-background/60 p-4">
                      <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Health notes</p>
                      <p className="mt-2 text-sm text-foreground/80">
                        {profileStore.allergies ? `Allergies: ${profileStore.allergies}. ` : ""}
                        {profileStore.medicalConditions ? `Conditions: ${profileStore.medicalConditions}. ` : ""}
                        {profileStore.medications ? `Medications: ${profileStore.medications}.` : ""}
                      </p>
                    </div>
                  ) : null}
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
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded-full px-2.5 py-0.5">
                                <Droplets className="h-3.5 w-3.5" /> Period
                              </span>
                            </div>
                            <div className="flex flex-wrap items-center gap-x-2 mt-2">
                              <p className="font-medium text-base text-foreground">
                                {format(new Date(cycle.startDate), "MMM d, yyyy")}
                              </p>
                              {cycle.endDate && (
                                <>
                                  <span className="text-muted-foreground">→</span>
                                  <p className="font-medium text-base text-foreground">
                                    {format(new Date(cycle.endDate), "MMM d, yyyy")}
                                  </p>
                                  <span className="text-xs text-rose-500 font-medium bg-rose-50 rounded-full px-2 py-0.5">
                                    {differenceInDays(new Date(cycle.endDate), new Date(cycle.startDate)) + 1} day period
                                  </span>
                                </>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1">
                              Cycle: {actualLength} days
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
