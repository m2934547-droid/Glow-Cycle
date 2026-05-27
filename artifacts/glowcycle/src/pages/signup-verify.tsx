import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  getGetMeQueryKey,
  useSignupResendOtp,
  useSignupVerifyOtp,
} from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

const verifySchema = z.object({
  otp: z.string().length(6, "Enter the 6-digit OTP"),
});

type VerifyFormValues = z.infer<typeof verifySchema>;
const RESEND_SECONDS = 60;

export default function SignupVerify() {
  const [location, setLocation] = useLocation();
  const [cooldownUntil, setCooldownUntil] = useState(Date.now() + RESEND_SECONDS * 1000);
  const [now, setNow] = useState(Date.now());
  const [, query = ""] = location.split("?");
  const email = useMemo(() => new URLSearchParams(query).get("email") ?? "", [query]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const verifyMutation = useSignupVerifyOtp();
  const resendMutation = useSignupResendOtp();

  const form = useForm<VerifyFormValues>({
    resolver: zodResolver(verifySchema),
    defaultValues: { otp: "" },
  });

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  const remainingSeconds = Math.max(0, Math.ceil((cooldownUntil - now) / 1000));

  const onVerify = (values: VerifyFormValues) => {
    if (!email) {
      toast({ title: "Missing email", description: "Please start signup again.", variant: "destructive" });
      setLocation("/signup");
      return;
    }

    verifyMutation.mutate(
      { data: { email, otp: values.otp } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          toast({ title: "Account verified", description: "Welcome to GlowCycle." });
          setLocation("/dashboard");
        },
        onError: (error: any) => {
          toast({ title: "Verification failed", description: error?.data?.error ?? "Invalid OTP", variant: "destructive" });
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
        <Card className="border-primary/10 shadow-xl shadow-primary/5 rounded-[2rem] overflow-hidden bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif font-bold">Verify Your Email</CardTitle>
            <CardDescription>Enter the OTP sent to {email || "your email"}.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onVerify)} className="space-y-5">
                <FormField
                  control={form.control}
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
                  {verifyMutation.isPending ? "Verifying..." : "Verify and Continue"}
                </Button>
              </form>
            </Form>

            <Button
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
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
