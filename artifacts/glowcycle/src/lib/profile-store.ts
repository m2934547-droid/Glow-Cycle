import { useEffect, useState } from "react";
import type { User as ApiUser } from "@workspace/api-client-react";

export type ProfileGender = "female" | "male" | "non-binary" | "prefer-not-say" | "other";

export type NotificationPreferences = {
  emailNotifications: boolean;
  smsNotifications: boolean;
  healthReminders: boolean;
  cycleTrackingAlerts: boolean;
  appointmentReminders: boolean;
  promotionalNotifications: boolean;
};

export type ActiveSession = {
  id: string;
  device: string;
  location: string;
  lastActiveAt: string;
  isCurrent: boolean;
};

export type ProfileActivity = {
  id: string;
  title: string;
  description: string;
  createdAt: string;
};

export type ProfileStore = {
  profileEmail: string;
  bio: string;
  dateOfBirth: string;
  gender: ProfileGender;
  bloodGroup: string;
  allergies: string;
  medicalConditions: string;
  medications: string;
  avatarDataUrl: string;
  notificationPreferences: NotificationPreferences;
  activeSessions: ActiveSession[];
  activityHistory: ProfileActivity[];
  lastUpdatedAt: string;
  createdBy: string;
  isDeactivated: boolean;
};

const PROFILE_STORE_PREFIX = "glowcycle.profile-store.v1";
const PROFILE_STORE_EVENT = "glowcycle-profile-store-change";

function buildDefaultSession(user: ApiUser): ActiveSession {
  return {
    id: "current-session",
    device: typeof navigator !== "undefined" ? navigator.userAgent : "Current browser",
    location: "This device",
    lastActiveAt: new Date().toISOString(),
    isCurrent: true,
  };
}

function buildDefaultActivity(user: ApiUser): ProfileActivity[] {
  return [
    {
      id: "login-activity",
      title: "Login Activity",
      description: `Signed in as ${user.name ?? user.email}.`,
      createdAt: new Date().toISOString(),
    },
  ];
}

export function getProfileStorageKey(userId: number) {
  return `${PROFILE_STORE_PREFIX}.${userId}`;
}

export function getProfileInitials(name?: string | null) {
  const normalized = name?.trim() ?? "";
  if (!normalized) return "?";

  const segments = normalized.split(/\s+/).filter(Boolean);
  if (segments.length === 1) {
    return segments[0].slice(0, 2).toUpperCase();
  }

  return `${segments[0].charAt(0)}${segments[1].charAt(0)}`.toUpperCase();
}

export function calculateBmi(weightKg?: number | null, heightCm?: number | null) {
  if (!weightKg || !heightCm || heightCm <= 0) return null;

  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

export function getBmiCategory(bmi?: number | null) {
  if (bmi == null) return "Not available";
  if (bmi < 18.5) return "Underweight";
  if (bmi < 25) return "Normal";
  if (bmi < 30) return "Overweight";
  return "Obese";
}

export function formatProfileDate(value?: string | null) {
  if (!value) return "Not available";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function getDefaultProfileStore(user: ApiUser): ProfileStore {
  const now = new Date().toISOString();

  return {
    profileEmail: user.email ?? "",
    bio: "",
    dateOfBirth: "",
    gender: "prefer-not-say",
    bloodGroup: "",
    allergies: "",
    medicalConditions: "",
    medications: "",
    avatarDataUrl: "",
    notificationPreferences: {
      emailNotifications: true,
      smsNotifications: false,
      healthReminders: true,
      cycleTrackingAlerts: true,
      appointmentReminders: true,
      promotionalNotifications: false,
    },
    activeSessions: [buildDefaultSession(user)],
    activityHistory: buildDefaultActivity(user),
    lastUpdatedAt: now,
    createdBy: user.name ?? user.email ?? "Current user",
    isDeactivated: false,
  };
}

function parseProfileStore(raw: string | null, fallback: ProfileStore) {
  if (!raw) return fallback;

  try {
    const parsed = JSON.parse(raw) as Partial<ProfileStore>;
    return {
      ...fallback,
      ...parsed,
      notificationPreferences: {
        ...fallback.notificationPreferences,
        ...parsed.notificationPreferences,
      },
      activeSessions: Array.isArray(parsed.activeSessions) ? parsed.activeSessions : fallback.activeSessions,
      activityHistory: Array.isArray(parsed.activityHistory) ? parsed.activityHistory : fallback.activityHistory,
    };
  } catch {
    return fallback;
  }
}

export function loadProfileStore(user?: ApiUser | null): ProfileStore | null {
  if (!user) return null;
  if (typeof window === "undefined") return getDefaultProfileStore(user);

  const fallback = getDefaultProfileStore(user);
  const raw = window.localStorage.getItem(getProfileStorageKey(user.id));
  return parseProfileStore(raw, fallback);
}

export function saveProfileStore(user: ApiUser, store: ProfileStore | null) {
  if (typeof window === "undefined") return;

  if (store === null) {
    window.localStorage.removeItem(getProfileStorageKey(user.id));
  } else {
    window.localStorage.setItem(getProfileStorageKey(user.id), JSON.stringify(store));
  }

  window.dispatchEvent(
    new CustomEvent(PROFILE_STORE_EVENT, {
      detail: { userId: user.id },
    })
  );
}

export function updateProfileStore(
  user: ApiUser,
  updater: (current: ProfileStore) => ProfileStore | null
) {
  const current = loadProfileStore(user) ?? getDefaultProfileStore(user);
  const next = updater(current);
  saveProfileStore(user, next);
  return next;
}

export function appendProfileActivity(
  user: ApiUser,
  activity: Omit<ProfileActivity, "id" | "createdAt">
) {
  return updateProfileStore(user, (current) => ({
    ...current,
    lastUpdatedAt: new Date().toISOString(),
    activityHistory: [
      {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        ...activity,
      },
      ...current.activityHistory,
    ].slice(0, 12),
  }));
}

export function useProfileStore(user?: ApiUser | null) {
  const [store, setStore] = useState<ProfileStore | null>(() => loadProfileStore(user));

  useEffect(() => {
    setStore(loadProfileStore(user));
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;

    const sync = (userId: number) => {
      if (userId === user.id) {
        setStore(loadProfileStore(user));
      }
    };

    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent<{ userId?: number }>).detail;
      if (detail?.userId) {
        sync(detail.userId);
      }
    };

    const handleStorage = (event: StorageEvent) => {
      if (event.key === getProfileStorageKey(user.id)) {
        setStore(loadProfileStore(user));
      }
    };

    window.addEventListener(PROFILE_STORE_EVENT, handleCustomEvent);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener(PROFILE_STORE_EVENT, handleCustomEvent);
      window.removeEventListener("storage", handleStorage);
    };
  }, [user?.id]);

  const setProfileStore = (
    updater: ProfileStore | null | ((current: ProfileStore) => ProfileStore | null)
  ) => {
    if (!user) return;

    setStore((current) => {
      const resolved = current ?? loadProfileStore(user) ?? getDefaultProfileStore(user);
      const next = typeof updater === "function" ? updater(resolved) : updater;
      saveProfileStore(user, next);
      return next;
    });
  };

  return [store, setProfileStore] as const;
}
