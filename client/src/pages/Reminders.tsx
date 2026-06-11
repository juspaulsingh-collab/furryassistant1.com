import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Bell, Plus, Calendar, ArrowLeft, Clock, Check, Trash2,
  Stethoscope, Pill, Scissors, Utensils, Dumbbell, PawPrint
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Reminder, Pet } from "@shared/schema";
import { format, isToday, isTomorrow, isPast, parseISO } from "date-fns";

const typeIcons: Record<string, typeof Bell> = {
  medication: Pill,
  vaccination: Stethoscope,
  grooming: Scissors,
  feeding: Utensils,
  exercise: Dumbbell,
  vet_visit: Stethoscope,
  other: Bell,
};

const typeColors: Record<string, string> = {
  medication: "bg-chart-2/10 text-chart-2",
  vaccination: "bg-chart-1/10 text-chart-1",
  grooming: "bg-chart-4/10 text-chart-4",
  feeding: "bg-chart-5/10 text-chart-5",
  exercise: "bg-chart-3/10 text-chart-3",
  vet_visit: "bg-primary/10 text-primary",
  other: "bg-muted text-muted-foreground",
};

function formatReminderDate(dateStr: string): string {
  const date = parseISO(dateStr);
  if (isToday(date)) return "Today";
  if (isTomorrow(date)) return "Tomorrow";
  return format(date, "MMM d, yyyy");
}

function ReminderCard({ 
  reminder, 
  petName,
  onComplete,
  onDelete,
  isPending
}: { 
  reminder: Reminder; 
  petName?: string;
  onComplete: () => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const Icon = typeIcons[reminder.reminderType] || Bell;
  const colorClass = typeColors[reminder.reminderType] || typeColors.other;
  const dateStr = reminder.reminderDate;
  const isOverdue = isPast(parseISO(dateStr)) && !isToday(parseISO(dateStr));
  
  return (
    <Card data-testid={`reminder-${reminder.id}`} className={isOverdue ? "border-destructive/50" : ""}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-medium truncate">{reminder.title}</h3>
              <div className="flex items-center gap-1 shrink-0">
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={onComplete}
                  disabled={isPending}
                  data-testid={`button-complete-${reminder.id}`}
                >
                  <Check className="w-4 h-4 text-green-600" />
                </Button>
                <Button 
                  size="icon" 
                  variant="ghost"
                  onClick={onDelete}
                  disabled={isPending}
                  data-testid={`button-delete-${reminder.id}`}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </div>
            {reminder.description && (
              <p className="text-sm text-muted-foreground truncate">{reminder.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
              <Badge variant="secondary" className="capitalize">
                {reminder.reminderType.replace("_", " ")}
              </Badge>
              {petName && (
                <span className="flex items-center gap-1">
                  <PawPrint className="w-3 h-3" />
                  {petName}
                </span>
              )}
              <span className={`flex items-center gap-1 ${isOverdue ? "text-destructive font-medium" : ""}`}>
                <Calendar className="w-3 h-3" />
                {formatReminderDate(dateStr)}
                {isOverdue && " (Overdue)"}
              </span>
              {reminder.reminderTime && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {reminder.reminderTime}
                </span>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Reminders() {
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: reminders, isLoading } = useQuery<Reminder[]>({
    queryKey: ["/api/reminders"],
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/reminders/${id}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({ title: "Reminder completed" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({ title: "Reminder deleted" });
    },
  });

  const petMap = new Map(pets?.map(p => [p.id, p.name]) || []);

  const activeReminders = reminders?.filter(r => !r.isCompleted) || [];
  const completedReminders = reminders?.filter(r => r.isCompleted) || [];

  const upcomingToday = activeReminders.filter(r => isToday(parseISO(r.reminderDate)));
  const upcomingCount = activeReminders.length;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Reminders</h1>
          <ThemeToggle />
          <Button size="sm" asChild data-testid="button-add-reminder">
            <Link href="/reminders/new">
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Active Reminders</span>
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold" data-testid="text-reminder-count">
              {upcomingCount}
            </p>
            {upcomingToday.length > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                {upcomingToday.length} due today
              </p>
            )}
          </CardContent>
        </Card>

        <section>
          <h2 className="font-heading font-semibold text-lg mb-3">Upcoming</h2>
          
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : activeReminders.length > 0 ? (
            <div className="space-y-3">
              {activeReminders.map((reminder) => (
                <ReminderCard 
                  key={reminder.id} 
                  reminder={reminder}
                  petName={reminder.petId ? petMap.get(reminder.petId) : undefined}
                  onComplete={() => completeMutation.mutate(reminder.id)}
                  onDelete={() => deleteMutation.mutate(reminder.id)}
                  isPending={completeMutation.isPending || deleteMutation.isPending}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed" data-testid="empty-reminders">
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No reminders set</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create reminders for medications, vet visits, and more
                </p>
                <Button asChild>
                  <Link href="/reminders/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Reminder
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {completedReminders.length > 0 && (
          <section>
            <h2 className="font-heading font-semibold text-lg mb-3 text-muted-foreground">
              Completed ({completedReminders.length})
            </h2>
            <div className="space-y-3 opacity-60">
              {completedReminders.slice(0, 5).map((reminder) => (
                <Card key={reminder.id} data-testid={`completed-reminder-${reminder.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-muted">
                        <Check className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate line-through">{reminder.title}</h3>
                        <p className="text-xs text-muted-foreground">{reminder.reminderDate}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
