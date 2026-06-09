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

type PartnersSectionVariant = "full" | "form" | "list";

type PartnersSectionProps = {
  variant?: PartnersSectionVariant;
  showEmptyState?: boolean;
  showActions?: boolean;
};

export function PartnersSection({
  variant = "full",
  showEmptyState = true,
  showActions = true,
}: PartnersSectionProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [relationship, setRelationship] = useState("partner");
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  const { data: partners, isLoading } = useGetPartners({
    query: {
      queryKey: getGetPartnersQueryKey(),
      enabled: variant !== "form",
    },
  });
  const addPartner = useAddPartner();
  const removePartner = useRemovePartner();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const partnerItems = partners ?? [];
  const hasPartners = partnerItems.length > 0;

  const validate = () => {
    const nextErrors: { name?: string; email?: string } = {};

    if (!name.trim()) nextErrors.name = "Required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) nextErrors.email = "Valid email required";

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleAdd = () => {
    if (!validate()) return;

    addPartner.mutate(
      { data: { partnerName: name.trim(), partnerEmail: email.trim().toLowerCase(), relationship } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPartnersQueryKey() });
          setName("");
          setEmail("");
          setRelationship("partner");
          toast({ title: "Partner added", description: "They will see your cycle phase when they log in." });
        },
        onError: () => toast({ title: "Could not add partner", variant: "destructive" }),
      }
    );
  };

  const handleRemove = (id: number) => {
    if (!showActions) return;

    if (!confirm("Remove this partner? They will no longer see your cycle phase.")) return;

    removePartner.mutate(
      { partnerId: id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPartnersQueryKey() });
          toast({ title: "Partner removed" });
        },
      }
    );
  };

  const getRelationshipLabel = (value: string) => RELATIONSHIPS.find((relationshipItem) => relationshipItem.value === value)?.label ?? value;

  const headerTitle =
    variant === "form"
      ? "Add a New Partner"
      : variant === "list"
        ? "Partner Information"
        : "Trusted Partners";

  const headerDescription =
    variant === "form"
      ? "Add people who care about you. They'll see your cycle phase when they log in with their email."
      : variant === "list"
        ? "View trusted partner details that are linked to your account."
        : "Add people who care about you. They'll see your cycle phase and get supportive guidance when they log in to GlowCycle with their email.";

  const formCard = (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
      <h3 className="font-medium text-foreground flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" /> Add a New Partner
      </h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor="p-name" className="text-xs">Their Name</Label>
          <Input
            id="p-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="e.g. Alex"
            className={`mt-1 rounded-xl bg-background ${errors.name ? "border-destructive" : ""}`}
          />
          {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name}</p>}
        </div>
        <div>
          <Label htmlFor="p-email" className="text-xs">Their Email</Label>
          <Input
            id="p-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="alex@example.com"
            className={`mt-1 rounded-xl bg-background ${errors.email ? "border-destructive" : ""}`}
          />
          {errors.email && <p className="mt-1 text-xs text-destructive">{errors.email}</p>}
        </div>
      </div>
      <div className="grid items-end gap-3 sm:grid-cols-[1fr_auto]">
        <div>
          <Label className="text-xs">Relationship</Label>
          <Select value={relationship} onValueChange={setRelationship}>
            <SelectTrigger className="mt-1 rounded-xl bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RELATIONSHIPS.map((relationshipItem) => (
                <SelectItem key={relationshipItem.value} value={relationshipItem.value}>
                  {relationshipItem.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAdd} disabled={addPartner.isPending} className="h-10 gap-2 rounded-xl shadow-md">
          <UserPlus className="h-4 w-4" />
          {addPartner.isPending ? "Adding..." : "Add Partner"}
        </Button>
      </div>
    </div>
  );

  const listCard = (
    <div>
      <h3 className="mb-3 text-sm font-medium text-foreground">
        Your Partners ({partnerItems.length})
      </h3>
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-16 rounded-xl" />
          <Skeleton className="h-16 rounded-xl" />
        </div>
      ) : hasPartners ? (
        <div className="space-y-2">
          <AnimatePresence>
            {partnerItems.map((partner) => (
              <motion.div
                key={partner.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background/50 p-4 transition-colors hover:border-primary/30"
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">
                    {partner.partnerName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">{partner.partnerName}</p>
                    <p className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Mail className="h-3 w-3 shrink-0" />
                      <span className="truncate">{partner.partnerEmail}</span>
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-primary/10 px-2 py-1 text-xs font-medium capitalize text-primary">
                    {getRelationshipLabel(partner.relationship)}
                  </span>
                </div>
                {showActions && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemove(partner.id)}
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : showEmptyState ? (
        <div className="rounded-xl border-2 border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          You haven&apos;t added any partners yet.
        </div>
      ) : null}
    </div>
  );

  if (variant === "form") {
    return (
      <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
        <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                <Heart className="h-6 w-6 text-primary" />
                {headerTitle}
              </CardTitle>
              <CardDescription className="mt-1">
                {headerDescription}
              </CardDescription>
            </div>
            <div className="shrink-0 rounded-full bg-background p-3 text-primary shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {formCard}
        </CardContent>
      </Card>
    );
  }

  if (variant === "list") {
    if (!hasPartners && !showEmptyState) {
      return null;
    }

    return (
      <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
        <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                <Heart className="h-6 w-6 text-primary" />
                {headerTitle}
              </CardTitle>
              <CardDescription className="mt-1">
                {headerDescription}
              </CardDescription>
            </div>
            <div className="shrink-0 rounded-full bg-background p-3 text-primary shadow-sm">
              <Bell className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {listCard}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
      <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-2xl font-serif">
              <Heart className="h-6 w-6 text-primary" />
              {headerTitle}
            </CardTitle>
            <CardDescription className="mt-1">
              {headerDescription}
            </CardDescription>
          </div>
          <div className="shrink-0 rounded-full bg-background p-3 text-primary shadow-sm">
            <Bell className="h-5 w-5" />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {formCard}
        {listCard}
      </CardContent>
    </Card>
  );
}
