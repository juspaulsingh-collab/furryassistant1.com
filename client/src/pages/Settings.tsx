import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  analyticsEnabled,
  getConsentChoice,
  setConsent,
} from "@/lib/analytics";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { ArrowLeft, Moon, Bell, Shield, HelpCircle, Trash2, Loader2 } from "lucide-react";
import { useLocation } from "wouter";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

export default function Settings() {
  const [, navigate] = useLocation();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [analyticsConsent, setAnalyticsConsent] = useState<boolean>(
    () => getConsentChoice() === "granted",
  );

  useEffect(() => {
    setAnalyticsConsent(getConsentChoice() === "granted");
  }, []);

  const handleAnalyticsToggle = (granted: boolean) => {
    setAnalyticsConsent(granted);
    setConsent(granted);
    toast({
      title: granted
        ? "Analytics enabled"
        : "Analytics disabled",
      description: granted
        ? "Thanks for helping us improve the app."
        : "We won't load analytics or advertising cookies.",
    });
  };

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", "/api/auth/account");
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account and all data have been permanently deleted.",
      });
      // Redirect to home/login page
      window.location.href = "/";
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDeleteAccount = () => {
    setDeleteDialogOpen(false);
    deleteAccountMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/more")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Settings</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Moon className="w-4 h-4" />
              Appearance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="dark-mode" className="flex-1">
                <span className="font-medium">Dark Mode</span>
                <p className="text-sm text-muted-foreground">Use dark theme for the app</p>
              </Label>
              <Switch
                id="dark-mode"
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                data-testid="switch-dark-mode"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="medication-reminders" className="flex-1">
                <span className="font-medium">Medication Reminders</span>
                <p className="text-sm text-muted-foreground">Get notified about pet medications</p>
              </Label>
              <Switch
                id="medication-reminders"
                defaultChecked={true}
                data-testid="switch-medication-reminders"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="activity-reminders" className="flex-1">
                <span className="font-medium">Activity Reminders</span>
                <p className="text-sm text-muted-foreground">Daily reminders for pet activities</p>
              </Label>
              <Switch
                id="activity-reminders"
                defaultChecked={true}
                data-testid="switch-activity-reminders"
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="vet-reminders" className="flex-1">
                <span className="font-medium">Vet Appointment Reminders</span>
                <p className="text-sm text-muted-foreground">Reminders for upcoming vet visits</p>
              </Label>
              <Switch
                id="vet-reminders"
                defaultChecked={true}
                data-testid="switch-vet-reminders"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Privacy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="share-location" className="flex-1">
                <span className="font-medium">Share Location</span>
                <p className="text-sm text-muted-foreground">Allow GPS tracking for activities</p>
              </Label>
              <Switch
                id="share-location"
                defaultChecked={true}
                data-testid="switch-share-location"
              />
            </div>
            {analyticsEnabled && (
              <div className="flex items-center justify-between gap-4">
                <Label htmlFor="analytics" className="flex-1">
                  <span className="font-medium">Usage Analytics &amp; Advertising</span>
                  <p className="text-sm text-muted-foreground">
                    Help improve the app and let us measure ad campaigns. No personal
                    data is sold.
                  </p>
                </Label>
                <Switch
                  id="analytics"
                  checked={analyticsConsent}
                  onCheckedChange={handleAnalyticsToggle}
                  data-testid="switch-analytics"
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <HelpCircle className="w-4 h-4" />
              About
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p><span className="font-medium text-foreground">Furry Assistant 1</span></p>
            <p>Version 1.0.0</p>
            <p>Your complete pet care companion</p>
          </CardContent>
        </Card>

        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <Trash2 className="w-4 h-4" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="destructive" 
                  className="w-full"
                  disabled={deleteAccountMutation.isPending}
                  data-testid="button-delete-account"
                >
                  {deleteAccountMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Account
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your account
                    and remove all your data from our servers, including:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>All pet profiles and photos</li>
                      <li>Health records and medications</li>
                      <li>Activity history and goals</li>
                      <li>Nutrition and behavior logs</li>
                      <li>Expenses and reminders</li>
                    </ul>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleDeleteAccount}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    data-testid="button-confirm-delete"
                  >
                    Yes, Delete My Account
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
