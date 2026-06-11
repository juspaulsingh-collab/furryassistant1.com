import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import {
  ArrowLeft,
  Crown,
  Shield,
  ShieldOff,
  User,
  Mail,
  Calendar,
} from "lucide-react";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  isPremium: boolean | null;
  isAdmin: boolean | null;
  createdAt: string | null;
}

export default function AdminUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: users, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["/api/admin/users"],
  });

  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: string; isAdmin: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/admin`, { isAdmin });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Admin status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update admin status", variant: "destructive" });
    },
  });

  const togglePremiumMutation = useMutation({
    mutationFn: async ({ userId, isPremium }: { userId: string; isPremium: boolean }) => {
      return apiRequest("PATCH", `/api/admin/users/${userId}/premium`, { isPremium });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/users"] });
      toast({ title: "Premium status updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update premium status", variant: "destructive" });
    },
  });

  if (!user?.isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              You need admin privileges to access this page.
            </p>
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const filteredUsers = users?.filter((u) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      u.email?.toLowerCase().includes(searchLower) ||
      u.firstName?.toLowerCase().includes(searchLower) ||
      u.lastName?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/admin">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-heading font-semibold text-lg">Manage Users</h1>
          <Badge variant="secondary" className="ml-2">Admin</Badge>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border border-border rounded-md bg-background text-foreground"
            data-testid="input-search-users"
          />
        </div>

        <div className="text-sm text-muted-foreground">
          {filteredUsers?.length ?? 0} users found
        </div>

        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))
          ) : filteredUsers && filteredUsers.length > 0 ? (
            filteredUsers.map((u) => (
              <Card key={u.id} data-testid={`card-user-${u.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium truncate">
                          {u.firstName || u.lastName
                            ? `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim()
                            : "No name"}
                        </span>
                        {u.isPremium && (
                          <Badge variant="secondary" className="gap-1">
                            <Crown className="w-3 h-3" />
                            Premium
                          </Badge>
                        )}
                        {u.isAdmin && (
                          <Badge className="gap-1">
                            <Shield className="w-3 h-3" />
                            Admin
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{u.email ?? "No email"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>
                          Joined {u.createdAt ? format(new Date(u.createdAt), "MMM d, yyyy") : "Unknown"}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {u.id !== user.id && (
                        <Button
                          variant={u.isPremium ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => togglePremiumMutation.mutate({ userId: u.id, isPremium: !u.isPremium })}
                          disabled={togglePremiumMutation.isPending}
                          data-testid={`button-toggle-premium-${u.id}`}
                        >
                          {u.isPremium ? (
                            <>
                              <Crown className="w-4 h-4 mr-1" />
                              Revoke Premium
                            </>
                          ) : (
                            <>
                              <Crown className="w-4 h-4 mr-1" />
                              Grant Premium
                            </>
                          )}
                        </Button>
                      )}
                      {u.id !== user.id && (
                        <Button
                          variant={u.isAdmin ? "destructive" : "outline"}
                          size="sm"
                          onClick={() => toggleAdminMutation.mutate({ userId: u.id, isAdmin: !u.isAdmin })}
                          disabled={toggleAdminMutation.isPending}
                          data-testid={`button-toggle-admin-${u.id}`}
                        >
                          {u.isAdmin ? (
                            <>
                              <ShieldOff className="w-4 h-4 mr-1" />
                              Remove Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-4 h-4 mr-1" />
                              Make Admin
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">
                No users found
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <BottomNavigation />
    </div>
  );
}
