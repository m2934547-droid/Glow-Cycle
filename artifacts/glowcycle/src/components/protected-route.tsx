import { useGetMe, getGetMeQueryKey } from "@workspace/api-client-react";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const { data: user, isLoading, isFetching, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      refetchOnMount: "always",
      staleTime: 0,
    },
  });

  const isUnauthorized =
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: unknown }).status === 401;

  if (isLoading || isFetching) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isUnauthorized || !user) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && !user.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
