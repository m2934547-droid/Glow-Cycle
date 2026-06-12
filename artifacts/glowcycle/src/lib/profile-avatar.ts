import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export const PROFILE_IMAGE_QUERY_KEY = ["profile-image"] as const;
export const PROFILE_IMAGE_UPLOAD_URL = "/api/users/profile/avatar";

export type ProfileImageRecord = {
  profileImageUrl: string | null;
  updatedAt?: string | null;
};

type UploadProfileImageBody = {
  imageDataUrl: string;
  fileName?: string;
};

const ALLOWED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
export const MAX_PROFILE_IMAGE_BYTES = 5 * 1024 * 1024;

function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

async function fetchProfileImage(): Promise<ProfileImageRecord> {
  const response = await fetch(PROFILE_IMAGE_UPLOAD_URL, {
    method: "GET",
    credentials: "include",
    headers: {
      accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to load profile image (${response.status})`);
  }

  return parseJson<ProfileImageRecord>(response);
}

async function uploadProfileImage(body: UploadProfileImageBody): Promise<ProfileImageRecord> {
  const response = await fetch(PROFILE_IMAGE_UPLOAD_URL, {
    method: "POST",
    credentials: "include",
    headers: {
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Failed to upload profile image (${response.status})`);
  }

  return parseJson<ProfileImageRecord>(response);
}

export function getProfileInitials(name: string | null | undefined) {
  const cleanedName = name?.trim() ?? "";
  if (!cleanedName) return "U";

  const initials = cleanedName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials || "U";
}

export function validateProfileImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return "Please choose a JPG, PNG, WEBP, or GIF image.";
  }

  if (file.size > MAX_PROFILE_IMAGE_BYTES) {
    return "Profile pictures must be 5 MB or smaller.";
  }

  return null;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== "string") {
        reject(new Error("Could not read the selected image."));
        return;
      }

      resolve(result);
    };

    reader.onerror = () => {
      reject(new Error("Could not read the selected image."));
    };

    reader.readAsDataURL(file);
  });
}

export function useProfileImage(enabled = true) {
  return useQuery({
    queryKey: PROFILE_IMAGE_QUERY_KEY,
    queryFn: fetchProfileImage,
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });
}

export function useUploadProfileImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: uploadProfileImage,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: PROFILE_IMAGE_QUERY_KEY });
    },
  });
}
