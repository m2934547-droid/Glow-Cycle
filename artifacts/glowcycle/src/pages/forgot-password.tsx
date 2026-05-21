import { useState } from "react";
import { useForgotPassword, useResetPassword } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, Mail, KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const emailSchema = z.object({ email: z.string().email("Enter a valid email") });
const resetSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EmailForm = z.infer<typeof emailSchema>;
type ResetForm = z.infer<typeof resetSchema>;

export default function ForgotPassword() {
  const [step, setStep] = useState<"email" | "otp">("email");
  const [email, setEmail] = useState("");
  const [demoOtp, setDemoOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const forgotMutation = useForgotPassword();
  const resetMutation = useResetPassword();

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { otp: "", newPassword: "", confirmPassword: "" } });

  const onRequestOtp = async (data: EmailForm) => {
    try {
      const result = await forgotMutation.mutateAsync({ data: { email: data.email } });
      setEmail(data.email);
      setDemoOtp(result.otp);
      setStep("otp");
    } catch (e: any) {
      toast({ title: "Error", description: e?.error ?? "Something went wrong.", variant: "destructive" });
    }
  };

  const onResetPassword = async (data: ResetForm) => {
    try {
      await resetMutation.mutateAsync({ data: { email, otp: data.otp, newPassword: data.newPassword } });
      toast({ title: "Password reset!", description: "You can now log in with your new password." });
      setLocation("/login");
    } catch (e: any) {
      toast({ title: "Invalid OTP", description: e?.error ?? "The OTP is incorrect or expired.", variant: "destructive" });
    }
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-md">
        <div className="flex justify-center mb-6">
          <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <Droplet className="h-7 w-7 text-primary" />
          </div>
        </div>

        <AnimatePresence mode="wait">
          {step === "email" ? (
            <motion.div key="email" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-serif text-2xl flex items-center justify-center gap-2">
                    <Mail className="h-5 w-5 text-primary" /> Forgot Password
                  </CardTitle>
                  <CardDescription>Enter your registered email to receive an OTP.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...emailForm}>
                    <form onSubmit={emailForm.handleSubmit(onRequestOtp)} className="space-y-4">
                      <FormField control={emailForm.control} name="email" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input placeholder="you@example.com" type="email" className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full h-11 rounded-full" disabled={forgotMutation.isPending}>
                        {forgotMutation.isPending ? "Sending..." : "Send OTP"}
                      </Button>
                      <p className="text-center text-sm text-muted-foreground">
                        Remember your password?{" "}
                        <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
                      </p>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-serif text-2xl flex items-center justify-center gap-2">
                    <KeyRound className="h-5 w-5 text-primary" /> Reset Password
                  </CardTitle>
                  <CardDescription>Enter the OTP sent to <span className="font-medium text-foreground">{email}</span></CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {demoOtp && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Demo Mode</p>
                      <p className="text-sm text-amber-800">In production this OTP would be emailed. Your OTP is:</p>
                      <p className="text-3xl font-mono font-bold text-amber-700 tracking-widest mt-1">{demoOtp}</p>
                    </div>
                  )}
                  <Form {...resetForm}>
                    <form onSubmit={resetForm.handleSubmit(onResetPassword)} className="space-y-4">
                      <FormField control={resetForm.control} name="otp" render={({ field }) => (
                        <FormItem>
                          <FormLabel>6-Digit OTP</FormLabel>
                          <FormControl>
                            <Input placeholder="123456" maxLength={6} className="rounded-xl font-mono text-center text-lg tracking-widest" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={resetForm.control} name="newPassword" render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input placeholder="Min. 6 characters" type={showPassword ? "text" : "password"} className="rounded-xl pr-10" {...field} />
                              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={resetForm.control} name="confirmPassword" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Confirm Password</FormLabel>
                          <FormControl>
                            <Input placeholder="Re-enter password" type={showPassword ? "text" : "password"} className="rounded-xl" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )} />
                      <Button type="submit" className="w-full h-11 rounded-full" disabled={resetMutation.isPending}>
                        <ShieldCheck className="h-4 w-4 mr-2" />
                        {resetMutation.isPending ? "Resetting..." : "Reset Password"}
                      </Button>
                      <Button type="button" variant="ghost" size="sm" className="w-full rounded-full text-muted-foreground" onClick={() => setStep("email")}>
                        Try a different email
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
