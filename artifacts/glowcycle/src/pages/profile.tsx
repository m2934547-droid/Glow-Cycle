import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useGetMe, getGetMeQueryKey, type GetMeQueryResult } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Heart, User } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { PartnersSection } from "@/components/partners-section";
import { UserProfileManagement } from "@/components/user-profile-management";

type ProfileView = "overview" | "my-profile" | "add-partner";

const PROFILE_VIEWS: Array<{ value: ProfileView; label: string }> = [
  { value: "overview", label: "Profile Overview" },
  { value: "my-profile", label: "My Profile" },
  { value: "add-partner", label: "Add Partner" },
];

function getProfileView(location: string): ProfileView {
  const searchFromLocation = location.includes("?") ? location.split("?")[1] ?? "" : "";
  const currentSearch =
    searchFromLocation || (typeof window !== "undefined" ? window.location.search.replace(/^\?/, "") : "");
  const view = new URLSearchParams(currentSearch).get("view");

  if (view === "my-profile" || view === "add-partner" || view === "overview") {
    return view;
  }

  const hashFromLocation = location.includes("#") ? location.split("#")[1] ?? "" : "";
  const currentHash =
    hashFromLocation || (typeof window !== "undefined" ? window.location.hash.replace(/^#/, "") : "");

  if (currentHash === "partner-information") {
    return "add-partner";
  }

  return "overview";
}

function ProfileTabs({ activeView, onChange }: { activeView: ProfileView; onChange: (view: ProfileView) => void }) {
  return (
    <div className="flex flex-wrap gap-2 rounded-[1.75rem] border border-primary/10 bg-card/70 p-2 shadow-sm backdrop-blur-xl">
      {PROFILE_VIEWS.map((view) => (
        <button
          key={view.value}
          type="button"
          onClick={() => onChange(view.value)}
          className={cn(
            "rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
            activeView === view.value
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
          )}
        >
          {view.label}
        </button>
      ))}
    </div>
  );
}

function ProfileLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-10">
      <div className="space-y-4">
        <Skeleton className="h-12 w-64 max-w-full rounded-xl" />
        <Skeleton className="h-10 w-full max-w-96 rounded-full" />
      </div>
      <Skeleton className="h-56 rounded-[2rem] sm:h-64" />
      <Skeleton className="h-[320px] rounded-[2rem] sm:h-[420px]" />
      <Skeleton className="h-72 rounded-[2rem] sm:h-80" />
    </div>
  );
}

function ProfileUnavailable() {
  return (
    <div className="mx-auto max-w-4xl">
      <Card className="rounded-[2rem] border-primary/10 bg-card/80 shadow-lg backdrop-blur-xl">
        <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-primary/10 p-4 text-primary">
            <User className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h1 className="font-serif text-2xl font-semibold text-foreground">Profile unavailable</h1>
            <p className="text-muted-foreground">We could not load your profile right now. Please try again.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Profile() {
  const [location, setLocation] = useLocation();
  const [activeView, setActiveView] = useState<ProfileView>(() => getProfileView(location));
  const [isPartnerDialogOpen, setIsPartnerDialogOpen] = useState(activeView === "add-partner");
  const queryClient = useQueryClient();
  const cachedUser = queryClient.getQueryData<GetMeQueryResult>(getGetMeQueryKey());
  const { data: user, isLoading } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      initialData: cachedUser,
      refetchOnMount: false,
      staleTime: 5 * 60 * 1000,
    },
  });
  const activeUser = user ?? cachedUser;

  useEffect(() => {
    setIsPartnerDialogOpen(activeView === "add-partner");
  }, [activeView]);

  useEffect(() => {
    const nextView = getProfileView(location);
    setActiveView((currentView) => (currentView === nextView ? currentView : nextView));
  }, [location]);

  useEffect(() => {
    const syncFromUrl = () => {
      const nextView = getProfileView(window.location.pathname + window.location.search + window.location.hash);
      setActiveView((currentView) => (currentView === nextView ? currentView : nextView));
    };

    syncFromUrl();
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener("hashchange", syncFromUrl);

    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener("hashchange", syncFromUrl);
    };
  }, []);

  if (!activeUser && isLoading) {
    return <ProfileLoading />;
  }

  if (!activeUser) {
    return <ProfileUnavailable />;
  }

  const heroTitle =
    activeView === "my-profile" ? "My Profile" : activeView === "add-partner" ? "Add Partner" : "Profile Overview";

  const heroDescription =
    activeView === "my-profile"
      ? "View and manage your personal profile details."
      : activeView === "add-partner"
        ? "Add a trusted partner from the pop-up form."
        : "Manage your profile, health data, security settings, and partner connections in one place.";

  const handlePartnerDialogChange = (open: boolean) => {
    setIsPartnerDialogOpen(open);

    if (!open && activeView === "add-partner") {
      setActiveView("overview");
      setLocation("/profile?view=overview");
    }
  };

  const handleTabChange = (view: ProfileView) => {
    setActiveView(view);
    setLocation(`/profile?view=${view}`);
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 pb-10">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col gap-4 sm:flex-row sm:items-start"
      >
        <div className="min-w-0 space-y-4">
          <div>
            <h1 className="flex items-center gap-3 text-3xl font-serif font-bold text-foreground md:text-4xl">
              <Heart className="h-8 w-8 text-primary" />
              {heroTitle}
            </h1>
            <p className="mt-2 text-lg text-muted-foreground">{heroDescription}</p>
          </div>
          <ProfileTabs activeView={activeView} onChange={handleTabChange} />
        </div>
      </motion.div>

      {(activeView === "my-profile" || activeView === "overview") && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
          <UserProfileManagement user={activeUser} />
        </motion.div>
      )}

      {activeView === "overview" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <PartnersSection variant="list" />
        </motion.div>
      )}

      <Dialog open={isPartnerDialogOpen} onOpenChange={handlePartnerDialogChange}>
        <DialogContent className="w-[calc(100vw-1rem)] max-h-[90vh] overflow-y-auto rounded-[2rem] border-primary/10 bg-background/95 p-0 shadow-2xl sm:max-w-2xl">
          <DialogHeader className="border-b border-primary/10 bg-primary/5 px-6 py-5">
            <DialogTitle className="flex items-center gap-2 font-serif text-2xl text-foreground">
              <Heart className="h-6 w-6 text-primary" />
              Add Partner
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Add a trusted partner from this dialog, then return to your profile overview.
            </DialogDescription>
          </DialogHeader>
          <div className="p-6">
            <PartnersSection
              variant="form"
              onSuccess={() => {
                setIsPartnerDialogOpen(false);
                setLocation("/profile?view=overview");
              }}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
