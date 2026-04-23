import { useGetConsultants, getGetConsultantsQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, Stethoscope, IndianRupee, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";

export default function Consultants() {
  const { data: consultants, isLoading } = useGetConsultants({
    query: { queryKey: getGetConsultantsQueryKey() },
  });

  return (
    <div className="space-y-8 pb-10">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground">
          Health <span className="text-primary">Consultants</span>
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Reach out for trusted medical guidance, especially in moments of high pain or emergency.
        </p>
      </motion.div>

      <Card className="rounded-[2rem] border-primary/10 bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/20 dark:to-pink-950/20">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="h-12 w-12 rounded-full bg-white/70 dark:bg-white/10 flex items-center justify-center shrink-0">
            <AlertCircle className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">In an emergency, call your consultant directly.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Fees shown below are estimates set by our admin team and may vary at the consultant's discretion.
            </p>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-64 rounded-[2rem]" />
          ))}
        </div>
      ) : !consultants || consultants.length === 0 ? (
        <Card className="rounded-[2rem]">
          <CardContent className="p-12 text-center text-muted-foreground">
            No consultants are listed yet. Please check back soon.
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {consultants.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Card className="h-full rounded-[2rem] border-primary/10 shadow-sm hover-elevate overflow-hidden">
                <CardHeader>
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                      <Stethoscope className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="font-serif text-xl">{c.name}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">{c.designation}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between py-2 border-b border-border/50">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5" /> Consultancy
                      </span>
                      <span className="font-medium text-foreground">₹{c.consultancyFee.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <IndianRupee className="h-3.5 w-3.5" /> Medicines
                      </span>
                      <span className="font-medium text-foreground">₹{c.medicineFee.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                  <a href={`tel:${c.phone}`} className="block">
                    <Button className="w-full rounded-full" size="lg">
                      <Phone className="h-4 w-4 mr-2" /> Call {c.phone}
                    </Button>
                  </a>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
