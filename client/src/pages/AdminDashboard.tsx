import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "wouter";
import {
  Users,
  Crown,
  Activity,
  PawPrint,
  TrendingUp,
  BarChart3,
  ArrowLeft,
  CreditCard,
  UserPlus,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";

interface AdminMetrics {
  totalUsers: number;
  premiumUsers: number;
  activeUsersToday: number;
  activeUsersThisWeek: number;
  activeUsersThisMonth: number;
  newUsersThisWeek: number;
  totalPets: number;
}

interface FeatureUsage {
  featureName: string;
  totalUsage: number;
  uniqueUsers: number;
}

interface UserGrowth {
  date: string;
  count: number;
}

interface StripeRevenue {
  total_subscriptions: number;
  active_subscriptions: number;
  canceled_subscriptions: number;
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const { data: metrics, isLoading: metricsLoading } = useQuery<AdminMetrics>({
    queryKey: ["/api/admin/metrics"],
  });

  const { data: features, isLoading: featuresLoading } = useQuery<FeatureUsage[]>({
    queryKey: ["/api/admin/features"],
  });

  const { data: userGrowth, isLoading: growthLoading } = useQuery<UserGrowth[]>({
    queryKey: ["/api/admin/user-growth"],
  });

  const { data: stripeData } = useQuery<StripeRevenue>({
    queryKey: ["/api/admin/stripe/revenue"],
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

  const formatFeatureName = (name: string) => {
    return name
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const kpiCards = [
    {
      title: "Total Users",
      value: metrics?.totalUsers ?? 0,
      icon: Users,
      color: "text-blue-500",
    },
    {
      title: "Premium Users",
      value: metrics?.premiumUsers ?? 0,
      icon: Crown,
      color: "text-amber-500",
    },
    {
      title: "New This Week",
      value: metrics?.newUsersThisWeek ?? 0,
      icon: UserPlus,
      color: "text-green-500",
    },
    {
      title: "Active Today",
      value: metrics?.activeUsersToday ?? 0,
      icon: Activity,
      color: "text-purple-500",
    },
    {
      title: "Active This Month",
      value: metrics?.activeUsersThisMonth ?? 0,
      icon: TrendingUp,
      color: "text-cyan-500",
    },
    {
      title: "Total Pets",
      value: metrics?.totalPets ?? 0,
      icon: PawPrint,
      color: "text-orange-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-heading font-semibold text-lg">Admin Dashboard</h1>
          <Badge variant="secondary" className="ml-2">Admin</Badge>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        <section>
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Key Metrics
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {kpiCards.map((kpi) => (
              <Card key={kpi.title} data-testid={`card-kpi-${kpi.title.toLowerCase().replace(/\s/g, "-")}`}>
                <CardContent className="p-4">
                  {metricsLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : (
                    <>
                      <div className="flex items-center gap-2 mb-2">
                        <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
                        <span className="text-sm text-muted-foreground">{kpi.title}</span>
                      </div>
                      <p className="text-2xl font-bold">{kpi.value.toLocaleString()}</p>
                    </>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Subscription Stats
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card data-testid="card-total-subscriptions">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CreditCard className="w-5 h-5 text-blue-500" />
                  <span className="text-sm text-muted-foreground">Total Subscriptions</span>
                </div>
                <p className="text-2xl font-bold">{stripeData?.total_subscriptions ?? 0}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-active-subscriptions">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-muted-foreground">Active</span>
                </div>
                <p className="text-2xl font-bold">{stripeData?.active_subscriptions ?? 0}</p>
              </CardContent>
            </Card>
            <Card data-testid="card-canceled-subscriptions">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-5 h-5 text-red-500" />
                  <span className="text-sm text-muted-foreground">Canceled</span>
                </div>
                <p className="text-2xl font-bold">{stripeData?.canceled_subscriptions ?? 0}</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            User Growth (Last 30 Days)
          </h2>
          <Card data-testid="card-user-growth-chart">
            <CardContent className="p-4">
              {growthLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : userGrowth && userGrowth.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis 
                      dataKey="date" 
                      tickFormatter={(value) => {
                        const date = new Date(value);
                        return `${date.getMonth() + 1}/${date.getDate()}`;
                      }}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleDateString()}
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="count" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No user growth data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top Features Used
          </h2>
          <Card data-testid="card-feature-usage-chart">
            <CardContent className="p-4">
              {featuresLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : features && features.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={features} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis 
                      dataKey="featureName" 
                      type="category" 
                      width={120}
                      tickFormatter={formatFeatureName}
                      className="text-xs"
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))' 
                      }}
                      formatter={(value: number, name: string) => [
                        value.toLocaleString(),
                        name === "totalUsage" ? "Total Usage" : "Unique Users"
                      ]}
                      labelFormatter={formatFeatureName}
                    />
                    <Bar dataKey="totalUsage" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No feature usage data available yet
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button variant="outline" asChild data-testid="button-manage-users">
                <Link href="/admin/users">
                  <Users className="w-4 h-4 mr-2" />
                  Manage Users
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
