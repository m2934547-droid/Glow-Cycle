import { useLocation } from "wouter";
import { useEffect, useState } from "react";
import { useGetMe, useUpdateProfile, getGetMeQueryKey, type GetMeQueryResult } from "@workspace/api-client-react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CheckCircle2, CalendarDays, Heart, Mail, Phone, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { PartnersSection } from "@/components/partners-section";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(10, "Must be at least 10").max(100, "Invalid age"),
  heightCm: z.coerce.number().min(100, "Invalid height").max(250, "Invalid height"),
  weightKg: z.coerce.number().min(30, "Invalid weight").max(300, "Invalid weight"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type ProfileView = "overview" | "my-profile" | "add-partner";
type MeUser = GetMeQueryResult;

const PROFILE_VIEWS: Array<{ value: ProfileView; label: string }> = [
  { value: "overview", label: "Profile Overview" },
  { value: "my-profile", label: "My Profile" },
  { value: "add-partner", label: "Add Partner" },
];

function getProfileView(location: string): ProfileView {
  const searchFromLocation = location.includes("?") ? location.split("?")[1] ?? "" : "";
  const currentSearch =
    searchFromLocation ||
    (typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "");
  const view = new URLSearchParams(currentSearch).get("view");

  if (view === "my-profile" || view === "add-partner" || view === "overview") {
    return view;
  }

  const hashFromLocation = location.includes("#") ? location.split("#")[1] ?? "" : "";
  const currentHash =
    hashFromLocation ||
    (typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "");

  if (currentHash === "partner-information") {
    return "add-partner";
  }

  return "overview";
}

function ProfileTabs({
  activeView,
  onChange,
}: {
  activeView: ProfileView;
  onChange: (view: ProfileView) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[1.75rem] border border-primary/10 bg-card/70 p-2 shadow-sm backdrop-blur-xl">
      {PROFILE_VIEWS.map((view) => (
        <button
          key={view.value}
          type="button"
          onClick={() => onChange(view.value)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
            activeView === view.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

function PersonalInformationCard({ user }: { user: MeUser }) {
  return (
    <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
      <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-serif">
              <User className="h-6 w-6 text-primary" />
              Personal Information
            </CardTitle>
            <CardDescription className="mt-1">
              Your account details at a glance.
            </CardDescription>
          </div>
          <div className="shrink-0 rounded-full bg-background p-3 text-primary shadow-sm">
            <User className="h-6 w-6" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Name</p>
            <p className="mt-2 text-base font-medium text-foreground">{user.name ?? "Not available"}</p>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Email</p>
            <p className="mt-2 flex items-center gap-2 text-base font-medium text-foreground">
              <Mail className="h-4 w-4 text-primary" />
              <span className="truncate">{user.email ?? "Not available"}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Phone</p>
            <p className="mt-2 flex items-center gap-2 text-base font-medium text-foreground">
              <Phone className="h-4 w-4 text-primary" />
              <span>{user.phoneNumber ?? "Not available"}</span>
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background/60 p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Age</p>
            <p className="mt-2 flex items-center gap-2 text-base font-medium text-foreground">
              <CalendarDays className="h-4 w-4 text-primary" />
              <span>{user.age ?? "Not available"} years</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HealthProfileCard({
  user,
  form,
  onSubmit,
  isSaving,
}: {
  user: MeUser;
  form: UseFormReturn<ProfileFormValues>;
  onSubmit: (data: ProfileFormValues) => void;
  isSaving: boolean;
}) {
  const getBmiColor = (category?: string) => {
    if (!category) return "bg-muted text-muted-foreground";
    if (category.toLowerCase().includes("normal")) return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200";
    if (category.toLowerCase().includes("under")) return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200";
    return "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200";
  };

  return (
    <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
      <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-serif">
              <Activity className="h-6 w-6 text-primary" />
              Health Metrics
            </CardTitle>
            <CardDescription className="mt-1">Your Body Mass Index (BMI) overview</CardDescription>
          </div>
          <div className="shrink-0 rounded-full bg-background p-3 text-primary shadow-sm">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-end gap-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Current BMI</p>
            <p className="mt-1 text-4xl font-serif font-bold text-foreground">{user.bmi}</p>
          </div>
          <div className={cn("mb-1 rounded-full border px-4 py-1.5 text-sm font-bold", getBmiColor(user.bmiCategory))}>
            {user.bmiCategory}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">Full Name</FormLabel>
                  <FormControl>
                    <Input className="h-12 rounded-xl bg-background/50" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Age</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-12 rounded-xl bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="heightCm"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Height (cm)</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-12 rounded-xl bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="weightKg"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">Weight (kg)</FormLabel>
                    <FormControl>
                      <Input type="number" className="h-12 rounded-xl bg-background/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" className="h-12 gap-2 rounded-xl px-8 text-lg shadow-md" disabled={isSaving}>
                {isSaving ? "Saving..." : <><CheckCircle2 className="h-5 w-5" /> Save Changes</>}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

export default function Profile() {
  const [location, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<ProfileView>(() => getProfileView(location));
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(activeView === "add-partner");
  const queryClient = useQueryClient();
  const cachedUser = queryClient.getQueryData<GetMeQueryResult>(getGetMeQueryKey());
  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      initialData: cachedUser,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
    },
  });
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();
  const activeUser = user ?? cachedUser;

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: "", age: 0, heightCm: 0, weightKg: 0 },
  });

  useEffect(() => {
    if (!activeUser) return;

    form.reset({
      name: activeUser.name,
      age: activeUser.age,
      heightCm: activeUser.heightCm,
      weightKg: activeUser.weightKg,
    });
  }, [activeUser, form]);

  useEffect(() => {
    setIsPartnerDialogOpen(activeView === "add-partner");
  }, [activeView]);

  useEffect(() => {
    const nextView = getProfileView(location);

    setActiveView((currentView) => (currentView === nextView ? currentView : nextView));
  }, [location]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Profile updated", description: "Your profile has been saved successfully." });
        },
        onError: () => {
          toast({ title: "Update failed", description: "Could not update your profile.", variant: "destructive" });
        },
      }
    );
  };

  if (!activeUser && isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-8 pb-10">
        <div className="space-y-4">
          <Skeleton className="h-12 w-64 rounded-xl" />
          <Skeleton className="h-10 w-96 rounded-full" />
        </div>
        <Skeleton className="h-64 rounded-[2rem]" />
        <Skeleton className="h-[420px] rounded-[2rem]" />
        <Skeleton className="h-80 rounded-[2rem]" />
      </div>
    );
  }

  if (!activeUser) {
    return (
      <div className="mx-auto max-w-4xl">
        <Card className="rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
          <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="rounded-full bg-primary/10 p-4 text-primary">
              <User className="h-7 w-7" />
            </div>
            <div className="space-y-2">
              <h1 className="font-serif text-2xl font-semibold text-foreground">Profile unavailable</h1>
              <p className="text-muted-foreground">We could not load your profile right now. Please try again.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const heroTitle =
    activeView === "my-profile"
      ? "My Profile"
      : activeView === "add-partner"
        ? "Add Partner"
        : "Profile Overview";

  const heroDescription =
    activeView === "my-profile"
      ? "View only your personal account information."
      : activeView === "add-partner"
        ? "Add a trusted partner from the pop-up form."
        : "See your personal information, health data, and partner details in one place.";

  const handlePartnerDialogChange = (open: boolean) => {
    setIsPartnerDialogOpen(open);

    if (!open && activeView === "add-partner") {
      setActiveView("overview");
      setLocation("/profile?view=overview");
    }
  };

  const handleTabChange = (view: ProfileView) => {
    setActiveView(view);
    setLocation(`/profile?view=${view}`);
  };

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start">
        <div className="space-y-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-serif font-bold text-foreground md:text-4xl">
              <Heart className="h-8 w-8 text-primary" />
              {heroTitle}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">{heroDescription}</p>
          </div>
          <ProfileTabs activeView={activeView} onChange={handleTabChange} />
        </div>
      </motion.div>

      {activeView === "my-profile" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <PersonalInformationCard user={activeUser} />
      </motion.div>
      )}

      {activeView === "overview" && (
        <>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <PersonalInformationCard user={activeUser} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <HealthProfileCard user={activeUser} form={form} onSubmit={onSubmit} isSaving={updateProfileMutation.isPending} />
        </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
            <PartnersSection variant="list" showEmptyState={false} showActions={false} />
          </motion.div>
        </>
      )}

      <Dialog open={isPartnerDialogOpen} onOpenChange={handlePartnerDialogChange}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl">
          <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <Heart className="h-6 w-6 text-primary" />
              Add Partner
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a trusted partner from this dialog, then return to your profile overview.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <PartnersSection
              variant="form"
              onSuccess={() => {
                setIsPartnerDialogOpen(false);
                setLocation("/profile?view=overview");
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
