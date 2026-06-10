import { useGetMe, getGetMeQueryKey, type User } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Redirect } from "wouter";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode, requireAdmin?: boolean }) {
  const queryClient = useQueryClient();
  const cachedUser = queryClient.getQueryData<User>(getGetMeQueryKey());
  const { data: user, isLoading, isFetching, error } = useGetMe({
    query: {
      queryKey: getGetMeQueryKey(),
      initialData: cachedUser,
      refetchOnMount: "always",
      staleTime: 0,
    },
  });
  const resolvedUser = user ?? cachedUser;

  const isUnauthorized =
    !!error &&
    typeof error === "object" &&
    "status" in error &&
    (error as { status?: unknown }).status === 401;

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isUnauthorized || !resolvedUser) {
    return <Redirect to="/login" />;
  }

  if (requireAdmin && !resolvedUser.isAdmin) {
    return <Redirect to="/dashboard" />;
  }

  return <>{children}</>;
}
