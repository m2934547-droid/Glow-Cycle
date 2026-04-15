import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { data: user, isLoading } = useGetMe({ query: { queryKey: getGetMeQueryKey() } });

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
