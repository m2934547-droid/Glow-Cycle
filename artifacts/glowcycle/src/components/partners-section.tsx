import { useState } from "react";
import { useGetPartners, useAddPartner, useRemovePartner, getGetPartnersQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, UserPlus, Trash2, Mail, Bell } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const RELATIONSHIPS = [
  { value: "partner", label: "Partner / Spouse" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "friend", label: "Close Friend" },
  { value: "child", label: "Child" },
  { value: "other", label: "Other" },
];

export function PartnersSection() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("partner");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const { data: partners, isLoading } = useGetPartners({ query: { queryKey: getGetPartnersQueryKey() } });
  const addPartner = useAddPartner();
  const removePartner = useRemovePartner();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const validate = () => {
    const e: { name?: string; email?: string } = {};
    if (!name.trim()) e.name = "Required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;
    addPartner.mutate(
      { data: { partnerName: name.trim(), partnerEmail: email.trim().toLowerCase(), relationship } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPartnersQueryKey() });
          setName(""); setEmail(""); setRelationship("partner");
          toast({ title: "Partner added", description: "They will see your cycle phase when they log in." });
        },
        onError: () => toast({ title: "Could not add partner", variant: "destructive" }),
      }
    );
  };

  const handleRemove = (id: number) => {
    if (!confirm("Remove this partner? They will no longer see your cycle phase.")) return;
    removePartner.mutate({ partnerId: id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetPartnersQueryKey() });
        toast({ title: "Partner removed" });
      },
    });
  };

  const getRelationshipLabel = (val: string) => RELATIONSHIPS.find(r => r.value === val)?.label ?? val;

  return (
    <Card className="rounded-[2rem] border-primary/10 shadow-lg bg-card/80 backdrop-blur-xl overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-primary/10 pb-6">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl font-serif flex items-center gap-2">
              <Heart className="h-6 w-6 text-primary" />
              Trusted Partners
            </CardTitle>
            <CardDescription className="mt-1">
              Add people who care about you. They'll see your cycle phase and get supportive guidance when they log in to GlowCycle with their email.
            </CardDescription>
          </div>
          <div className="bg-background rounded-full p-3 shadow-sm text-primary shrink-0">
            <Bell className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6 space-y-6">
        {/* Add form */}
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
          <h3 className="font-medium text-foreground flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-primary" /> Add a New Partner
          </h3>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="p-name" className="text-xs">Their Name</Label>
              <Input id="p-name" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Alex" className={`mt-1 rounded-xl bg-background ${errors.name ? "border-destructive" : ""}`} />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div>
              <Label htmlFor="p-email" className="text-xs">Their Email</Label>
              <Input id="p-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="alex@example.com" className={`mt-1 rounded-xl bg-background ${errors.email ? "border-destructive" : ""}`} />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
          </div>
          <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-end">
            <div>
              <Label className="text-xs">Relationship</Label>
              <Select value={relationship} onValueChange={setRelationship}>
                <SelectTrigger className="mt-1 rounded-xl bg-background"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RELATIONSHIPS.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleAdd} disabled={addPartner.isPending} className="rounded-xl h-10 gap-2 shadow-md">
              <UserPlus className="h-4 w-4" />
              {addPartner.isPending ? "Adding..." : "Add Partner"}
            </Button>
          </div>
        </div>

        {/* List */}
        <div>
          <h3 className="font-medium text-foreground mb-3 text-sm">Your Partners ({partners?.length ?? 0})</h3>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
          ) : partners && partners.length > 0 ? (
            <div className="space-y-2">
              <AnimatePresence>
                {partners.map((p) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="flex items-center justify-between gap-3 p-4 rounded-xl border border-border bg-background/50 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold shrink-0">
                        {p.partnerName.charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-foreground truncate">{p.partnerName}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Mail className="h-3 w-3 shrink-0" />
                          <span className="truncate">{p.partnerEmail}</span>
                        </p>
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-medium shrink-0 capitalize">
                        {getRelationshipLabel(p.relationship)}
                      </span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleRemove(p.id)} className="text-muted-foreground hover:text-destructive shrink-0">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground text-sm border-2 border-dashed border-border rounded-xl">
              You haven't added any partners yet.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
