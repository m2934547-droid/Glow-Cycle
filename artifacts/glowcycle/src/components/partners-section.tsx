import { useEffect, useState } from "react";
import {
  getGetMeQueryKey,
  getGetPartnersQueryKey,
  type GetMeQueryResult,
  type Partner,
  useAddPartner,
  useGetMe,
  useGetPartners,
  useRemovePartner,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  CalendarDays,
  Clock3,
  Bell,
  Eye,
  Heart,
  Mail,
  PencilLine,
  Phone,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const PARTNER_STORAGE_KEY = "glowcycle.partner-metadata.v1";

const RELATIONSHIPS = [
  { value: "partner-spouse", label: "Partner / Spouse" },
  { value: "husband", label: "Husband" },
  { value: "wife", label: "Wife" },
  { value: "boyfriend", label: "Boyfriend" },
  { value: "girlfriend", label: "Girlfriend" },
  { value: "family-member", label: "Family Member" },
  { value: "parent", label: "Parent" },
  { value: "sibling", label: "Sibling" },
  { value: "close-friend", label: "Close Friend" },
  { value: "doctor", label: "Doctor" },
  { value: "emergency-contact", label: "Emergency Contact" },
  { value: "other", label: "Other" },
] as const;

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "pending", label: "Pending Invitation" },
  { value: "inactive", label: "Inactive" },
] as const;

type PartnerStatus = (typeof STATUS_OPTIONS)[number]["value"];

type PartnersSectionVariant = "full" | "form" | "list";

type PartnersSectionProps = {
  variant?: PartnersSectionVariant;
  showEmptyState?: boolean;
  showActions?: boolean;
  onSuccess?: () => void;
};

type PartnerMetadata = {
  phoneNumber: string;
  dateOfBirth: string;
  notes: string;
  status: PartnerStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
};

type PartnerFormValues = {
  partnerName: string;
  partnerEmail: string;
  relationship: string;
  phoneNumber: string;
  dateOfBirth: string;
  notes: string;
  status: PartnerStatus;
};

type PartnerWithMeta = Partner & { metadata: PartnerMetadata };

const emptyFormValues: PartnerFormValues = {
  partnerName: "",
  partnerEmail: "",
  relationship: "partner-spouse",
  phoneNumber: "",
  dateOfBirth: "",
  notes: "",
  status: "active",
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function getPartnerInitial(name: string) {
  const trimmed = name.trim();
  return (trimmed.charAt(0) || "?").toUpperCase();
}

function loadPartnerMetadata(): Record<string, PartnerMetadata> {
  if (typeof window === "undefined") return {};

  try {
    const stored = window.localStorage.getItem(PARTNER_STORAGE_KEY);
    return stored ? (JSON.parse(stored) as Record<string, PartnerMetadata>) : {};
  } catch {
    return {};
  }
}

function savePartnerMetadata(metadata: Record<string, PartnerMetadata>) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(PARTNER_STORAGE_KEY, JSON.stringify(metadata));
}

function getRelationshipLabel(value: string) {
  return (
    RELATIONSHIPS.find((relationshipItem) => relationshipItem.value === value)?.label ??
    ({
      partner: "Partner / Spouse",
      friend: "Close Friend",
      child: "Child",
    }[value] ??
      value)
  );
}

function getStatusLabel(value: PartnerStatus) {
  return STATUS_OPTIONS.find((statusItem) => statusItem.value === value)?.label ?? "Active";
}

function getStatusStyles(value: PartnerStatus) {
  if (value === "pending") {
    return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200";
  }

  if (value === "inactive") {
    return "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border-slate-200";
  }

  return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border-emerald-200";
}

function createDefaultMetadata(partner: Partner, createdBy: string): PartnerMetadata {
  const timestamp = partner.createdAt ?? new Date().toISOString();

  return {
    phoneNumber: "",
    dateOfBirth: "",
    notes: "",
    status: "active",
    createdBy,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function buildPartnerKey(email: string) {
  return normalizeEmail(email);
}

function PartnerFormFields({
  values,
  onChange,
  errors,
  isSaving,
  submitLabel,
  onSubmit,
}: {
  values: PartnerFormValues;
  onChange: (next: PartnerFormValues) => void;
  errors: Partial<Record<keyof PartnerFormValues, string>>;
  isSaving: boolean;
  submitLabel: string;
  onSubmit: () => void;
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="partner-name" className="text-xs">
            Partner Name
          </Label>
          <Input
            id="partner-name"
            value={values.partnerName}
            onChange={(event) => onChange({ ...values, partnerName: event.target.value })}
            placeholder="e.g. Alex"
            className={cn("mt-1 rounded-xl bg-background", errors.partnerName && "border-destructive")}
          />
          {errors.partnerName && <p className="mt-1 text-xs text-destructive">{errors.partnerName}</p>}
        </div>
        <div>
          <Label htmlFor="partner-email" className="text-xs">
            Email Address
          </Label>
          <Input
            id="partner-email"
            type="email"
            value={values.partnerEmail}
            onChange={(event) => onChange({ ...values, partnerEmail: event.target.value })}
            placeholder="alex@example.com"
            className={cn("mt-1 rounded-xl bg-background", errors.partnerEmail && "border-destructive")}
          />
          {errors.partnerEmail && <p className="mt-1 text-xs text-destructive">{errors.partnerEmail}</p>}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <Label htmlFor="partner-phone" className="text-xs">
            Phone Number
          </Label>
          <Input
            id="partner-phone"
            value={values.phoneNumber}
            onChange={(event) => onChange({ ...values, phoneNumber: event.target.value })}
            placeholder="+1 555 123 4567"
            className="mt-1 rounded-xl bg-background"
          />
        </div>
        <div>
          <Label htmlFor="partner-dob" className="text-xs">
            Date of Birth
          </Label>
          <Input
            id="partner-dob"
            type="date"
            value={values.dateOfBirth}
            onChange={(event) => onChange({ ...values, dateOfBirth: event.target.value })}
            className="mt-1 rounded-xl bg-background"
          />
        </div>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
        <div>
          <Label className="text-xs">Relationship Type</Label>
          <Select
            value={values.relationship}
            onValueChange={(relationship) => onChange({ ...values, relationship })}
          >
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
        <div>
          <Label className="text-xs">Status</Label>
          <Select value={values.status} onValueChange={(status) => onChange({ ...values, status: status as PartnerStatus })}>
            <SelectTrigger className="mt-1 rounded-xl bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((statusItem) => (
                <SelectItem key={statusItem.value} value={statusItem.value}>
                  {statusItem.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="partner-notes" className="text-xs">
          Notes
        </Label>
        <textarea
          id="partner-notes"
          value={values.notes}
          onChange={(event) => onChange({ ...values, notes: event.target.value })}
          placeholder="Optional notes, reminders, or preferences..."
          rows={4}
          className="mt-1 w-full rounded-2xl border border-input bg-background px-3 py-2 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60 focus:ring-2 focus:ring-primary/10"
        />
      </div>

      <div className="flex justify-end pt-2">
        <Button type="button" onClick={onSubmit} disabled={isSaving} className="h-11 gap-2 rounded-xl px-5 shadow-md">
          {isSaving ? "Saving..." : submitLabel}
        </Button>
      </div>
    </div>
  );
}

function PartnerDetailRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-background/60 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <span className="break-words">{value}</span>
      </p>
    </div>
  );
}

function PartnerSummaryCard({
  partner,
  onEdit,
  onDelete,
  onViewDetails,
  showActions,
}: {
  partner: PartnerWithMeta;
  onEdit: (partner: PartnerWithMeta) => void;
  onDelete: (partner: PartnerWithMeta) => void;
  onViewDetails: (partner: PartnerWithMeta) => void;
  showActions: boolean;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
    className="rounded-[1.75rem] border border-primary/10 bg-card/80 p-4 shadow-sm backdrop-blur-xl transition-shadow hover:shadow-md"
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 flex-1 gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 font-serif text-xl font-bold text-primary shadow-inner">
            {getPartnerInitial(partner.partnerName)}
          </div>

          <div className="min-w-0 flex-1 space-y-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h4 className="truncate font-serif text-lg font-semibold text-foreground">{partner.partnerName}</h4>
                <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4 shrink-0 text-primary" />
                  <span className="truncate">{partner.partnerEmail}</span>
                </p>
              </div>

              <span
                className={cn(
                  "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                  getStatusStyles(partner.metadata.status)
                )}
              >
                {getStatusLabel(partner.metadata.status)}
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              <PartnerDetailRow
                icon={Users}
                label="Relationship"
                value={getRelationshipLabel(partner.relationship)}
              />
              <PartnerDetailRow
                icon={CalendarDays}
                label="Date Added"
                value={formatDate(partner.metadata.createdAt || partner.createdAt || new Date().toISOString())}
              />
              <PartnerDetailRow
                icon={Clock3}
                label="Last Updated"
                value={formatDate(partner.metadata.updatedAt)}
              />
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 lg:flex-col lg:items-end">
          <Button variant="outline" className="h-10 gap-2 rounded-xl border-primary/15" onClick={() => onViewDetails(partner)}>
            <Eye className="h-4 w-4" />
            View Details
          </Button>
          <Button variant="outline" className="h-10 gap-2 rounded-xl border-primary/15" onClick={() => onEdit(partner)}>
            <PencilLine className="h-4 w-4" />
            Edit Partner
          </Button>
          {showActions && (
            <Button
              variant="ghost"
              className="h-10 gap-2 rounded-xl text-muted-foreground hover:text-destructive"
              onClick={() => onDelete(partner)}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export function PartnersSection({
  variant = "full",
  showEmptyState = true,
  showActions = true,
  onSuccess,
}: PartnersSectionProps) {
  const queryClient = useQueryClient();
  const cachedUser = queryClient.getQueryData<GetMeQueryResult>(getGetMeQueryKey());
  const { data: currentUser } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      initialData: cachedUser,
      staleTime: 5 * 60 * 1000,
      refetchOnMount: false,
    },
  });
  const currentUserLabel = currentUser?.name ?? currentUser?.email ?? "Current user";

  const [addValues, setAddValues] = useState<PartnerFormValues>(emptyFormValues);
  const [addErrors, setAddErrors] = useState<Partial<Record<keyof PartnerFormValues, string>>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [metadata, setMetadata] = useState<Record<string, PartnerMetadata>>({});
  const [detailPartner, setDetailPartner] = useState<PartnerWithMeta | null>(null);
  const [deletePartner, setDeletePartner] = useState<PartnerWithMeta | null>(null);
  const [editPartner, setEditPartner] = useState<PartnerWithMeta | null>(null);
  const [editValues, setEditValues] = useState<PartnerFormValues>(emptyFormValues);
  const [editErrors, setEditErrors] = useState<Partial<Record<keyof PartnerFormValues, string>>>({});
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const { data: partners, isLoading } = useGetPartners({
    query: {
      queryKey: getGetPartnersQueryKey(),
      enabled: variant !== "form",
    },
  });
  const addPartner = useAddPartner();
  const removePartner = useRemovePartner();
  const { toast } = useToast();

  const partnerItems = partners ?? [];
  const hasPartners = partnerItems.length > 0;

  useEffect(() => {
    setMetadata(loadPartnerMetadata());
  }, []);

  useEffect(() => {
    if (!partnerItems.length) {
      if (Object.keys(metadata).length > 0) {
        setMetadata({});
        savePartnerMetadata({});
      }
      return;
    }

    setMetadata((current) => {
      const next = { ...current };
      let changed = false;

      for (const partner of partnerItems) {
        const key = buildPartnerKey(partner.partnerEmail);
        if (!next[key]) {
          next[key] = createDefaultMetadata(partner, currentUserLabel);
          changed = true;
        }
      }

      for (const key of Object.keys(next)) {
        if (!partnerItems.some((partner) => buildPartnerKey(partner.partnerEmail) === key)) {
          delete next[key];
          changed = true;
        }
      }

      if (changed) {
        savePartnerMetadata(next);
      }

      return next;
    });
  }, [currentUserLabel, partnerItems]);

  const partnersWithMeta: PartnerWithMeta[] = partnerItems.map((partner) => {
    const key = buildPartnerKey(partner.partnerEmail);
    return {
      ...partner,
      metadata: metadata[key] ?? createDefaultMetadata(partner, currentUserLabel),
    };
  });

  const filteredPartners = partnersWithMeta.filter((partner) => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return true;

    return (
      partner.partnerName.toLowerCase().includes(search) ||
      partner.partnerEmail.toLowerCase().includes(search) ||
      getRelationshipLabel(partner.relationship).toLowerCase().includes(search)
    );
  });

  const validateBasePartner = (draft: PartnerFormValues, currentPartnerId?: number) => {
    const nextErrors: Partial<Record<keyof PartnerFormValues, string>> = {};

    if (!draft.partnerName.trim()) nextErrors.partnerName = "Name is required";

    if (!draft.partnerEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(draft.partnerEmail.trim())) {
      nextErrors.partnerEmail = "Enter a valid email address";
    } else if (
      partnerItems.some(
        (partner) =>
          buildPartnerKey(partner.partnerEmail) === buildPartnerKey(draft.partnerEmail) &&
          partner.id !== currentPartnerId
      )
    ) {
      nextErrors.partnerEmail = "That email is already linked to another partner";
    }

    setEditErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const validateAddPartner = () => {
    const nextErrors: Partial<Record<keyof PartnerFormValues, string>> = {};

    if (!addValues.partnerName.trim()) nextErrors.partnerName = "Name is required";

    if (
      !addValues.partnerEmail.trim() ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(addValues.partnerEmail.trim())
    ) {
      nextErrors.partnerEmail = "Enter a valid email address";
    } else if (
      partnerItems.some(
        (partner) => buildPartnerKey(partner.partnerEmail) === buildPartnerKey(addValues.partnerEmail)
      )
    ) {
      nextErrors.partnerEmail = "That email is already linked to a partner";
    }

    setAddErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const updateLocalMetadata = (partnerEmail: string, nextMetadata: PartnerMetadata) => {
    const key = buildPartnerKey(partnerEmail);
    setMetadata((current) => {
      const next = { ...current, [key]: nextMetadata };
      savePartnerMetadata(next);
      return next;
    });
  };

  const removeLocalMetadata = (partnerEmail: string) => {
    const key = buildPartnerKey(partnerEmail);
    setMetadata((current) => {
      const next = { ...current };
      delete next[key];
      savePartnerMetadata(next);
      return next;
    });
  };

  const handleAdd = async () => {
    if (!validateAddPartner()) return;

    try {
      const response = await addPartner.mutateAsync({
        data: {
          partnerName: addValues.partnerName.trim(),
          partnerEmail: normalizeEmail(addValues.partnerEmail),
          relationship: addValues.relationship,
        },
      });

      updateLocalMetadata(response.partnerEmail, {
        phoneNumber: addValues.phoneNumber.trim(),
        dateOfBirth: addValues.dateOfBirth,
        notes: addValues.notes.trim(),
        status: addValues.status,
        createdBy: currentUserLabel,
        createdAt: response.createdAt,
        updatedAt: response.createdAt,
      });

      queryClient.invalidateQueries({ queryKey: getGetPartnersQueryKey() });
      setAddValues(emptyFormValues);
      setAddErrors({});
      toast({ title: "Partner added", description: "Your partner is now linked to your account." });
      onSuccess?.();
    } catch {
      toast({ title: "Could not add partner", variant: "destructive" });
    }
  };

  const openDetails = (partner: PartnerWithMeta) => {
    setDetailPartner(partner);
    setIsDetailOpen(true);
  };

  const openEdit = (partner: PartnerWithMeta) => {
    setEditPartner(partner);
    setEditValues({
      partnerName: partner.partnerName,
      partnerEmail: partner.partnerEmail,
      relationship: partner.relationship,
      phoneNumber: partner.metadata.phoneNumber,
      dateOfBirth: partner.metadata.dateOfBirth,
      notes: partner.metadata.notes,
      status: partner.metadata.status,
    });
    setEditErrors({});
    setIsEditOpen(true);
  };

  const handleDelete = (partner: PartnerWithMeta) => {
    setDeletePartner(partner);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletePartner) return;

    try {
      await removePartner.mutateAsync({ partnerId: deletePartner.id });
      removeLocalMetadata(deletePartner.partnerEmail);
      queryClient.invalidateQueries({ queryKey: getGetPartnersQueryKey() });
      toast({ title: "Partner removed" });
      setIsDeleteOpen(false);
      setDeletePartner(null);
      setDetailPartner((current) => (current?.id === deletePartner.id ? null : current));
      setEditPartner((current) => (current?.id === deletePartner.id ? null : current));
    } catch {
      toast({ title: "Could not remove partner", variant: "destructive" });
    }
  };

  const submitEdit = async () => {
    if (!editPartner || !validateBasePartner(editValues, editPartner.id)) return;

    const nextCore = {
      partnerName: editValues.partnerName.trim(),
      partnerEmail: normalizeEmail(editValues.partnerEmail),
      relationship: editValues.relationship,
    };
    const nextMetadata: PartnerMetadata = {
      phoneNumber: editValues.phoneNumber.trim(),
      dateOfBirth: editValues.dateOfBirth,
      notes: editValues.notes.trim(),
      status: editValues.status,
      createdBy: editPartner.metadata.createdBy || currentUserLabel,
      createdAt: editPartner.metadata.createdAt || editPartner.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const coreUnchanged =
      buildPartnerKey(editPartner.partnerEmail) === buildPartnerKey(nextCore.partnerEmail) &&
      editPartner.partnerName.trim() === nextCore.partnerName &&
      editPartner.relationship === nextCore.relationship;

    try {
      if (coreUnchanged) {
        updateLocalMetadata(editPartner.partnerEmail, {
          ...editPartner.metadata,
          ...nextMetadata,
        });
      } else {
        await removePartner.mutateAsync({ partnerId: editPartner.id });
        const createdPartner = await addPartner.mutateAsync({
          data: {
            partnerName: nextCore.partnerName,
            partnerEmail: nextCore.partnerEmail,
            relationship: nextCore.relationship,
          },
        });

        removeLocalMetadata(editPartner.partnerEmail);
        updateLocalMetadata(createdPartner.partnerEmail, {
          ...nextMetadata,
          createdBy: editPartner.metadata.createdBy || currentUserLabel,
          createdAt: editPartner.metadata.createdAt || editPartner.createdAt || createdPartner.createdAt,
          updatedAt: new Date().toISOString(),
        });
      }

      queryClient.invalidateQueries({ queryKey: getGetPartnersQueryKey() });
      toast({ title: "Partner updated", description: "The changes are visible immediately." });
      setIsEditOpen(false);
      setEditPartner(null);
      setDetailPartner((current) =>
        current?.id === editPartner.id
          ? {
              ...current,
              ...nextCore,
              createdAt: editPartner.metadata.createdAt || editPartner.createdAt || current.createdAt,
              metadata: nextMetadata,
            }
          : current
      );
    } catch {
      toast({ title: "Could not update partner", variant: "destructive" });
    }
  };

  const headerTitle =
    variant === "form"
      ? "Add a New Partner"
      : variant === "list"
        ? "Partner Information"
        : "Trusted Partners";

  const headerDescription =
    variant === "form"
      ? "Add people who care about you. They will see your cycle phase when they log in with their email."
      : variant === "list"
        ? "Manage the partners linked to your account, update their details, and keep everything current."
        : "Add people who care about you. They will see your cycle phase and get supportive guidance when they log in to GlowCycle with their email.";

  const formCard = (
    <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 space-y-4">
      <h3 className="font-medium text-foreground flex items-center gap-2">
        <UserPlus className="h-4 w-4 text-primary" /> Add a New Partner
      </h3>
      <PartnerFormFields
        values={addValues}
        onChange={setAddValues}
        errors={addErrors}
        isSaving={addPartner.isPending}
        submitLabel="Add Partner"
        onSubmit={handleAdd}
      />
    </div>
  );

  const listCard = (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-sm font-medium text-foreground">Your Partners ({filteredPartners.length})</h3>
          <p className="text-xs text-muted-foreground">Search, view, edit, or remove partner profiles instantly.</p>
        </div>

        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search partners"
            className="h-11 rounded-full pl-10 pr-10 bg-background/80"
          />
          {searchQuery ? (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              aria-label="Clear search"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-24 rounded-[1.5rem]" />
          <Skeleton className="h-24 rounded-[1.5rem]" />
        </div>
      ) : hasPartners ? (
        filteredPartners.length > 0 ? (
          <div className="space-y-3">
            <AnimatePresence>
              {filteredPartners.map((partner) => (
                <PartnerSummaryCard
                  key={partner.id}
                  partner={partner}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onViewDetails={openDetails}
                  showActions={showActions}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="rounded-[1.5rem] border border-dashed border-border py-10 text-center text-sm text-muted-foreground">
            No partners match your search.
          </div>
        )
      ) : showEmptyState ? (
        <div className="rounded-[1.5rem] border-2 border-dashed border-border py-8 text-center text-sm text-muted-foreground">
          You haven&apos;t added any partners yet.
        </div>
      ) : null}
    </div>
  );

  const partnerDialogs =
    variant === "form" ? null : (
      <>
        <Dialog
          open={isDetailOpen}
          onOpenChange={(open) => {
            setIsDetailOpen(open);
            if (!open) setDetailPartner(null);
          }}
        >
          <DialogContent className="w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl sm:max-w-2xl">
            <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
              <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
                <Heart className="h-6 w-6 text-primary" />
                Partner Details
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Full partner profile with the audit details you asked for.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 p-6">
              {detailPartner ? (
                <>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/20 via-primary/10 to-secondary/20 font-serif text-2xl font-bold text-primary shadow-inner">
                      {getPartnerInitial(detailPartner.partnerName)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-serif text-2xl font-semibold text-foreground">
                        {detailPartner.partnerName}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{detailPartner.partnerEmail}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full border px-3 py-1 text-xs font-semibold",
                        getStatusStyles(detailPartner.metadata.status)
                      )}
                    >
                      {getStatusLabel(detailPartner.metadata.status)}
                    </span>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <PartnerDetailRow icon={Mail} label="Email" value={detailPartner.partnerEmail} />
                    <PartnerDetailRow
                      icon={Phone}
                      label="Phone"
                      value={detailPartner.metadata.phoneNumber || "Not provided"}
                    />
                    <PartnerDetailRow
                      icon={Users}
                      label="Relationship"
                      value={getRelationshipLabel(detailPartner.relationship)}
                    />
                    <PartnerDetailRow
                      icon={CalendarDays}
                      label="Date Added"
                      value={formatDate(detailPartner.metadata.createdAt || detailPartner.createdAt || new Date().toISOString())}
                    />
                    <PartnerDetailRow
                      icon={Clock3}
                      label="Last Updated"
                      value={formatDate(detailPartner.metadata.updatedAt)}
                    />
                    <PartnerDetailRow icon={Users} label="Created By" value={detailPartner.metadata.createdBy} />
                  </div>

                  <div className="rounded-2xl border border-border bg-background/60 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Notes</p>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">
                      {detailPartner.metadata.notes || "No notes saved yet."}
                    </p>
                  </div>
                </>
              ) : null}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isEditOpen}
          onOpenChange={(open) => {
            setIsEditOpen(open);
            if (!open) setEditPartner(null);
          }}
        >
          <DialogContent className="w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl sm:max-w-3xl">
            <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
              <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
                <PencilLine className="h-6 w-6 text-primary" />
                Edit Partner
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Update partner details, then save to refresh the card immediately.
              </DialogDescription>
            </DialogHeader>
            <div className="p-6">
              <PartnerFormFields
                values={editValues}
                onChange={setEditValues}
                errors={editErrors}
                isSaving={addPartner.isPending || removePartner.isPending}
                submitLabel="Save Changes"
                onSubmit={submitEdit}
              />
            </div>
          </DialogContent>
        </Dialog>

        <Dialog
          open={isDeleteOpen}
          onOpenChange={(open) => {
            setIsDeleteOpen(open);
            if (!open) setDeletePartner(null);
          }}
        >
          <DialogContent className="w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl sm:max-w-md">
            <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
              <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
                <Trash2 className="h-6 w-6 text-destructive" />
                Remove Partner
              </DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Are you sure you want to remove this partner?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 p-6">
              <p className="text-sm text-muted-foreground">
                This will remove the partner from your account and clear their saved profile details.
              </p>
              <div className="flex justify-end gap-3">
                <Button type="button" variant="outline" onClick={() => setIsDeleteOpen(false)} className="rounded-xl">
                  Cancel
                </Button>
                <Button type="button" variant="destructive" onClick={confirmDelete} className="rounded-xl">
                  Remove
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </>
    );

  if (variant === "form") {
    return (
      <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
        <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                <Heart className="h-6 w-6 text-primary" />
                {headerTitle}
              </CardTitle>
              <CardDescription className="mt-1">{headerDescription}</CardDescription>
            </div>
            <div className="shrink-0 rounded-full bg-background p-3 text-primary shadow-sm">
              <UserPlus className="h-5 w-5" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">{formCard}</CardContent>
      </Card>
    );
  }

  if (variant === "list") {
    if (!hasPartners && !showEmptyState) {
      return null;
    }

    return (
      <>
        <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
          <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                  <Heart className="h-6 w-6 text-primary" />
                  {headerTitle}
                </CardTitle>
                <CardDescription className="mt-1">{headerDescription}</CardDescription>
              </div>
              <div className="shrink-0 rounded-full bg-background p-3 text-primary shadow-sm">
                <ShieldCheck className="h-5 w-5" />
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">{listCard}</CardContent>
        </Card>
        {partnerDialogs}
      </>
    );
  }

  return (
    <>
      <Card className="overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
        <CardHeader className="border-b border-primary/10 bg-primary/5 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <CardTitle className="flex items-center gap-2 text-2xl font-serif">
                <Heart className="h-6 w-6 text-primary" />
                {headerTitle}
              </CardTitle>
              <CardDescription className="mt-1">{headerDescription}</CardDescription>
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
      {partnerDialogs}
    </>
  );
}
