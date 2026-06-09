import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { getGetMeQueryKey, useChangePassword } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
  });

type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;

export default function UpdatePassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const changePasswordMutation = useChangePassword();

  const form = useForm<UpdatePasswordValues>({
    resolver: zodResolver(updatePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
    },
  });

  const onSubmit = async (values: UpdatePasswordValues) => {
    setIsSaving(true);
    try {
      const payload = await changePasswordMutation.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      toast({
        title: "Password updated",
        description: payload.message || "Your password was changed successfully.",
      });
      form.reset();
      setLocation("/profile");
    } catch (error) {
      const message =
        error &&
        typeof error === "object" &&
        "data" in error &&
        error.data &&
        typeof error.data === "object" &&
        "error" in error.data &&
        typeof (error.data as { error?: unknown }).error === "string"
          ? (error.data as { error: string }).error
          : error instanceof Error
            ? error.message
            : "Could not update password.";

      toast({
        title: "Update failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="flex items-center gap-3 text-3xl font-serif font-bold text-foreground md:text-4xl">
          <KeyRound className="h-8 w-8 text-primary" />
          Update Password
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Change your password using your current password and a new one.
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
          <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl font-serif">Secure Password Change</CardTitle>
                <CardDescription className="mt-1">Enter your current password and choose a new one.</CardDescription>
              </div>
              <div className="rounded-full bg-background p-3 text-primary shadow-sm">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">Current Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="current-password"
                          className="h-12 rounded-xl bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-base">New Password</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          autoComplete="new-password"
                          className="h-12 rounded-xl bg-background/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end pt-2">
                  <Button type="submit" className="h-12 rounded-xl px-8 text-base shadow-md gap-2" disabled={isSaving}>
                    <LockKeyhole className="h-4 w-4" />
                    {isSaving ? "Updating..." : "Update Password"}
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
