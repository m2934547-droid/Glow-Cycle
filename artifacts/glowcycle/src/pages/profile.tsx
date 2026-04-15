import { useGetMe, useUpdateProfile, getGetMeQueryKey } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { User, Activity, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  age: z.coerce.number().min(10, "Must be at least 10").max(100, "Invalid age"),
  heightCm: z.coerce.number().min(100, "Invalid height").max(250, "Invalid height"),
  weightKg: z.coerce.number().min(30, "Invalid weight").max(300, "Invalid weight"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function Profile() {
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });
  const updateProfileMutation = useUpdateProfile();
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      age: 0,
      heightCm: 0,
      weightKg: 0,
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        age: user.age,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
      });
    }
  }, [user, form]);

  const onSubmit = (data: ProfileFormValues) => {
    updateProfileMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ 
            title: "Profile updated", 
            description: "Your profile has been saved successfully.",
          });
        },
        onError: () => {
          toast({ 
            title: "Update failed", 
            description: "Could not update your profile.", 
            variant: "destructive" 
          });
        },
      }
    );
  };

  const getBmiColor = (category?: string) => {
    if (!category) return 'bg-muted text-muted-foreground';
    if (category.toLowerCase().includes('normal')) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200';
    if (category.toLowerCase().includes('under')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200';
    return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200';
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-[400px] rounded-[2rem]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto pb-10 space-y-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <User className="h-8 w-8 text-primary" />
          Your Profile
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Manage your personal information and health data.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="rounded-[2rem] border-primary/10 shadow-lg overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl font-serif">Health Metrics</CardTitle>
                <CardDescription className="mt-1">Your Body Mass Index (BMI) overview</CardDescription>
              </div>
              <div className="bg-background rounded-full p-3 shadow-sm text-primary">
                <Activity className="h-6 w-6" />
              </div>
            </div>
            
            {user && (
              <div className="mt-6 flex flex-wrap items-end gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Current BMI</p>
                  <p className="text-4xl font-serif font-bold mt-1 text-foreground">{user.bmi}</p>
                </div>
                <div className={cn("px-4 py-1.5 rounded-full text-sm font-bold border mb-1", getBmiColor(user.bmiCategory))}>
                  {user.bmiCategory}
                </div>
              </div>
            )}
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
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

                <div className="pt-4 flex justify-end">
                  <Button 
                    type="submit" 
                    className="h-12 px-8 rounded-xl text-lg hover-elevate shadow-md gap-2"
                    disabled={updateProfileMutation.isPending}
                  >
                    {updateProfileMutation.isPending ? "Saving..." : <><CheckCircle2 className="h-5 w-5" /> Save Changes</>}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
