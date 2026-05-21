import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSignup, getGetMeQueryKey } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet } from "lucide-react";
import { motion } from "framer-motion";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  age: z.coerce.number().min(10, "Must be at least 10").max(100, "Invalid age"),
  heightCm: z.coerce.number().min(100, "Invalid height").max(250, "Invalid height"),
  weightKg: z.coerce.number().min(30, "Invalid weight").max(300, "Invalid weight"),
});

type SignupFormValues = z.infer<typeof signupSchema>;

export default function Signup() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const signupMutation = useSignup();

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: "", email: "", password: "", age: undefined, heightCm: undefined, weightKg: undefined },
  });

  const onSubmit = (data: SignupFormValues) => {
    signupMutation.mutate(
      { data },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Account created!", description: "Welcome to GlowCycle." });
          setLocation("/dashboard");
        },
        onError: (error) => {
          toast({ 
            title: "Signup failed", 
            description: error?.error || "Could not create account", 
            variant: "destructive" 
          });
        },
      }
    );
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-primary/10 shadow-xl shadow-primary/5 rounded-[2rem] overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardHeader className="space-y-3 pb-6 pt-10 text-center">
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
              <Droplet className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-3xl font-serif font-bold">Join GlowCycle</CardTitle>
            <CardDescription className="text-base">
              Create an account to start tracking your wellness.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-10">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-medium">Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Your preferred name" className="h-12 rounded-xl bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-medium">Email</FormLabel>
                      <FormControl>
                        <Input placeholder="hello@example.com" className="h-12 rounded-xl bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-muted-foreground font-medium">Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" className="h-12 rounded-xl bg-background/50" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="age"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-muted-foreground font-medium">Age</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="25" className="h-12 rounded-xl bg-background/50" {...field} value={field.value || ""} />
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
                        <FormLabel className="text-muted-foreground font-medium">Ht (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="165" className="h-12 rounded-xl bg-background/50" {...field} value={field.value || ""} />
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
                        <FormLabel className="text-muted-foreground font-medium">Wt (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="60" className="h-12 rounded-xl bg-background/50" {...field} value={field.value || ""} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 rounded-xl text-lg font-medium shadow-lg shadow-primary/20 hover-elevate mt-6" 
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Creating account..." : "Sign Up"}
                </Button>
              </form>
            </Form>

            <div className="mt-8 text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/login" className="text-primary font-medium hover:underline">
                Log in
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
