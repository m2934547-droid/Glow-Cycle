import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  getGetMeQueryKey,
  type GetMeQueryResult,
  useUpdateProfile,
} from "@workspace/api-client-react";
import { motion } from "framer-motion";
import {
  Activity,
  Bell,
  CalendarDays,
  CheckCircle2,
  Download,
  Eye,
  Heart,
  Lock,
  Mail,
  MapPin,
  PencilLine,
  Phone,
  RefreshCw,
  ShieldCheck,
  Search,
  Trash2,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  appendProfileActivity,
  calculateBmi,
  formatProfileDate,
  getBmiCategory,
  getProfileInitials,
  type ActiveSession,
  type NotificationPreferences,
  type ProfileGender,
  useProfileStore,
} from "@/lib/profile-store";

type MeUser = GetMeQueryResult;

type ProfileModal = "edit" | "view" | "health" | "password" | "account" | null;
type AccountAction = "deactivate" | "delete" | null;

const GENDER_OPTIONS: Array<{ value: ProfileGender; label: string }> = [
  { value: "female", label: "Female" },
  { value: "male", label: "Male" },
  { value: "non-binary", label: "Non-binary" },
  { value: "prefer-not-say", label: "Prefer not to say" },
  { value: "other", label: "Other" },
];

const BLOOD_GROUP_OPTIONS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const editProfileSchema = z.object({
  fullName: z.string().min(2, "Please enter a full name"),
  emailAddress: z.string().email("Please enter a valid email address"),
  phoneNumber: z
    .string()
    .min(7, "Please enter a valid phone number")
    .regex(/^[+0-9()\-\s]+$/, "Please enter a valid phone number"),
  dateOfBirth: z.string().optional().or(z.literal("")),
  gender: z.enum(["female", "male", "non-binary", "prefer-not-say", "other"]),
  bio: z.string().max(280, "Bio must be 280 characters or less").optional().or(z.literal("")),
});

const healthSchema = z.object({
  heightCm: z.coerce.number().min(80, "Height should be at least 80 cm").max(260, "Height looks too high"),
  weightKg: z.coerce.number().min(25, "Weight should be at least 25 kg").max(400, "Weight looks too high"),
  bloodGroup: z.string().min(1, "Please select a blood group"),
  allergies: z.string().optional(),
  medicalConditions: z.string().optional(),
  medications: z.string().optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

function ProfileAvatar({
  name,
  avatarDataUrl,
  size = "lg",
}: {
  name?: string | null;
  avatarDataUrl?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const dimensions = {
    sm: "h-10 w-10",
    md: "h-14 w-14",
    lg: "h-20 w-20",
    xl: "h-24 w-24",
  }[size];

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full border border-white/70 bg-gradient-to-br from-[#ffb6cf] via-[#ffd8e4] to-[#9b1638] shadow-[0_20px_50px_rgba(255,92,168,0.18)]",
        dimensions
      )}
    >
      {avatarDataUrl ? (
        <img src={avatarDataUrl} alt="Profile avatar" className="h-full w-full object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-white">
          <span className="font-serif text-xl font-semibold">{getProfileInitials(name)}</span>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  title,
  description,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  description: string;
  icon: typeof Heart;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("overflow-hidden rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl", className)}>
      <CardHeader className="border-b border-primary/10 bg-primary/5 pb-5">
        <CardTitle className="flex items-center gap-2 text-xl font-serif">
          <Icon className="h-5 w-5 text-primary" />
          {title}
        </CardTitle>
        <CardDescription className="mt-1">{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}

function InfoTile({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof User;
}) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-primary" />
        <span className="break-words">{value}</span>
      </p>
    </div>
  );
}

function TogglePill({
  label,
  description,
  checked,
  onToggle,
}: {
  label: string;
  description: string;
  checked: boolean;
  onToggle: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onToggle(!checked)}
      className={cn(
        "flex items-center justify-between gap-3 rounded-2xl border p-4 text-left transition-all duration-200",
        checked
          ? "border-primary/30 bg-primary/5 shadow-sm"
          : "border-border bg-background/70 hover:border-primary/20 hover:bg-primary/5"
      )}
    >
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
      </div>
      <div
        className={cn(
          "relative h-6 w-11 rounded-full transition-colors",
          checked ? "bg-primary" : "bg-muted"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
            checked ? "translate-x-6" : "translate-x-1"
          )}
        />
      </div>
    </button>
  );
}

function QuickActionButton({
  label,
  icon: Icon,
  onClick,
}: {
  label: string;
  icon: typeof PencilLine;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="outline"
      className="h-11 justify-start gap-2 rounded-full border-primary/15 bg-white/70 px-4 shadow-sm"
      onClick={onClick}
    >
      <Icon className="h-4 w-4 text-primary" />
      {label}
    </Button>
  );
}

function ActivityRow({ title, description, createdAt }: { title: string; description: string; createdAt: string }) {
  return (
    <div className="rounded-2xl border border-border bg-background/70 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-foreground">{title}</p>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>
        <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          {formatProfileDate(createdAt)}
        </span>
      </div>
    </div>
  );
}

export function UserProfileManagement({ user }: { user: MeUser }) {
  const queryClient = useQueryClient();
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();
  const [store, setStore] = useProfileStore(user);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModal, setActiveModal] = useState<ProfileModal>(null);
  const [accountAction, setAccountAction] = useState<AccountAction>(null);
  const [avatarPreview, setAvatarPreview] = useState(store?.avatarDataUrl ?? "");
  const [securityEmail, setSecurityEmail] = useState(store?.profileEmail ?? user.email ?? "");
  const [securityPhone, setSecurityPhone] = useState(user.phoneNumber ?? "");
  const [notificationDraft, setNotificationDraft] = useState<NotificationPreferences>(
    store?.notificationPreferences ?? {
      emailNotifications: true,
      smsNotifications: false,
      healthReminders: true,
      cycleTrackingAlerts: true,
      appointmentReminders: true,
      promotionalNotifications: false,
    }
  );

  const displayName = user.name ?? "Profile";
  const displayEmail = store?.profileEmail || user.email || "Not available";
  const displayPhone = user.phoneNumber || "Not available";
  const bmi = calculateBmi(user.weightKg, user.heightCm);
  const bmiCategory = getBmiCategory(bmi);

  const editProfileForm = useForm<z.infer<typeof editProfileSchema>>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      fullName: displayName,
      emailAddress: displayEmail,
      phoneNumber: displayPhone === "Not available" ? "" : displayPhone,
      dateOfBirth: store?.dateOfBirth ?? "",
      gender: store?.gender ?? "prefer-not-say",
      bio: store?.bio ?? "",
    },
  });

  const healthForm = useForm<z.infer<typeof healthSchema>>({
    resolver: zodResolver(healthSchema),
    defaultValues: {
      heightCm: user.heightCm ?? 0,
      weightKg: user.weightKg ?? 0,
      bloodGroup: store?.bloodGroup ?? "",
      allergies: store?.allergies ?? "",
      medicalConditions: store?.medicalConditions ?? "",
      medications: store?.medications ?? "",
    },
  });

  const passwordForm = useForm<z.infer<typeof passwordSchema>>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!store) return;

    setAvatarPreview(store.avatarDataUrl);
    setSecurityEmail(store.profileEmail || user.email || "");
    setSecurityPhone(user.phoneNumber ?? "");
    setNotificationDraft(store.notificationPreferences);

    editProfileForm.reset({
      fullName: user.name ?? "",
      emailAddress: store.profileEmail || user.email || "",
      phoneNumber: user.phoneNumber ?? "",
      dateOfBirth: store.dateOfBirth ?? "",
      gender: store.gender ?? "prefer-not-say",
      bio: store.bio ?? "",
    });

    healthForm.reset({
      heightCm: user.heightCm ?? 0,
      weightKg: user.weightKg ?? 0,
      bloodGroup: store.bloodGroup ?? "",
      allergies: store.allergies ?? "",
      medicalConditions: store.medicalConditions ?? "",
      medications: store.medications ?? "",
    });
  }, [store, user, editProfileForm, healthForm]);

  useEffect(() => {
    const hasLoginActivity = store?.activityHistory.some((entry) => entry.title === "Login Activity");

    if (!hasLoginActivity && user) {
      setStore((current) => {
        if (!current) return current;

        return {
          ...current,
          activityHistory: [
            {
              id: crypto.randomUUID(),
              title: "Login Activity",
              description: `Signed in as ${displayName}.`,
              createdAt: new Date().toISOString(),
            },
            ...current.activityHistory,
          ].slice(0, 12),
        };
      });
    }
  }, [displayName, setStore, store?.activityHistory, user]);

  const filteredActivity = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const activityItems = store?.activityHistory ?? [];

    if (!search) return activityItems;

    return activityItems.filter(
      (item) =>
        item.title.toLowerCase().includes(search) ||
        item.description.toLowerCase().includes(search)
    );
  }, [searchQuery, store?.activityHistory]);

  const filteredSessions = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    const sessions = store?.activeSessions ?? [];

    if (!search) return sessions;

    return sessions.filter(
      (session) =>
        session.device.toLowerCase().includes(search) ||
        session.location.toLowerCase().includes(search)
    );
  }, [searchQuery, store?.activeSessions]);

  if (!store) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-44 rounded-[2rem]" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-[2rem]" />
          <Skeleton className="h-80 rounded-[2rem]" />
        </div>
      </div>
    );
  }

  const handleAvatarUpload = (file?: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast({
        title: "Unsupported image format",
        description: "Please upload a JPG, PNG, or WEBP image.",
        variant: "destructive",
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setAvatarPreview(result);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = editProfileForm.handleSubmit((values) => {
    const nextPhone = values.phoneNumber.trim();
    const nextEmail = values.emailAddress.trim().toLowerCase();

    updateProfileMutation.mutate(
      {
        data: {
          name: values.fullName.trim(),
          phoneNumber: nextPhone,
          age: user.age,
          heightCm: user.heightCm,
          weightKg: user.weightKg,
        },
      },
      {
        onSuccess: (updated) => {
          queryClient.setQueryData(getGetMeQueryKey(), (current?: GetMeQueryResult) =>
            current
              ? {
                  ...current,
                  name: values.fullName.trim(),
                  phoneNumber: nextPhone || undefined,
                }
              : updated
          );

          setStore((current) => {
            if (!current) return current;

            return {
              ...current,
              profileEmail: nextEmail,
              bio: values.bio?.trim() ?? "",
              dateOfBirth: values.dateOfBirth ?? "",
              gender: values.gender,
              avatarDataUrl: avatarPreview,
              lastUpdatedAt: new Date().toISOString(),
            };
          });

          appendProfileActivity(user, {
            title: "Profile Updated",
            description: "Personal details and avatar were updated.",
          });

          toast({ title: "Profile updated", description: "Your changes are live right away." });
          setActiveModal(null);
        },
        onError: () => {
          toast({ title: "Update failed", description: "Could not save your profile.", variant: "destructive" });
        },
      }
    );
  });

  const handleSaveHealth = healthForm.handleSubmit((values) => {
    updateProfileMutation.mutate(
      {
        data: {
          age: user.age,
          heightCm: values.heightCm,
          weightKg: values.weightKg,
        },
      },
      {
        onSuccess: () => {
          queryClient.setQueryData(getGetMeQueryKey(), (current?: GetMeQueryResult) =>
            current
              ? {
                  ...current,
                  heightCm: values.heightCm,
                  weightKg: values.weightKg,
                  bmi: calculateBmi(values.weightKg, values.heightCm) ?? current.bmi,
                  bmiCategory: getBmiCategory(calculateBmi(values.weightKg, values.heightCm)),
                }
              : current
          );

          setStore((current) => {
            if (!current) return current;

            return {
              ...current,
              bloodGroup: values.bloodGroup,
              allergies: values.allergies?.trim() ?? "",
              medicalConditions: values.medicalConditions?.trim() ?? "",
              medications: values.medications?.trim() ?? "",
              lastUpdatedAt: new Date().toISOString(),
            };
          });

          appendProfileActivity(user, {
            title: "Health Data Updated",
            description: "Height, weight, and health details were refreshed.",
          });

          toast({ title: "Health data saved", description: "BMI has been updated automatically." });
          setActiveModal(null);
        },
        onError: () => {
          toast({ title: "Update failed", description: "Could not save health data.", variant: "destructive" });
        },
      }
    );
  });

  const handleSaveSecurityEmail = () => {
    const nextEmail = securityEmail.trim().toLowerCase();
    if (!nextEmail) {
      toast({ title: "Email required", description: "Please enter a valid email address.", variant: "destructive" });
      return;
    }

    setStore((current) => {
      if (!current) return current;
      return {
        ...current,
        profileEmail: nextEmail,
        lastUpdatedAt: new Date().toISOString(),
      };
    });

    appendProfileActivity(user, {
      title: "Email Updated",
      description: "Profile email was changed from the security panel.",
    });

    toast({ title: "Email updated", description: "The updated email is visible immediately." });
  };

  const handleSaveSecurityPhone = () => {
    updateProfileMutation.mutate(
      {
        data: {
          phoneNumber: securityPhone.trim(),
          age: user.age,
          heightCm: user.heightCm,
          weightKg: user.weightKg,
        },
      },
      {
        onSuccess: () => {
          queryClient.setQueryData(getGetMeQueryKey(), (current?: GetMeQueryResult) =>
            current
              ? {
                  ...current,
                  phoneNumber: securityPhone.trim() || undefined,
                }
              : current
          );

          appendProfileActivity(user, {
            title: "Phone Number Updated",
            description: "Contact details were updated from security settings.",
          });

          toast({ title: "Phone updated", description: "Your phone number is up to date." });
        },
        onError: () => {
          toast({ title: "Update failed", description: "Could not update your phone number.", variant: "destructive" });
        },
      }
    );
  };

  const handleSaveNotifications = () => {
    setStore((current) => {
      if (!current) return current;

      return {
        ...current,
        notificationPreferences: notificationDraft,
        lastUpdatedAt: new Date().toISOString(),
      };
    });

    appendProfileActivity(user, {
      title: "Notification Preferences Updated",
      description: "Alert preferences were saved.",
    });

    toast({ title: "Preferences saved", description: "Notification settings were updated." });
  };

  const handleChangePassword = passwordForm.handleSubmit(() => {
    appendProfileActivity(user, {
      title: "Password Changed",
      description: "Password change confirmation was recorded.",
    });

    toast({
      title: "Password updated",
      description: "The password change flow is ready for backend integration.",
    });
    passwordForm.reset();
    setActiveModal(null);
  });

  const handleDownloadData = () => {
    const payload = {
      profile: {
        name: user.name,
        email: displayEmail,
        phoneNumber: displayPhone,
        age: user.age,
        heightCm: user.heightCm,
        weightKg: user.weightKg,
        bmi,
        bmiCategory,
        createdAt: user.createdAt,
        lastUpdatedAt: store.lastUpdatedAt,
      },
      wellness: store,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "glowcycle-profile-export.json";
    link.click();
    URL.revokeObjectURL(url);

    toast({ title: "Export ready", description: "Your profile data download started." });
    appendProfileActivity(user, {
      title: "Profile Exported",
      description: "A personal data export was generated.",
    });
  };

  const handleAccountActionConfirm = () => {
    if (!accountAction) return;

    if (accountAction === "deactivate") {
      setStore((current) => {
        if (!current) return current;
        return {
          ...current,
          isDeactivated: true,
          lastUpdatedAt: new Date().toISOString(),
        };
      });

      appendProfileActivity(user, {
        title: "Account Deactivated",
        description: "The account was marked as deactivated locally.",
      });

      toast({ title: "Account deactivated", description: "The profile is now in a deactivated state." });
    }

    if (accountAction === "delete") {
      window.localStorage.removeItem(`glowcycle.profile-store.v1.${user.id}`);
      setStore(null);
      queryClient.clear();
      toast({ title: "Local profile data removed", description: "The client profile cache was cleared." });
    }

    setAccountAction(null);
    setActiveModal(null);
  };

  const profileSections = [
    { key: "personal", title: "Personal Information", keywords: ["name", "email", "phone", "dob", "gender", "bio"] },
    { key: "health", title: "Personal Health Information", keywords: ["height", "weight", "bmi", "blood", "allergy", "medicine"] },
    { key: "security", title: "Security Settings", keywords: ["password", "email", "phone", "sessions"] },
    { key: "notifications", title: "Notification Preferences", keywords: ["notifications", "alerts", "reminders"] },
    { key: "activity", title: "Activity History", keywords: ["activity", "login", "profile", "partner"] },
    { key: "account", title: "Account Management", keywords: ["download", "export", "deactivate", "delete"] },
  ];

  const search = searchQuery.trim().toLowerCase();
  const visibleSections = profileSections.filter((section) => {
    if (!search) return true;
    return [section.title, ...section.keywords].some((item) => item.toLowerCase().includes(search));
  });

  return (
    <>
      <div className="space-y-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[2rem] border border-primary/10 bg-card/80 p-6 shadow-lg backdrop-blur-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <ProfileAvatar name={displayName} avatarDataUrl={store.avatarDataUrl} size="xl" />
              <div className="space-y-2">
                <div>
                  <h2 className="flex items-center gap-2 font-serif text-3xl font-bold text-foreground">
                    <Heart className="h-7 w-7 text-primary" />
                    Personal Information
                  </h2>
                  <p className="mt-2 max-w-2xl text-muted-foreground">
                    Manage your profile, health data, security settings, notification preferences, and account controls in one place.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    BMI: {bmi ?? "N/A"} {bmi ? `(${bmiCategory})` : ""}
                  </span>
                  <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-medium text-rose-700">
                    Created {formatProfileDate(user.createdAt)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    Updated {formatProfileDate(store.lastUpdatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid w-full gap-3 sm:grid-cols-2 lg:max-w-lg">
              <QuickActionButton label="Edit Profile" icon={PencilLine} onClick={() => setActiveModal("edit")} />
              <QuickActionButton label="View Profile" icon={Eye} onClick={() => setActiveModal("view")} />
              <QuickActionButton label="Update Health Data" icon={Activity} onClick={() => setActiveModal("health")} />
              <QuickActionButton label="Change Password" icon={Lock} onClick={() => setActiveModal("password")} />
            </div>
          </div>

          <div className="mt-6">
            <div className="relative">
              <SearchIcon />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search personal info, health, security, or account settings"
                className="h-12 rounded-full pl-11 pr-10 bg-white/80"
              />
              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                >
                  <X className="h-4 w-4" />
                </button>
              ) : null}
            </div>
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-2">
          {visibleSections.some((section) => section.key === "personal") ? (
            <SectionCard
              title="Personal Information"
              description="Edit the details you want reflected across the app."
              icon={User}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InfoTile label="Full Name" value={user.name ?? "Not available"} icon={User} />
                <InfoTile label="Email" value={displayEmail} icon={Mail} />
                <InfoTile label="Phone" value={displayPhone} icon={Phone} />
                <InfoTile label="Age" value={`${user.age ?? "Not available"} years`} icon={CalendarDays} />
              </div>

              <div className="mt-4 rounded-2xl border border-border bg-background/70 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Bio</p>
                <p className="mt-2 text-sm text-foreground">{store.bio || "No profile bio added yet."}</p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={() => setActiveModal("edit")} className="rounded-full">
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveModal("view")} className="rounded-full">
                  <Eye className="mr-2 h-4 w-4" />
                  View Profile
                </Button>
              </div>
            </SectionCard>
          ) : null}

          {visibleSections.some((section) => section.key === "health") ? (
            <SectionCard
              title="Personal Health Information"
              description="Height, weight, blood group, and medical essentials with live BMI."
              icon={Activity}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <InfoTile label="Height" value={`${user.heightCm ?? "Not available"} cm`} icon={MapPin} />
                <InfoTile label="Weight" value={`${user.weightKg ?? "Not available"} kg`} icon={Activity} />
                <InfoTile label="Blood Group" value={store.bloodGroup || "Not available"} icon={ShieldCheck} />
                <InfoTile label="BMI" value={`${bmi ?? "Not available"} ${bmi ? `(${bmiCategory})` : ""}`} icon={Heart} />
              </div>

              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Allergies</p>
                  <p className="mt-2 text-sm text-foreground">{store.allergies || "No allergies listed."}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Medical Conditions</p>
                  <p className="mt-2 text-sm text-foreground">{store.medicalConditions || "No medical conditions listed."}</p>
                </div>
                <div className="rounded-2xl border border-border bg-background/70 p-4">
                  <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Medications</p>
                  <p className="mt-2 text-sm text-foreground">{store.medications || "No medications listed."}</p>
                </div>
              </div>

              <div className="mt-4">
                <Button type="button" onClick={() => setActiveModal("health")} className="rounded-full">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Update Health Data
                </Button>
              </div>
            </SectionCard>
          ) : null}

          {visibleSections.some((section) => section.key === "security") ? (
            <SectionCard title="Security Settings" description="Protect your account and review active access." icon={Lock}>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Update Email</p>
                    <Input
                      value={securityEmail}
                      onChange={(event) => setSecurityEmail(event.target.value)}
                      className="mt-2 rounded-xl"
                      type="email"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" onClick={handleSaveSecurityEmail} className="rounded-full">
                      Save Email
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-[1fr_auto]">
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Update Phone Number</p>
                    <Input
                      value={securityPhone}
                      onChange={(event) => setSecurityPhone(event.target.value)}
                      className="mt-2 rounded-xl"
                    />
                  </div>
                  <div className="flex items-end">
                    <Button type="button" variant="outline" onClick={handleSaveSecurityPhone} className="rounded-full">
                      Save Phone
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={() => setActiveModal("password")} className="rounded-full">
                    <Lock className="mr-2 h-4 w-4" />
                    Change Password
                  </Button>
                </div>

                <div className="grid gap-3">
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Login Activity History</p>
                    <div className="mt-3 space-y-2">
                      {(store.activityHistory.filter((entry) => entry.title.includes("Login")) || []).slice(0, 3).length > 0 ? (
                        store.activityHistory
                          .filter((entry) => entry.title.includes("Login"))
                          .slice(0, 3)
                          .map((entry) => (
                            <div key={entry.id} className="rounded-xl bg-white/70 p-3 text-sm text-foreground">
                              <p className="font-medium">{entry.title}</p>
                              <p className="text-muted-foreground">{entry.description}</p>
                            </div>
                          ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No login activity recorded yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Active Sessions</p>
                    <div className="mt-3 space-y-2">
                      {filteredSessions.length > 0 ? (
                        filteredSessions.map((session: ActiveSession) => (
                          <div key={session.id} className="flex items-start justify-between gap-3 rounded-xl bg-white/70 p-3">
                            <div>
                              <p className="text-sm font-medium text-foreground">{session.device}</p>
                              <p className="text-xs text-muted-foreground">{session.location}</p>
                            </div>
                            <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-primary">
                              {session.isCurrent ? "Current" : "Active"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No active sessions available.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          ) : null}

          {visibleSections.some((section) => section.key === "notifications") ? (
            <SectionCard
              title="Notification Preferences"
              description="Choose which reminders and alerts reach you."
              icon={Bell}
            >
              <div className="grid gap-3">
                <TogglePill
                  label="Email Notifications"
                  description="Receive updates by email."
                  checked={notificationDraft.emailNotifications}
                  onToggle={(next) => setNotificationDraft((current) => ({ ...current, emailNotifications: next }))}
                />
                <TogglePill
                  label="SMS Notifications"
                  description="Get important updates by text."
                  checked={notificationDraft.smsNotifications}
                  onToggle={(next) => setNotificationDraft((current) => ({ ...current, smsNotifications: next }))}
                />
                <TogglePill
                  label="Health Reminders"
                  description="Daily wellness reminders and check-ins."
                  checked={notificationDraft.healthReminders}
                  onToggle={(next) => setNotificationDraft((current) => ({ ...current, healthReminders: next }))}
                />
                <TogglePill
                  label="Cycle Tracking Alerts"
                  description="Alerts about cycle phases and predictions."
                  checked={notificationDraft.cycleTrackingAlerts}
                  onToggle={(next) => setNotificationDraft((current) => ({ ...current, cycleTrackingAlerts: next }))}
                />
                <TogglePill
                  label="Appointment Reminders"
                  description="Keep up with upcoming consultations."
                  checked={notificationDraft.appointmentReminders}
                  onToggle={(next) => setNotificationDraft((current) => ({ ...current, appointmentReminders: next }))}
                />
                <TogglePill
                  label="Promotional Notifications"
                  description="Product offers and announcements."
                  checked={notificationDraft.promotionalNotifications}
                  onToggle={(next) => setNotificationDraft((current) => ({ ...current, promotionalNotifications: next }))}
                />
              </div>

              <div className="mt-4 flex justify-end">
                <Button type="button" onClick={handleSaveNotifications} className="rounded-full">
                  Save Preferences
                </Button>
              </div>
            </SectionCard>
          ) : null}

          {visibleSections.some((section) => section.key === "activity") ? (
            <SectionCard title="Activity History" description="Recent profile actions and logins." icon={Activity}>
              <div className="space-y-3">
                {filteredActivity.length > 0 ? (
                  filteredActivity.map((entry) => (
                    <ActivityRow key={entry.id} title={entry.title} description={entry.description} createdAt={entry.createdAt} />
                  ))
                ) : (
                  <div className="rounded-2xl border border-dashed border-border bg-background/60 p-8 text-center text-sm text-muted-foreground">
                    No matching activity found.
                  </div>
                )}
              </div>
            </SectionCard>
          ) : null}

          {visibleSections.some((section) => section.key === "account") ? (
            <SectionCard title="Account Management" description="Export or manage account lifecycle actions." icon={Users}>
              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="button" variant="outline" onClick={handleDownloadData} className="h-11 rounded-full">
                  <Download className="mr-2 h-4 w-4" />
                  Download Personal Data
                </Button>
                <Button type="button" variant="outline" onClick={() => setActiveModal("account")} className="h-11 rounded-full">
                  <Download className="mr-2 h-4 w-4" />
                  Export Profile Information
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 rounded-full border-amber-200 text-amber-700 hover:bg-amber-50"
                  onClick={() => {
                    setAccountAction("deactivate");
                    setActiveModal("account");
                  }}
                >
                  <ShieldCheck className="mr-2 h-4 w-4" />
                  Deactivate Account
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  className="h-11 rounded-full"
                  onClick={() => {
                    setAccountAction("delete");
                    setActiveModal("account");
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete Account
                </Button>
              </div>
            </SectionCard>
          ) : null}
        </div>

        {search && visibleSections.length === 0 ? (
          <div className="rounded-[2rem] border border-dashed border-border bg-card/70 p-8 text-center text-sm text-muted-foreground">
            No profile sections match your search.
          </div>
        ) : null}
      </div>

      <Dialog open={activeModal === "edit"} onOpenChange={(open) => setActiveModal(open ? "edit" : null)}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl">
          <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <PencilLine className="h-6 w-6 text-primary" />
              Edit Profile
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Update your personal details, avatar, and bio. Changes will appear immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="flex items-center gap-4 rounded-[1.75rem] border border-primary/10 bg-primary/5 p-4">
              <ProfileAvatar name={editProfileForm.watch("fullName")} avatarDataUrl={avatarPreview} size="lg" />
              <div className="flex-1 space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => document.getElementById("profile-avatar-upload")?.click()}>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload JPG/PNG/WEBP
                  </Button>
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setAvatarPreview("")}>
                    <X className="mr-2 h-4 w-4" />
                    Remove Picture
                  </Button>
                </div>
                <Input
                  id="profile-avatar-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(event) => handleAvatarUpload(event.target.files?.[0])}
                />
                <p className="text-sm text-muted-foreground">
                  Upload a clean profile image to keep your avatar consistent across the dashboard.
                </p>
              </div>
            </div>

            <Form {...editProfileForm}>
              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={editProfileForm.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editProfileForm.control}
                    name="emailAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email Address</FormLabel>
                        <FormControl>
                          <Input type="email" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={editProfileForm.control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editProfileForm.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <FormField
                    control={editProfileForm.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select gender" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {GENDER_OPTIONS.map((option) => (
                              <SelectItem key={option.value} value={option.value}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div />
                </div>

                <FormField
                  control={editProfileForm.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Profile Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Write a short introduction..." className="min-h-[120px] rounded-2xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-full" disabled={updateProfileMutation.isPending}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "view"} onOpenChange={(open) => setActiveModal(open ? "view" : null)}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl">
          <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <Eye className="h-6 w-6 text-primary" />
              View Profile
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              A complete snapshot of your user profile and audit dates.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <ProfileAvatar name={displayName} avatarDataUrl={store.avatarDataUrl} size="xl" />
              <div className="space-y-2">
                <h3 className="font-serif text-2xl font-semibold text-foreground">{user.name}</h3>
                <p className="text-muted-foreground">{displayEmail}</p>
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                    Created {formatProfileDate(user.createdAt)}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                    Updated {formatProfileDate(store.lastUpdatedAt)}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <InfoTile label="Full Name" value={user.name ?? "Not available"} icon={User} />
              <InfoTile label="Email" value={displayEmail} icon={Mail} />
              <InfoTile label="Phone" value={displayPhone} icon={Phone} />
              <InfoTile label="Age" value={`${user.age ?? "Not available"} years`} icon={CalendarDays} />
              <InfoTile label="Date of Birth" value={formatProfileDate(store.dateOfBirth)} icon={CalendarDays} />
              <InfoTile label="Gender" value={store.gender.replace(/-/g, " ")} icon={Users} />
              <InfoTile label="Height" value={`${user.heightCm ?? "Not available"} cm`} icon={MapPin} />
              <InfoTile label="Weight" value={`${user.weightKg ?? "Not available"} kg`} icon={Activity} />
            </div>
            <div className="rounded-2xl border border-border bg-background/70 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">Bio</p>
              <p className="mt-2 text-sm text-foreground">{store.bio || "No profile bio added yet."}</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "health"} onOpenChange={(open) => setActiveModal(open ? "health" : null)}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl">
          <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <Activity className="h-6 w-6 text-primary" />
              Update Health Data
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Keep your health information current and watch BMI recalculate automatically.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Form {...healthForm}>
              <form onSubmit={handleSaveHealth} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={healthForm.control}
                    name="heightCm"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Height (cm)</FormLabel>
                        <FormControl>
                          <Input type="number" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={healthForm.control}
                    name="weightKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input type="number" className="rounded-xl" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FormField
                    control={healthForm.control}
                    name="bloodGroup"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Blood Group</FormLabel>
                        <Select value={field.value} onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger className="rounded-xl">
                              <SelectValue placeholder="Select blood group" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {BLOOD_GROUP_OPTIONS.map((item) => (
                              <SelectItem key={item} value={item}>
                                {item}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="rounded-2xl border border-border bg-background/70 p-4">
                    <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">BMI Preview</p>
                    <p className="mt-2 text-2xl font-serif font-semibold text-foreground">
                      {calculateBmi(healthForm.watch("weightKg"), healthForm.watch("heightCm")) ?? "N/A"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {getBmiCategory(calculateBmi(healthForm.watch("weightKg"), healthForm.watch("heightCm")))}
                    </p>
                  </div>
                </div>

                <FormField
                  control={healthForm.control}
                  name="allergies"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Allergies</FormLabel>
                      <FormControl>
                        <Textarea className="rounded-2xl" placeholder="List any allergies..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={healthForm.control}
                  name="medicalConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medical Conditions</FormLabel>
                      <FormControl>
                        <Textarea className="rounded-2xl" placeholder="List any ongoing conditions..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={healthForm.control}
                  name="medications"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Medications</FormLabel>
                      <FormControl>
                        <Textarea className="rounded-2xl" placeholder="List medications or supplements..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-full" disabled={updateProfileMutation.isPending}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    {updateProfileMutation.isPending ? "Saving..." : "Save Health Data"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "password"} onOpenChange={(open) => setActiveModal(open ? "password" : null)}>
        <DialogContent className="max-w-2xl rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl">
          <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <Lock className="h-6 w-6 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Use this secure form to capture password changes and log the activity.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <Form {...passwordForm}>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <FormField
                  control={passwordForm.control}
                  name="currentPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Current Password</FormLabel>
                      <FormControl>
                        <Input type="password" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="newPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>New Password</FormLabel>
                      <FormControl>
                        <Input type="password" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirm Password</FormLabel>
                      <FormControl>
                        <Input type="password" className="rounded-xl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveModal(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-full">
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Save Password
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={activeModal === "account"} onOpenChange={(open) => setActiveModal(open ? "account" : null)}>
        <DialogContent className="max-w-xl rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl">
          <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <ShieldCheck className="h-6 w-6 text-primary" />
              Account Management
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Confirm the account action you want to apply locally to your profile data.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 p-6">
            <p className="text-sm text-muted-foreground">
              {accountAction === "delete"
                ? "This will clear the local profile cache for this device and return you to a clean session."
                : "This will mark the account as deactivated in the client profile store."}
            </p>
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" className="rounded-full" onClick={() => setActiveModal(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant={accountAction === "delete" ? "destructive" : "default"}
                className="rounded-full"
                onClick={handleAccountActionConfirm}
              >
                Confirm
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function SearchIcon() {
  return <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />;
}
