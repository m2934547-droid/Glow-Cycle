import { useState, useRef, useEffect } from "react";
import { useForgotPassword, useResetPassword } from "@workspace/api-client-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation } from "wouter";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplet, Mail, Phone, KeyRound, ShieldCheck, Eye, EyeOff, ChevronUp, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const COUNTRIES = [
  { code: "+91",  flag: "🇮🇳", name: "India" },
  { code: "+1",   flag: "🇺🇸", name: "United States" },
  { code: "+1",   flag: "🇨🇦", name: "Canada" },
  { code: "+44",  flag: "🇬🇧", name: "United Kingdom" },
  { code: "+61",  flag: "🇦🇺", name: "Australia" },
  { code: "+971", flag: "🇦🇪", name: "UAE" },
  { code: "+65",  flag: "🇸🇬", name: "Singapore" },
  { code: "+60",  flag: "🇲🇾", name: "Malaysia" },
  { code: "+92",  flag: "🇵🇰", name: "Pakistan" },
  { code: "+880", flag: "🇧🇩", name: "Bangladesh" },
  { code: "+94",  flag: "🇱🇰", name: "Sri Lanka" },
  { code: "+977", flag: "🇳🇵", name: "Nepal" },
  { code: "+49",  flag: "🇩🇪", name: "Germany" },
  { code: "+33",  flag: "🇫🇷", name: "France" },
  { code: "+39",  flag: "🇮🇹", name: "Italy" },
  { code: "+81",  flag: "🇯🇵", name: "Japan" },
  { code: "+82",  flag: "🇰🇷", name: "South Korea" },
  { code: "+86",  flag: "🇨🇳", name: "China" },
  { code: "+55",  flag: "🇧🇷", name: "Brazil" },
  { code: "+27",  flag: "🇿🇦", name: "South Africa" },
];

const emailSchema = z.object({ email: z.string().email("Enter a valid email address") });
const phoneSchema = z.object({ number: z.string().min(6, "Enter a valid phone number") });
const resetSchema = z.object({
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z.string().min(6, "At least 6 characters"),
  confirmPassword: z.string().min(6, "Please confirm your password"),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

type EmailForm = z.infer<typeof emailSchema>;
type PhoneForm = z.infer<typeof phoneSchema>;
type ResetForm = z.infer<typeof resetSchema>;

function CountryCodeSelect({ value, onChange }: { value: string; onChange: (v: string, name: string) => void }) {
  const [open, setOpen] = useState(false);
  const [selectedName, setSelectedName] = useState("India");
  const ref = useRef<HTMLDivElement>(null);
  const selected = COUNTRIES.find((c) => c.code === value && c.name === selectedName)
    ?? COUNTRIES.find((c) => c.code === value)
    ?? COUNTRIES[0];

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative h-full">
      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        className="h-full flex items-center gap-1.5 px-3 bg-muted/60 rounded-l-xl text-sm font-medium text-foreground hover:bg-muted transition-colors"
        style={{ minWidth: "88px" }}
      >
        <span className="text-base leading-none">{selected.flag}</span>
        <span className="text-xs font-semibold">{selected.code}</span>
        {open ? <ChevronUp className="h-3 w-3 text-muted-foreground ml-auto shrink-0" /> : <ChevronDown className="h-3 w-3 text-muted-foreground ml-auto shrink-0" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full left-0 mb-1 z-50 w-56 rounded-2xl bg-popover border border-border shadow-xl overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto py-1">
              {COUNTRIES.map((c) => {
                const isActive = c.code === value && c.name === selectedName;
                return (
                  <button
                    key={`${c.name}-${c.code}`}
                    type="button"
                    onClick={() => {
                      onChange(c.code, c.name);
                      setSelectedName(c.name);
                      setOpen(false);
                    }}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm hover:bg-primary/8 transition-colors text-left",
                      isActive && "bg-primary/10 text-primary"
                    )}
                  >
                    <span className="text-base shrink-0">{c.flag}</span>
                    <span className="flex-1 truncate text-foreground">{c.name}</span>
                    <span className="text-xs text-muted-foreground shrink-0">{c.code}</span>
                    {isActive && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ForgotPassword() {
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [step, setStep] = useState<"request" | "otp">("request");
  const [countryCode, setCountryCode] = useState("+91");
  const [identifier, setIdentifier] = useState<{ value: string; type: "email" | "phone" }>({ value: "", type: "email" });
  const [demoOtp, setDemoOtp] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const forgotMutation = useForgotPassword();
  const resetMutation = useResetPassword();

  const emailForm = useForm<EmailForm>({ resolver: zodResolver(emailSchema), defaultValues: { email: "" } });
  const phoneForm = useForm<PhoneForm>({ resolver: zodResolver(phoneSchema), defaultValues: { number: "" } });
  const resetForm = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { otp: "", newPassword: "", confirmPassword: "" } });

  const onRequestOtp = async (data: EmailForm | PhoneForm) => {
    try {
      let payload: { email?: string; phone?: string };

      if ("email" in data) {
        payload = { email: data.email };
        setIdentifier({ value: data.email, type: "email" });
      } else {
        const fullPhone = `${countryCode}${(data as PhoneForm).number.replace(/^0+/, "")}`;
        payload = { phone: fullPhone };
        setIdentifier({ value: fullPhone, type: "phone" });
      }

      const result = await forgotMutation.mutateAsync({ data: payload });
      setDemoOtp(result.otp);
      setStep("otp");
    } catch (e: any) {
      toast({ title: "Error", description: e?.error ?? "Something went wrong.", variant: "destructive" });
    }
  };

  const onResetPassword = async (data: ResetForm) => {
    try {
      const payload = identifier.type === "email"
        ? { email: identifier.value, otp: data.otp, newPassword: data.newPassword }
        : { phone: identifier.value, otp: data.otp, newPassword: data.newPassword };
      await resetMutation.mutateAsync({ data: payload });
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
          {step === "request" ? (
            <motion.div key="request" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
              <Card className="rounded-[2rem] border-primary/10 shadow-xl shadow-primary/5">
                <CardHeader className="text-center pb-2">
                  <CardTitle className="font-serif text-2xl">Forgot Password?</CardTitle>
                  <CardDescription>Choose how you'd like to receive your OTP.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Method toggle */}
                  <div className="flex rounded-2xl overflow-hidden border border-primary/20 bg-muted/30 p-1 gap-1">
                    {(["email", "phone"] as const).map((m) => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setMethod(m)}
                        className={cn(
                          "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
                          method === m ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                        )}
                      >
                        {m === "email" ? <Mail className="h-4 w-4" /> : <Phone className="h-4 w-4" />}
                        {m === "email" ? "Email" : "Phone Number"}
                      </button>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {method === "email" ? (
                      <motion.div key="email-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <Form {...emailForm}>
                          <form onSubmit={emailForm.handleSubmit(onRequestOtp)} className="space-y-4">
                            <FormField control={emailForm.control} name="email" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email Address</FormLabel>
                                <FormControl>
                                  <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <Input placeholder="you@example.com" type="email" className="rounded-xl pl-9" {...field} />
                                  </div>
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <Button type="submit" className="w-full h-11 rounded-full" disabled={forgotMutation.isPending}>
                              {forgotMutation.isPending ? "Sending OTP..." : "Send OTP via Email"}
                            </Button>
                          </form>
                        </Form>
                      </motion.div>
                    ) : (
                      <motion.div key="phone-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                        <Form {...phoneForm}>
                          <form onSubmit={phoneForm.handleSubmit(onRequestOtp)} className="space-y-4">
                            <FormField control={phoneForm.control} name="number" render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone Number</FormLabel>
                                <FormControl>
                                  <div className="flex h-10 rounded-xl border border-input bg-background overflow-visible focus-within:ring-2 focus-within:ring-ring relative">
                                    <CountryCodeSelect
                                      value={countryCode}
                                      onChange={(code, name) => setCountryCode(code)}
                                    />
                                    <div className="w-px bg-border self-stretch my-1.5" />
                                    <input
                                      type="tel"
                                      placeholder="98765 43210"
                                      className="flex-1 px-3 text-sm bg-transparent outline-none placeholder:text-muted-foreground rounded-r-xl"
                                      {...field}
                                    />
                                  </div>
                                </FormControl>
                                <p className="text-xs text-muted-foreground">
                                  Select your country, then enter your number
                                </p>
                                <FormMessage />
                              </FormItem>
                            )} />
                            <Button type="submit" className="w-full h-11 rounded-full" disabled={forgotMutation.isPending}>
                              {forgotMutation.isPending ? "Sending OTP..." : "Send OTP via SMS"}
                            </Button>
                          </form>
                        </Form>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <p className="text-center text-sm text-muted-foreground pt-1">
                    Remember your password?{" "}
                    <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
                  </p>
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
                  <CardDescription>
                    OTP sent to{" "}
                    <span className="font-medium text-foreground">
                      {identifier.type === "phone" ? "📱 " : "✉️ "}{identifier.value}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {demoOtp && (
                    <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">
                        Demo Mode — {identifier.type === "phone" ? "SMS" : "Email"} OTP
                      </p>
                      <p className="text-sm text-amber-800">
                        In production this would be {identifier.type === "phone" ? "sent via SMS" : "emailed"}. Your OTP:
                      </p>
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
                      <Button type="button" variant="ghost" size="sm" className="w-full rounded-full text-muted-foreground" onClick={() => { setStep("request"); setDemoOtp(""); resetForm.reset(); }}>
                        ← Try a different {identifier.type === "phone" ? "number" : "email"}
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
