import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, Crown, Mail, User as UserIcon, 
  Edit2, Check, X, Loader2, Calendar
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { format } from "date-fns";

export default function Profile() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");

  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string }) => {
      return await apiRequest("PATCH", "/api/auth/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      setEditDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile.",
        variant: "destructive",
      });
    },
  });

  const openEditDialog = () => {
    setEditFirstName(user?.firstName || "");
    setEditLastName(user?.lastName || "");
    setEditDialogOpen(true);
  };

  const handleSaveProfile = () => {
    const trimmedFirst = editFirstName.trim();
    const trimmedLast = editLastName.trim();
    
    // Require at least a first name
    if (!trimmedFirst) {
      toast({
        title: "First name required",
        description: "Please enter your first name.",
        variant: "destructive",
      });
      return;
    }
    
    updateProfileMutation.mutate({
      firstName: trimmedFirst,
      lastName: trimmedLast,
    });
  };

  const getInitials = () => {
    if (user?.firstName) {
      return `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ""}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || "U";
  };

  const getDisplayName = () => {
    if (user?.firstName) {
      return `${user.firstName} ${user.lastName || ""}`.trim();
    }
    return user?.email?.split("@")[0] || "User";
  };

  const getMemberSince = () => {
    if (user?.createdAt) {
      return format(new Date(user.createdAt), "MMMM yyyy");
    }
    return "Recently joined";
  };

  const getSubscriptionStatus = () => {
    if (user?.isAdmin) return { label: "Admin", variant: "admin" as const };
    return { label: "Free Forever", variant: "free" as const };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const subscription = getSubscriptionStatus();

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/more")} 
            data-testid="button-back"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Profile</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card data-testid="profile-card">
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-24 h-24 mb-4">
                <AvatarImage 
                  src={user?.profileImageUrl || undefined} 
                  alt={getDisplayName()}
                />
                <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                  {getInitials()}
                </AvatarFallback>
              </Avatar>
              
              <div className="space-y-2">
                <h2 className="text-xl font-semibold" data-testid="text-display-name">
                  {getDisplayName()}
                </h2>
                
                <div className="flex items-center justify-center gap-2">
                  <Badge 
                    className={
                      subscription.variant === "admin" 
                        ? "bg-primary/20 text-primary" 
                        : "bg-green-500/20 text-green-700 dark:text-green-400"
                    }
                  >
                    {subscription.variant === "admin" && <Crown className="w-3 h-3 mr-1" />}
                    {subscription.label}
                  </Badge>
                </div>
              </div>

              <Button 
                variant="outline" 
                size="sm" 
                className="mt-4"
                onClick={openEditDialog}
                data-testid="button-edit-profile"
                aria-label="Edit profile"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <UserIcon className="w-4 h-4" />
              Account Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium" data-testid="text-email">{user?.email || "Not set"}</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <UserIcon className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Full Name</p>
                <p className="font-medium" data-testid="text-full-name">
                  {user?.firstName 
                    ? `${user.firstName} ${user.lastName || ""}`.trim() 
                    : "Not set"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Member Since</p>
                <p className="font-medium" data-testid="text-member-since">{getMemberSince()}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Free Forever</p>
                <p className="text-sm text-muted-foreground">
                  All features included — no limits, no payment needed.
                </p>
              </div>
              <Badge className="bg-green-500/20 text-green-700 dark:text-green-400">
                Free
              </Badge>
            </div>
          </CardContent>
        </Card>

        <div className="pt-2">
          <Link href="/settings">
            <Button variant="outline" className="w-full" data-testid="button-go-settings">
              Go to Settings
            </Button>
          </Link>
        </div>
      </main>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={editFirstName}
                onChange={(e) => setEditFirstName(e.target.value)}
                placeholder="Enter your first name"
                data-testid="input-first-name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={editLastName}
                onChange={(e) => setEditLastName(e.target.value)}
                placeholder="Enter your last name"
                data-testid="input-last-name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button 
              onClick={handleSaveProfile}
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Check className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
}
