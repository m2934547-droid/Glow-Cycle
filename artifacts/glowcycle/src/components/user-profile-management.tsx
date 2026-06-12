import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Camera, CheckCircle2, Clock3, Mail, Save, Shield, Sparkles, Upload, User, UserCircle2, X } from "lucide-react";
import { type User as ApiUser, getGetMeQueryKey, useUpdateProfile } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PROFILE_IMAGE_QUERY_KEY,
  getProfileInitials,
  readFileAsDataUrl,
  useProfileImage,
  useUploadProfileImage,
  validateProfileImageFile,
} from "@/lib/profile-avatar";

type ProfileUser = ApiUser & { profileImageUrl?: string | null };

type ProfileFieldKey = "name" | "age" | "heightCm" | "weightKg" | "phoneNumber";

const FORM_FIELDS: Array<{
  key: ProfileFieldKey;
  label: string;
  type: "text" | "number" | "tel";
  placeholder: string;
}> = [
  { key: "name", label: "Full name", type: "text", placeholder: "Your name" },
  { key: "age", label: "Age", type: "number", placeholder: "Age" },
  { key: "heightCm", label: "Height (cm)", type: "number", placeholder: "Height in cm" },
  { key: "weightKg", label: "Weight (kg)", type: "number", placeholder: "Weight in kg" },
  { key: "phoneNumber", label: "Phone number", type: "tel", placeholder: "Phone number" },
];

function ProfileAvatar({
  name,
  avatarUrl,
  previewUrl,
}: {
  name: string;
  avatarUrl?: string | null;
  previewUrl?: string | null;
}) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [avatarUrl, previewUrl]);

  const source = previewUrl ?? avatarUrl ?? null;
  const initials = getProfileInitials(name);

  return (
    <div className="relative h-24 w-24 overflow-hidden rounded-full border border-[#FFD6E6] bg-gradient-to-br from-[#FF5CA8] via-[#FFEAF3] to-white p-[3px] shadow-[0_18px_40px_rgba(255,92,168,0.18)]">
      <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-full bg-white text-[#FF5CA8]">
        {source && !imageFailed ? (
          <img
            src={source}
            alt=""
            className="h-full w-full rounded-full object-cover"
            onError={() => setImageFailed(true)}
          />
        ) : initials.length > 0 ? (
          <span className="font-serif text-2xl font-semibold text-[#8B6F7D]">{initials}</span>
        ) : (
          <UserCircle2 className="h-10 w-10" />
        )}
      </div>
    </div>
  );
}

export function UserProfileManagement({ user }: { user: ProfileUser }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [name, setName] = useState(user.name);
  const [age, setAge] = useState(String(user.age));
  const [heightCm, setHeightCm] = useState(String(user.heightCm));
  const [weightKg, setWeightKg] = useState(String(user.weightKg));
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber ?? "");
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const { data: profileImage } = useProfileImage(!!user);
  const uploadProfileImageMutation = useUploadProfileImage();
  const updateProfileMutation = useUpdateProfile();

  const currentAvatarUrl = profileImage?.profileImageUrl ?? user.profileImageUrl ?? null;

  useEffect(() => {
    setName(user.name);
    setAge(String(user.age));
    setHeightCm(String(user.heightCm));
    setWeightKg(String(user.weightKg));
    setPhoneNumber(user.phoneNumber ?? "");
    setFormMessage(null);
    setFormError(null);
  }, [user]);

  const selectedFileLabel = useMemo(() => {
    if (!selectedFile) return null;
    const sizeInMb = (selectedFile.size / (1024 * 1024)).toFixed(1);
    return `${selectedFile.name} • ${sizeInMb} MB`;
  }, [selectedFile]);

  const clearSelectedImage = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setImageError(null);
    setUploadError(null);
    setUploadMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;

    setUploadError(null);
    setUploadMessage(null);
    setImageError(null);

    if (!file) {
      clearSelectedImage();
      return;
    }

    const validationError = validateProfileImageFile(file);
    if (validationError) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageError(validationError);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);

    try {
      const dataUrl = await readFileAsDataUrl(file);
      setPreviewUrl(dataUrl);
    } catch (error) {
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageError(error instanceof Error ? error.message : "Could not preview the selected image.");
      event.target.value = "";
    }
  };

  const handleProfileSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    setFormMessage(null);

    const parsedAge = Number(age);
    const parsedHeight = Number(heightCm);
    const parsedWeight = Number(weightKg);

    if (!name.trim()) {
      setFormError("Please enter your name.");
      return;
    }

    if (!Number.isFinite(parsedAge) || parsedAge <= 0) {
      setFormError("Please enter a valid age.");
      return;
    }

    if (!Number.isFinite(parsedHeight) || parsedHeight <= 0) {
      setFormError("Please enter a valid height.");
      return;
    }

    if (!Number.isFinite(parsedWeight) || parsedWeight <= 0) {
      setFormError("Please enter a valid weight.");
      return;
    }

    updateProfileMutation.mutate(
      {
        data: {
          name: name.trim(),
          age: parsedAge,
          heightCm: parsedHeight,
          weightKg: parsedWeight,
          phoneNumber: phoneNumber.trim() || undefined,
        },
      },
      {
        onSuccess: async () => {
          setFormMessage("Profile details updated.");
          await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        },
        onError: (error) => {
          setFormError(error instanceof Error ? error.message : "Could not update your profile.");
        },
      }
    );
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile || !previewUrl) {
      setUploadError("Choose an image first.");
      return;
    }

    setUploadError(null);
    setUploadMessage(null);

    try {
      const imageDataUrl = await readFileAsDataUrl(selectedFile);
      const result = await uploadProfileImageMutation.mutateAsync({
        imageDataUrl,
        fileName: selectedFile.name,
      });

      setUploadMessage("Profile picture updated everywhere.");
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageError(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }

      await queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      if (result.profileImageUrl) {
        await queryClient.invalidateQueries({ queryKey: PROFILE_IMAGE_QUERY_KEY });
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "Could not upload the selected image.");
    }
  };

  const isSavingProfile = updateProfileMutation.isPending;
  const isUploadingAvatar = uploadProfileImageMutation.isPending;
  const bmiLabel = user.bmiCategory ? user.bmiCategory.toLowerCase() : "unavailable";

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="space-y-6"
      >
        <Card className="rounded-[2rem] border-[#F6DDE8] bg-white/95 shadow-[0_24px_70px_rgba(255,92,168,0.10)]">
          <CardHeader className="border-b border-[#F6DDE8] bg-gradient-to-r from-[#FFF4F8] via-white to-[#FFF9FC]">
            <div className="flex flex-wrap items-center gap-4">
              <ProfileAvatar
                name={user.name}
                avatarUrl={currentAvatarUrl}
                previewUrl={previewUrl}
              />

              <div className="min-w-0 flex-1">
                <CardTitle className="font-serif text-3xl text-[#3D2A34]">My Profile</CardTitle>
                <CardDescription className="mt-1 text-[#8B6F7D]">
                  Update your details, keep your avatar in sync, and stay signed in across devices.
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 p-6">
            <div className="grid gap-4 rounded-[1.5rem] border border-[#F6DDE8] bg-[#FFF9FC] p-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B6F7D]">Email</p>
                <p className="mt-2 flex items-center gap-2 font-medium text-[#3D2A34]">
                  <Mail className="h-4 w-4 text-[#FF5CA8]" />
                  <span className="truncate">{user.email}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B6F7D]">BMI</p>
                <p className="mt-2 flex items-center gap-2 font-medium text-[#3D2A34]">
                  <Sparkles className="h-4 w-4 text-[#FF5CA8]" />
                  <span className="capitalize">{bmiLabel}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B6F7D]">Member since</p>
                <p className="mt-2 flex items-center gap-2 font-medium text-[#3D2A34]">
                  <Clock3 className="h-4 w-4 text-[#FF5CA8]" />
                  <span>{new Date(user.createdAt).toLocaleDateString()}</span>
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8B6F7D]">Account</p>
                <p className="mt-2 flex items-center gap-2 font-medium text-[#3D2A34]">
                  <Shield className="h-4 w-4 text-[#FF5CA8]" />
                  <span>{user.isAdmin ? "Admin" : "Member"}</span>
                </p>
              </div>
            </div>

            <form className="space-y-4" onSubmit={handleProfileSave}>
              <div className="grid gap-4 sm:grid-cols-2">
                {FORM_FIELDS.map((field) => (
                  <label key={field.key} className={cn("block space-y-2", field.key === "phoneNumber" && "sm:col-span-2")}>
                    <span className="text-sm font-medium text-[#4A2C3A]">{field.label}</span>
                    <input
                      type={field.type}
                      value={String(
                        field.key === "name"
                          ? name
                          : field.key === "age"
                            ? age
                            : field.key === "heightCm"
                              ? heightCm
                              : field.key === "weightKg"
                                ? weightKg
                                : phoneNumber
                      )}
                      onChange={(event) => {
                        const value = event.target.value;
                        if (field.key === "name") setName(value);
                        if (field.key === "age") setAge(value);
                        if (field.key === "heightCm") setHeightCm(value);
                        if (field.key === "weightKg") setWeightKg(value);
                        if (field.key === "phoneNumber") setPhoneNumber(value);
                      }}
                      placeholder={field.placeholder}
                      className={cn(
                        "h-12 w-full rounded-2xl border border-[#EFC8D8] bg-white px-4 text-[#3D2A34] outline-none transition-colors placeholder:text-[#B58A9B] focus:border-[#FF5CA8] focus:ring-2 focus:ring-[#FF5CA8]/15",
                      )}
                    />
                  </label>
                ))}
              </div>

              {(formError || formMessage) && (
                <div
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm",
                    formError ? "border-rose-200 bg-rose-50 text-rose-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"
                  )}
                >
                  {formError ?? formMessage}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <Button
                  type="submit"
                  className="rounded-full bg-[#FF5CA8] px-6 text-white shadow-[0_12px_30px_rgba(255,92,168,0.20)] hover:bg-[#ff4b9e]"
                  disabled={isSavingProfile}
                >
                  <Save className="mr-2 h-4 w-4" />
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </Button>
                <p className="text-sm text-[#8B6F7D]">
                  Your profile details stay linked to your account on every device.
                </p>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="space-y-6"
      >
        <Card className="rounded-[2rem] border-[#F6DDE8] bg-white/95 shadow-[0_24px_70px_rgba(255,92,168,0.10)]">
          <CardHeader className="border-b border-[#F6DDE8] bg-gradient-to-r from-[#FFF4F8] via-white to-[#FFF9FC]">
            <CardTitle className="flex items-center gap-2 font-serif text-2xl text-[#3D2A34]">
              <Camera className="h-5 w-5 text-[#FF5CA8]" />
              Profile picture
            </CardTitle>
            <CardDescription className="text-[#8B6F7D]">
              Choose a clear image and upload it once. The saved URL will load on laptops, phones, and other browsers.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5 p-6">
            <div className="rounded-[1.5rem] border border-[#F6DDE8] bg-[#FFF9FC] p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <ProfileAvatar name={user.name} avatarUrl={currentAvatarUrl} previewUrl={previewUrl} />

                <div className="min-w-0 flex-1 space-y-2">
                  <div>
                    <p className="font-medium text-[#3D2A34]">
                      {selectedFile ? "New image ready to upload" : "Current profile image"}
                    </p>
                    <p className="text-sm text-[#8B6F7D]">
                      {selectedFileLabel ?? "PNG, JPG, WEBP, and GIF images up to 5 MB are supported."}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-[#EFC8D8] bg-white text-[#4A2C3A] hover:bg-[#FFF0F6] hover:text-[#FF5CA8]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Choose image
                    </Button>

                    <Button
                      type="button"
                      className="rounded-full bg-[#FF5CA8] px-5 text-white hover:bg-[#ff4b9e]"
                      onClick={handleAvatarUpload}
                      disabled={!selectedFile || isUploadingAvatar}
                    >
                      {isUploadingAvatar ? "Uploading..." : "Upload picture"}
                    </Button>

                    {(previewUrl || selectedFile) && (
                      <Button
                        type="button"
                        variant="ghost"
                        className="rounded-full text-[#8B6F7D] hover:bg-[#FFF0F6] hover:text-[#FF5CA8]"
                        onClick={clearSelectedImage}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {imageError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {imageError}
              </div>
            )}

            {uploadError && (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {uploadError}
              </div>
            )}

            {uploadMessage && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                <CheckCircle2 className="mr-2 inline h-4 w-4" />
                {uploadMessage}
              </div>
            )}

            <div className="rounded-[1.5rem] border border-dashed border-[#EFC8D8] bg-[#FFFDFE] p-4 text-sm text-[#8B6F7D]">
              <p className="font-medium text-[#4A2C3A]">How this works</p>
              <ul className="mt-2 space-y-2">
                <li>1. Pick a file and review the preview first.</li>
                <li>2. We validate file type and size before upload.</li>
                <li>3. The server stores the image and returns a shared URL.</li>
                <li>4. The same URL is used in the header and profile page everywhere.</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
