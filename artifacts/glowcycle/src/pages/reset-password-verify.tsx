import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForgotPassword,
  useForgotPasswordVerifyOtp,
  useResetPassword,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";

const verifySchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit OTP"),
});

const resetSchema = z
  .object({
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Please confirm your password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type VerifyFormValues = z.infer<typeof verifySchema>;
type ResetFormValues = z.infer<typeof resetSchema>;
const RESEND_SECONDS = 60;

export default function ResetPasswordVerify() {
  const [, setLocation] = useLocation();
  const email = useMemo(
    () => new URLSearchParams(window.location.search).get("email") ?? "",
    [],
  );
  const [step, setStep] = useState<"otp" | "password">("otp");
  const [showPassword, setShowPassword] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(Date.now());
  const { toast } = useToast();
  const verifyMutation = useForgotPasswordVerifyOtp();
  const resetMutation = useResetPassword();
  const resendMutation = useForgotPassword();

  const verifyForm = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: "" },
  });
  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainingSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const onVerify = (values: VerifyFormValues) => {
    if (!email) {
      toast({ title: "Missing email", description: "Please request a new OTP.", variant: "destructive" });
      setLocation("/forgot-password");
      return;
    }

    verifyMutation.mutate(
      { data: { email, otp: values.otp } },
      {
        onSuccess: () => {
          toast({ title: "OTP verified", description: "Choose a new password." });
          setStep("password");
        },
        onError: (error: any) => {
          toast({ title: "Verification failed", description: error?.data?.error ?? "Invalid OTP", variant: "destructive" });
        },
      },
    );
  };

  const onReset = (values: ResetFormValues) => {
    resetMutation.mutate(
      { data: { email, newPassword: values.newPassword } },
      {
        onSuccess: () => {
          toast({ title: "Password reset", description: "You can now log in with your new password." });
          setLocation("/login");
        },
        onError: (error: any) => {
          toast({ title: "Reset failed", description: error?.data?.error ?? "Verify OTP again.", variant: "destructive" });
          setStep("otp");
        },
      },
    );
  };

  const onResend = () => {
    if (!email) return;
    resendMutation.mutate(
      { data: { email } },
      {
        onSuccess: () => {
          setCooldownUntil(Date.now() + RESEND_SECONDS * 1000);
          toast({ title: "OTP resent", description: "Check your inbox." });
        },
        onError: (error: any) => {
          toast({ title: "Could not resend", description: error?.data?.error ?? "Try again later.", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-primary/10 shadow-xl shadow-primary/5 rounded-[2rem] bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif font-bold">
              {step === "otp" ? "Verify OTP" : "Reset Password"}
            </CardTitle>
            <CardDescription>
              {step === "otp" ? `Enter the OTP sent to ${email || "your email"}.` : "Create a new secure password."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {step === "otp" ? (
              <>
                <Form {...verifyForm}>
                  <form onSubmit={verifyForm.handleSubmit(onVerify)} className="space-y-5">
                    <FormField
                      control={verifyForm.control}
                      name="otp"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>One-Time Password</FormLabel>
                          <FormControl>
                            <InputOTP maxLength={6} {...field}>
                              <InputOTPGroup className="w-full justify-between">
                                {Array.from({ length: 6 }).map((_, index) => (
                                  <InputOTPSlot key={index} index={index} className="h-12 w-12 rounded-xl border" />
                                ))}
                              </InputOTPGroup>
                            </InputOTP>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button className="w-full h-12 rounded-xl" disabled={verifyMutation.isPending}>
                      {verifyMutation.isPending ? "Verifying..." : "Verify OTP"}
                    </Button>
                  </form>
                </Form>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full rounded-xl"
                  disabled={remainingSeconds > 0 || resendMutation.isPending}
                  onClick={onResend}
                >
                  {resendMutation.isPending
                    ? "Resending..."
                    : remainingSeconds > 0
                      ? `Resend OTP in ${remainingSeconds}s`
                      : "Resend OTP"}
                </Button>
              </>
            ) : (
              <Form {...resetForm}>
                <form onSubmit={resetForm.handleSubmit(onReset)} className="space-y-5">
                  <FormField
                    control={resetForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Input
                              type={showPassword ? "text" : "password"}
                              className="h-12 rounded-xl pr-11"
                              {...field}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword((value) => !value)}
                              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                            >
                              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={resetForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <Input type={showPassword ? "text" : "password"} className="h-12 rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button className="w-full h-12 rounded-xl" disabled={resetMutation.isPending}>
                    <ShieldCheck className="h-4 w-4 mr-2" />
                    {resetMutation.isPending ? "Saving..." : "Save New Password"}
                  </Button>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
