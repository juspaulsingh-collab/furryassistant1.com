import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  User, Utensils, Brain, BookOpen, DollarSign, 
  Phone, MapPin, Share2, Shield, ChevronRight,
  LogOut, Settings, Crown, Bell, FileText, HelpCircle, Loader2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

const menuSections = [
  {
    title: "Features",
    items: [
      { icon: Bell, label: "Reminders", description: "Set medication & care reminders", href: "/reminders" },
      { icon: Utensils, label: "Nutrition", description: "AI meal plans & food tracking", href: "/nutrition" },
      { icon: Brain, label: "Behavior", description: "Track and understand behavior", href: "/behavior" },
      { icon: BookOpen, label: "Training", description: "Training resources & tips", href: "/training" },
      { icon: DollarSign, label: "Expenses", description: "Track pet-related costs", href: "/expenses" },
    ]
  },
  {
    title: "Emergency",
    items: [
      { icon: Phone, label: "Emergency Contacts", description: "Vets & emergency numbers", href: "/emergency" },
      { icon: MapPin, label: "Local Services", description: "Find vets, groomers, stores", href: "/services" },
    ]
  },
  {
    title: "Account",
    items: [
      { icon: Settings, label: "Settings", description: "App preferences", href: "/settings" },
      { icon: Share2, label: "Share App", description: "Invite friends & family", href: "/share" },
      { icon: HelpCircle, label: "Support", description: "Get help & contact us", href: "/support" },
    ]
  },
  {
    title: "Legal",
    items: [
      { icon: Shield, label: "Privacy Policy", description: "How we handle your data", href: "/privacy" },
      { icon: FileText, label: "Terms of Service", description: "App usage terms", href: "/terms" },
    ]
  }
];

function MenuItem({ 
  icon: Icon, 
  label, 
  description, 
  href,
  badge
}: { 
  icon: typeof User; 
  label: string; 
  description: string; 
  href: string;
  badge?: string;
}) {
  return (
    <Link href={href}>
      <button 
        className="w-full flex items-center gap-3 p-3 rounded-lg hover-elevate text-left"
        data-testid={`menu-${label.toLowerCase().replace(/\s/g, '-')}`}
      >
        <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-medium">{label}</span>
            {badge && <Badge variant="secondary" className="text-xs">{badge}</Badge>}
          </div>
          <p className="text-sm text-muted-foreground truncate">{description}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
      </button>
    </Link>
  );
}

export default function More() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/auth/user"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      toast({
        title: "Signed Out",
        description: "You have been successfully signed out.",
      });
      window.location.href = "/";
    },
    onError: () => {
      // Fallback to GET logout if POST fails
      window.location.href = "/api/logout";
    },
  });

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    logoutMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <h1 className="font-heading font-semibold text-lg">More</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card data-testid="user-profile-card" className="hover-elevate cursor-pointer" onClick={() => navigate("/profile")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14">
                <AvatarImage src={user?.profileImageUrl || undefined} alt={user?.firstName || "User"} />
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {user?.firstName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="font-semibold truncate">
                    {user?.firstName ? `${user.firstName} ${user.lastName || ""}`.trim() : user?.email || "User"}
                  </h2>
                  {user?.isAdmin && (
                    <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400">
                      <Crown className="w-3 h-3 mr-1" />
                      Admin
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">{user?.email}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
            </div>
          </CardContent>
        </Card>

        {user?.isAdmin && (
          <Card className="border-primary/20 bg-primary/5" data-testid="admin-card">
            <CardContent className="p-4">
              <Link href="/admin">
                <button className="w-full flex items-center gap-3 text-left">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <span className="font-medium">Admin Portal</span>
                    <p className="text-sm text-muted-foreground">Manage users & analytics</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-primary" />
                </button>
              </Link>
            </CardContent>
          </Card>
        )}

        {menuSections.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              {section.title}
            </h2>
            <Card>
              <CardContent className="p-2">
                {section.items.map((item, index) => (
                  <MenuItem key={item.label} {...item} />
                ))}
              </CardContent>
            </Card>
          </section>
        ))}

        <Card>
          <CardContent className="p-2">
            <button 
              className="w-full flex items-center gap-3 p-3 rounded-lg hover-elevate text-left"
              onClick={() => setLogoutDialogOpen(true)}
              disabled={logoutMutation.isPending}
              data-testid="button-logout"
              aria-label="Sign out of your account"
            >
              <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                {logoutMutation.isPending ? (
                  <Loader2 className="w-5 h-5 text-destructive animate-spin" />
                ) : (
                  <LogOut className="w-5 h-5 text-destructive" />
                )}
              </div>
              <span className="font-medium text-destructive">
                {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
              </span>
            </button>
          </CardContent>
        </Card>
      </main>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account? You'll need to sign in again to access your pet data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-logout">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleLogout}
              data-testid="button-confirm-logout"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
}
