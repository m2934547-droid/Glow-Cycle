import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForgotPassword } from "@workspace/api-client-react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const schema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof schema>;

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const forgotMutation = useForgotPassword();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  const onSubmit = (values: FormValues) => {
    forgotMutation.mutate(
      { data: values },
      {
        onSuccess: () => {
          toast({ title: "OTP sent", description: "If the email is registered, you will receive an OTP." });
          setLocation(`/reset-password/verify?email=${encodeURIComponent(values.email)}`);
        },
        onError: (error: any) => {
          toast({ title: "Request failed", description: error?.data?.error ?? "Try again.", variant: "destructive" });
        },
      },
    );
  };

  return (
    <div className="flex items-center justify-center py-12 px-4">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <Card className="border-primary/10 shadow-xl shadow-primary/5 rounded-[2rem] bg-card/80 backdrop-blur-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-serif font-bold">Forgot Password</CardTitle>
            <CardDescription>Enter your email to receive a 6-digit OTP.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input className="h-12 rounded-xl" placeholder="hello@example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button className="w-full h-12 rounded-xl" disabled={forgotMutation.isPending}>
                  {forgotMutation.isPending ? "Sending OTP..." : "Send OTP"}
                </Button>
              </form>
            </Form>
            <p className="text-center text-sm text-muted-foreground">
              Back to{" "}
              <Link href="/login" className="text-primary hover:underline">
                login
              </Link>
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
