import { useAdminGetUsers, useAdminDeleteUser, getAdminGetUsersQueryKey, getAdminGetStatsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Trash2, Users as UsersIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

export default function AdminUsers() {
  const { data: users, isLoading } = useAdminGetUsers({ query: { queryKey: getAdminGetUsersQueryKey() } });
  const deleteUserMutation = useAdminDeleteUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleDeleteUser = (userId: number) => {
    if (confirm("Are you sure you want to delete this user?")) {
      deleteUserMutation.mutate({ userId }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getAdminGetUsersQueryKey() });
          queryClient.invalidateQueries({ queryKey: getAdminGetStatsQueryKey() });
          toast({ title: "User deleted" });
        },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-10 space-y-6">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-foreground flex items-center gap-3">
          <UsersIcon className="h-8 w-8 text-primary" />
          User Management
        </h1>
        <p className="text-muted-foreground mt-2">Review and manage every account on the platform.</p>
      </motion.div>

      <Card className="rounded-[2rem] border-primary/10 shadow-sm overflow-hidden">
        <CardHeader>
          <CardTitle className="font-serif">All Users</CardTitle>
          <CardDescription>{users?.length ?? 0} registered users</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Cycles</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users?.map(user => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{user.cycleCount}</TableCell>
                    <TableCell>
                      {user.isAdmin ? (
                        <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-bold">Admin</span>
                      ) : (
                        <span className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-medium">User</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => handleDeleteUser(user.id)}
                        disabled={user.isAdmin}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
