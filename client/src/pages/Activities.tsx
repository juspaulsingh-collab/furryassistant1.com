import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Activity as ActivityIcon, Plus, Clock, MapPin,
  Target, TrendingUp, Calendar, Navigation
} from "lucide-react";
import { Link } from "wouter";
import type { Activity, ActivityGoal, Pet } from "@shared/schema";

const activityIcons: Record<string, typeof ActivityIcon> = {
  walk: MapPin,
  run: TrendingUp,
  play: ActivityIcon,
  training: Target,
  swim: ActivityIcon,
  other: ActivityIcon,
};

function ActivityCard({ activity, petName }: { activity: Activity; petName?: string }) {
  const Icon = activityIcons[activity.activityType] || ActivityIcon;
  const activityDescription = [
    activity.duration ? `${activity.duration} minutes` : null,
    activity.distance ? `${activity.distance} kilometers` : null,
    activity.date
  ].filter(Boolean).join(", ");
  
  return (
    <Card 
      className="hover-elevate" 
      data-testid={`activity-${activity.id}`}
      role="article"
      aria-label={`${activity.activityType} activity${petName ? ` with ${petName}` : ''}, ${activityDescription}`}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-chart-3/10 flex items-center justify-center shrink-0" aria-hidden="true">
            <Icon className="w-5 h-5 text-chart-3" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium capitalize">{activity.activityType}</h3>
              <Badge variant="secondary" className="text-xs">{petName}</Badge>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
              {activity.duration && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {activity.duration} min
                </span>
              )}
              {activity.distance && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {activity.distance} km
                </span>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {activity.date}
              </span>
            </div>
            {activity.notes && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {activity.notes}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GoalCard({ goal, currentValue, petName }: { goal: ActivityGoal; currentValue: number; petName?: string }) {
  const progress = Math.min((currentValue / goal.targetValue) * 100, 100);
  
  return (
    <Card 
      data-testid={`goal-${goal.id}`}
      role="article"
      aria-label={`${goal.goalType} goal${petName ? ` for ${petName}` : ''}, ${Math.round(progress)}% complete, ${currentValue} of ${goal.targetValue}`}
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" aria-hidden="true" />
            <span className="font-medium capitalize">{goal.goalType} Goal</span>
          </div>
          {petName && <Badge variant="secondary" className="text-xs">{petName}</Badge>}
        </div>
        <Progress value={progress} className="h-2 mb-2" />
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {currentValue} / {goal.targetValue} {goal.unit}
          </span>
          <span className={progress >= 100 ? "text-chart-3 font-medium" : "text-muted-foreground"}>
            {progress >= 100 ? "Goal reached!" : `${Math.round(progress)}%`}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Activities() {
  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities"],
  });

  const { data: goals, isLoading: goalsLoading } = useQuery<ActivityGoal[]>({
    queryKey: ["/api/activity-goals"],
  });

  const petMap = new Map(pets?.map(p => [p.id, p.name]) || []);
  
  const todayActivities = activities?.filter(a => a.date === new Date().toISOString().split('T')[0]) || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <h1 className="font-heading font-semibold text-lg">Activities</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" variant="outline" asChild data-testid="button-gps-track">
              <Link href="/activities/track">
                <Navigation className="w-4 h-4 mr-1" />
                GPS
              </Link>
            </Button>
            <Button size="sm" asChild data-testid="button-log-activity">
              <Link href="/activities/new">
                <Plus className="w-4 h-4 mr-1" />
                Log
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {goals && goals.length > 0 && (
          <section>
            <h2 className="font-heading font-semibold text-lg mb-4">Today's Goals</h2>
            <div className="space-y-3">
              {goals.map((goal) => (
                <GoalCard 
                  key={goal.id} 
                  goal={goal} 
                  currentValue={0}
                  petName={petMap.get(goal.petId)}
                />
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className="font-heading font-semibold text-lg">Today's Activities</h2>
            <span className="text-sm text-muted-foreground">{todayActivities.length} logged</span>
          </div>

          {activitiesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : todayActivities.length > 0 ? (
            <div className="space-y-4">
              {todayActivities.map((activity) => (
                <ActivityCard 
                  key={activity.id} 
                  activity={activity}
                  petName={petMap.get(activity.petId)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed" data-testid="empty-activities-today">
              <CardContent className="p-6 text-center">
                <ActivityIcon className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground mb-4">No activities logged today</p>
                <Button size="sm" asChild>
                  <Link href="/activities/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Log First Activity
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        <section>
          <h2 className="font-heading font-semibold text-lg mb-4">Recent Activities</h2>
          
          {activitiesLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-4">
              {activities.slice(0, 10).map((activity) => (
                <ActivityCard 
                  key={activity.id} 
                  activity={activity}
                  petName={petMap.get(activity.petId)}
                />
              ))}
            </div>
          ) : (
            <Card className="border-dashed" data-testid="empty-activities">
              <CardContent className="p-8 text-center">
                <ActivityIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <h3 className="font-medium mb-1">No activities yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Start logging walks, playtime, and more
                </p>
                <Button asChild>
                  <Link href="/activities/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Log Your First Activity
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
}
