import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, Users, Activity, TrendingUp, Crown,
  BarChart3, Shield, Settings
} from "lucide-react";
import { useLocation } from "wouter";
import type { User, FeatureUsage } from "@shared/schema";

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend 
}: { 
  icon: typeof Users; 
  label: string; 
  value: string | number;
  trend?: string;
}) {
  return (
    <Card data-testid={`admin-stat-${label.toLowerCase().replace(/\s/g, '-')}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">{value}</p>
          </div>
        </div>
        {trend && <p className="text-xs text-muted-foreground mt-2">{trend}</p>}
      </CardContent>
    </Card>
  );
}

function UserRow({ user }: { user: User }) {
  return (
    <TableRow data-testid={`user-row-${user.id}`}>
      <TableCell>
        <div className="flex items-center gap-2">
          {user.profileImageUrl ? (
            <img 
              src={user.profileImageUrl} 
              alt="" 
              className="w-8 h-8 rounded-full"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-medium text-primary">
                {user.firstName?.charAt(0) || user.email?.charAt(0)?.toUpperCase() || "U"}
              </span>
            </div>
          )}
          <div>
            <p className="font-medium">
              {user.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : "Unknown"}
            </p>
            <p className="text-xs text-muted-foreground">{user.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-1 flex-wrap">
          {user.isPremium && (
            <Badge className="bg-amber-500/20 text-amber-600">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          )}
          {user.isAdmin && (
            <Badge className="bg-primary/20 text-primary">
              <Shield className="w-3 h-3 mr-1" />
              Admin
            </Badge>
          )}
          {!user.isPremium && !user.isAdmin && (
            <Badge variant="secondary">Free</Badge>
          )}
        </div>
      </TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
      </TableCell>
      <TableCell>
        <Button variant="ghost" size="sm" data-testid={`manage-user-${user.id}`}>
          <Settings className="w-4 h-4" />
        </Button>
      </TableCell>
    </TableRow>
  );
}

function FeatureUsageRow({ usage }: { usage: FeatureUsage }) {
  return (
    <TableRow data-testid={`feature-row-${usage.id}`}>
      <TableCell className="font-medium capitalize">
        {usage.featureName.replace(/_/g, ' ')}
      </TableCell>
      <TableCell>{usage.usageCount}</TableCell>
      <TableCell className="text-muted-foreground text-sm">
        {usage.lastUsedAt ? new Date(usage.lastUsedAt).toLocaleDateString() : "—"}
      </TableCell>
    </TableRow>
  );
}

export default function Admin() {
  const [, navigate] = useLocation();

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/admin/users"],
  });

  const { data: featureUsage, isLoading: usageLoading } = useQuery<FeatureUsage[]>({
    queryKey: ["/api/admin/feature-usage"],
  });

  const totalUsers = users?.length || 0;
  const premiumUsers = users?.filter(u => u.isPremium).length || 0;
  const adminUsers = users?.filter(u => u.isAdmin).length || 0;

  const aggregatedFeatures = featureUsage?.reduce((acc, usage) => {
    if (!acc[usage.featureName]) {
      acc[usage.featureName] = { featureName: usage.featureName, usageCount: 0 };
    }
    acc[usage.featureName].usageCount += usage.usageCount || 0;
    return acc;
  }, {} as Record<string, { featureName: string; usageCount: number }>) || {};

  const sortedFeatures = Object.values(aggregatedFeatures)
    .sort((a, b) => b.usageCount - a.usageCount);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/more")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2 flex-1">
            <Shield className="w-5 h-5 text-primary" />
            <h1 className="font-heading font-semibold text-lg">Admin Portal</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={totalUsers} />
          <StatCard icon={Crown} label="Premium Users" value={premiumUsers} />
          <StatCard icon={Shield} label="Admins" value={adminUsers} />
          <StatCard icon={Activity} label="Active Today" value={0} />
        </section>

        <Tabs defaultValue="users" className="space-y-4">
          <TabsList>
            <TabsTrigger value="users" data-testid="tab-users">
              <Users className="w-4 h-4 mr-1" />
              Users
            </TabsTrigger>
            <TabsTrigger value="features" data-testid="tab-features">
              <BarChart3 className="w-4 h-4 mr-1" />
              Feature Usage
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {usersLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : users && users.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Joined</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {users.map((user) => (
                          <UserRow key={user.id} user={user} />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">No users found</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Feature Usage Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {usageLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : sortedFeatures.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Feature</TableHead>
                          <TableHead>Total Uses</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedFeatures.map((feature) => (
                          <TableRow key={feature.featureName}>
                            <TableCell className="font-medium capitalize">
                              {feature.featureName.replace(/_/g, ' ')}
                            </TableCell>
                            <TableCell>{feature.usageCount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No feature usage data yet
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
