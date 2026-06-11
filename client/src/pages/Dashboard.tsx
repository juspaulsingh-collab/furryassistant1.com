import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { OnboardingWizard, hasCompletedOnboarding } from "@/components/OnboardingWizard";
import { useEffect } from "react";
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
import { 
  PawPrint, Heart, Activity, Pill, DollarSign, 
  Plus, Bell, ChevronRight, Calendar, Sparkles, LogOut, Loader2
} from "lucide-react";
import { Link } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import type { Pet, User, Reminder } from "@shared/schema";
import { format, isToday, isTomorrow, parseISO } from "date-fns";

function StatCard({ 
  icon: Icon, 
  label, 
  value, 
  trend,
  color = "primary"
}: { 
  icon: typeof PawPrint; 
  label: string; 
  value: string | number; 
  trend?: string;
  color?: "primary" | "chart-2" | "chart-3" | "chart-4" | "chart-5";
}) {
  return (
    <Card 
      data-testid={`stat-card-${label.toLowerCase().replace(/\s/g, '-')}`}
      role="article"
      aria-label={`${label}: ${value}${trend ? `, ${trend}` : ''}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-${color}/10 flex items-center justify-center`} aria-hidden="true">
            <Icon className={`w-5 h-5 text-${color}`} aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-muted-foreground truncate">{label}</p>
            <p className="text-xl font-semibold" aria-live="polite">{value}</p>
          </div>
        </div>
        {trend && (
          <p className="text-xs text-muted-foreground mt-2">{trend}</p>
        )}
      </CardContent>
    </Card>
  );
}

function PetQuickCard({ pet }: { pet: Pet }) {
  return (
    <Link href={`/pets/${pet.id}`}>
      <Card className="hover-elevate cursor-pointer" data-testid={`pet-card-${pet.id}`}>
        <CardContent className="p-4 flex items-center gap-4">
          <Avatar className="w-14 h-14">
            <AvatarImage src={pet.photoUrl || undefined} alt={pet.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
              {pet.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold truncate">{pet.name}</h3>
            <p className="text-sm text-muted-foreground truncate">
              {pet.breed || pet.species}
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </CardContent>
      </Card>
    </Link>
  );
}

function formatReminderDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d");
}

function ReminderItem({ 
  reminder,
  petName
}: { 
  reminder: Reminder;
  petName?: string;
}) {
  const typeIcons: Record<string, typeof Pill> = {
    medication: Pill,
    vaccination: Heart,
    vet_visit: Calendar,
    grooming: Activity,
    feeding: Activity,
    exercise: Activity,
    other: Bell,
  };
  const Icon = typeIcons[reminder.reminderType] || Bell;
  const dateText = formatReminderDate(reminder.reminderDate);
  const timeText = reminder.reminderTime ? ` at ${reminder.reminderTime}` : '';
  
  return (
    <div 
      className="flex items-center gap-3 p-3 rounded-lg bg-muted/50" 
      data-testid={`reminder-${reminder.id}`}
      role="listitem"
      aria-label={`${reminder.title}${petName ? ` for ${petName}` : ''}, ${dateText}${timeText}`}
    >
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center" aria-hidden="true">
        <Icon className="w-4 h-4 text-primary" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{reminder.title}</p>
        <p className="text-xs text-muted-foreground">
          {petName ? `${petName} - ` : ""}{formatReminderDate(reminder.reminderDate)}
          {reminder.reminderTime && ` at ${reminder.reminderTime}`}
        </p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: pets, isLoading: petsLoading } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  // Only auto-open onboarding once per mount, when truly a brand new user.
  // Avoids re-triggering after the user deletes their last pet.
  const [autoOpenChecked, setAutoOpenChecked] = useState(false);
  useEffect(() => {
    if (autoOpenChecked || petsLoading || !pets) return;
    if (pets.length === 0 && !hasCompletedOnboarding()) {
      setOnboardingOpen(true);
    }
    setAutoOpenChecked(true);
  }, [pets, petsLoading, autoOpenChecked]);

  const { data: upcomingReminders, isLoading: remindersLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders/upcoming"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      window.location.href = "/";
    },
    onError: () => {
      window.location.href = "/api/logout";
    },
  });

  const handleLogout = () => {
    setLogoutDialogOpen(false);
    logoutMutation.mutate();
  };

  const petMap = new Map(pets?.map(p => [p.id, p.name]) || []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header 
        className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border"
        role="banner"
      >
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PawPrint className="w-6 h-6 text-primary" aria-hidden="true" />
            <span className="font-heading font-semibold">Furry Assistant 1</span>
          </div>
          <div className="flex items-center gap-2">
            <Button size="icon" variant="ghost" data-testid="button-notifications" aria-label="View notifications">
              <Bell className="w-5 h-5" aria-hidden="true" />
            </Button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-lg mx-auto px-4 py-6 space-y-6" role="main" aria-label="Dashboard content">
        <section>
          <h1 className="font-heading font-bold text-2xl mb-1" data-testid="text-greeting">
            Welcome back{user?.firstName ? `, ${user.firstName}` : ""}!
          </h1>
          <p className="text-muted-foreground">Here's how your pets are doing today</p>
        </section>

        <Link href="/ai-chat" aria-label="Open AI Pet Assistant chat">
          <Card className="hover-elevate cursor-pointer bg-gradient-to-r from-primary/10 via-chart-3/10 to-chart-4/10" data-testid="card-ai-assistant" role="link">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center" aria-hidden="true">
                <Sparkles className="w-6 h-6 text-primary" aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold">AI Pet Assistant</h3>
                <p className="text-sm text-muted-foreground">Ask anything about pet care</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
            </CardContent>
          </Card>
        </Link>

        <section className="grid grid-cols-2 gap-3">
          <StatCard icon={PawPrint} label="Total Pets" value={pets?.length || 0} />
          <StatCard icon={Activity} label="Activities Today" value={0} color="chart-3" />
          <StatCard icon={Pill} label="Active Meds" value={0} color="chart-2" />
          <StatCard icon={DollarSign} label="This Month" value="$0" color="chart-5" />
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-heading font-semibold text-lg">Your Pets</h2>
            <Button variant="ghost" size="sm" asChild data-testid="button-add-pet">
              <Link href="/pets/new">
                <Plus className="w-4 h-4 mr-1" />
                Add Pet
              </Link>
            </Button>
          </div>
          
          {petsLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : pets && pets.length > 0 ? (
            <div className="space-y-3">
              {pets.slice(0, 3).map((pet) => (
                <PetQuickCard key={pet.id} pet={pet} />
              ))}
              {pets.length > 3 && (
                <Button variant="ghost" className="w-full" asChild>
                  <Link href="/pets">View all {pets.length} pets</Link>
                </Button>
              )}
            </div>
          ) : (
            <Card className="border-dashed" data-testid="empty-pets">
              <CardContent className="p-6 text-center">
                <PawPrint className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No pets yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first furry friend to get started
                </p>
                <Button asChild data-testid="button-add-first-pet">
                  <Link href="/pets/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Pet
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-heading font-semibold text-lg">Upcoming Reminders</h2>
            <Button variant="ghost" size="sm" asChild data-testid="button-view-all-reminders">
              <Link href="/reminders">View All</Link>
            </Button>
          </div>
          
          <Card>
            <CardContent className="p-4 space-y-3">
              {remindersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-14 w-full" />
                  <Skeleton className="h-14 w-full" />
                </div>
              ) : upcomingReminders && upcomingReminders.length > 0 ? (
                <>
                  {upcomingReminders.slice(0, 3).map((reminder) => (
                    <ReminderItem 
                      key={reminder.id} 
                      reminder={reminder}
                      petName={reminder.petId ? petMap.get(reminder.petId) : undefined}
                    />
                  ))}
                  {upcomingReminders.length > 3 && (
                    <Button variant="ghost" className="w-full" size="sm" asChild>
                      <Link href="/reminders">View all {upcomingReminders.length} reminders</Link>
                    </Button>
                  )}
                </>
              ) : (
                <div className="text-center py-6 text-muted-foreground" data-testid="empty-reminders">
                  <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm mb-3">No upcoming reminders</p>
                  <Button size="sm" asChild>
                    <Link href="/reminders/new">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Reminder
                    </Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild data-testid="button-log-activity">
              <Link href="/activities/new">
                <Activity className="w-5 h-5 text-primary" />
                <span>Log Activity</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild data-testid="button-add-health-record">
              <Link href="/health/records/new">
                <Heart className="w-5 h-5 text-primary" />
                <span>Health Record</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild data-testid="button-add-medication">
              <Link href="/health/medications/new">
                <Pill className="w-5 h-5 text-primary" />
                <span>Add Medication</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild data-testid="button-log-expense">
              <Link href="/expenses/new">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>Log Expense</span>
              </Link>
            </Button>
          </div>
        </section>

        <section className="pt-4">
          <Button
            variant="outline"
            className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
            onClick={() => setLogoutDialogOpen(true)}
            disabled={logoutMutation.isPending}
            data-testid="button-logout"
            aria-label="Sign out of your account"
          >
            {logoutMutation.isPending ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <LogOut className="w-5 h-5 mr-2" aria-hidden="true" />
            )}
            {logoutMutation.isPending ? "Signing Out..." : "Sign Out"}
          </Button>
        </section>
      </main>

      <AlertDialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Sign Out</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to sign out of your account?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-logout">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleLogout}
              data-testid="button-confirm-logout"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Sign Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <OnboardingWizard open={onboardingOpen} onClose={() => setOnboardingOpen(false)} />

      <BottomNavigation />
    </div>
  );
}
