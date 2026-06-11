import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Brain, Plus, Calendar, Lightbulb, AlertTriangle,
  ArrowLeft
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { BehaviorLog, Pet } from "@shared/schema";

const severityColors: Record<string, string> = {
  low: "bg-chart-3/20 text-chart-3",
  medium: "bg-chart-5/20 text-chart-5",
  high: "bg-destructive/20 text-destructive",
};

function BehaviorCard({ log, petName }: { log: BehaviorLog; petName?: string }) {
  return (
    <Card data-testid={`behavior-log-${log.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-chart-4/10 flex items-center justify-center shrink-0">
            <Brain className="w-5 h-5 text-chart-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium">{log.behaviorType}</h3>
              {log.severity && (
                <Badge className={severityColors[log.severity] || ""}>{log.severity}</Badge>
              )}
              {petName && <Badge variant="secondary" className="text-xs">{petName}</Badge>}
            </div>
            {log.description && (
              <p className="text-sm text-muted-foreground mb-2">{log.description}</p>
            )}
            {log.triggers && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
                <AlertTriangle className="w-3 h-3" />
                <span>Triggers: {log.triggers}</span>
              </div>
            )}
            {log.aiSuggestion && (
              <div className="mt-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-1 text-xs text-primary mb-1">
                  <Lightbulb className="w-3 h-3" />
                  <span className="font-medium">AI Suggestion</span>
                </div>
                <p className="text-sm text-muted-foreground">{log.aiSuggestion}</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {log.date}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function Behavior() {
  const [, navigate] = useLocation();

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: behaviorLogs, isLoading } = useQuery<BehaviorLog[]>({
    queryKey: ["/api/behavior-logs"],
  });

  const petMap = new Map(pets?.map(p => [p.id, p.name]) || []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/more")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Behavior</h1>
          <ThemeToggle />
          <Button size="sm" asChild data-testid="button-log-behavior">
            <Link href="/behavior/new">
              <Plus className="w-4 h-4 mr-1" />
              Log
            </Link>
          </Button>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <Card className="mb-6 bg-gradient-to-br from-chart-4/10 to-chart-4/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="w-5 h-5 text-chart-4" />
              <h2 className="font-medium">AI Behavior Analysis</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Log your pet's behaviors to receive AI-powered suggestions for training and managing behavioral issues.
            </p>
          </CardContent>
        </Card>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : behaviorLogs && behaviorLogs.length > 0 ? (
          <div className="space-y-4">
            {behaviorLogs.map((log) => (
              <BehaviorCard key={log.id} log={log} petName={petMap.get(log.petId)} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed" data-testid="empty-behavior">
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <h3 className="font-medium mb-1">No behavior logs</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Track behaviors to understand patterns and get AI suggestions
              </p>
              <Button asChild>
                <Link href="/behavior/new">
                  <Plus className="w-4 h-4 mr-2" />
                  Log First Behavior
                </Link>
              </Button>
            </CardContent>
          </Card>
        )}
      </main>

      <BottomNavigation />
    </div>
  );
}
