import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Utensils, Droplets, Plus, Sparkles, Calendar,
  ArrowLeft, Loader2
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { NutritionLog, HydrationLog, Pet, MealPlan } from "@shared/schema";

function NutritionLogCard({ log, petName }: { log: NutritionLog; petName?: string }) {
  return (
    <Card data-testid={`nutrition-log-${log.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-chart-5/10 flex items-center justify-center shrink-0">
            <Utensils className="w-5 h-5 text-chart-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium capitalize">{log.mealType}</h3>
              {petName && <Badge variant="secondary" className="text-xs">{petName}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {log.foodName} - {log.amount} {log.unit}
              {log.calories && ` (${log.calories} cal)`}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {log.date}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function HydrationLogCard({ log, petName }: { log: HydrationLog; petName?: string }) {
  return (
    <Card data-testid={`hydration-log-${log.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
            <Droplets className="w-5 h-5 text-chart-2" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium">Water Intake</h3>
              {petName && <Badge variant="secondary" className="text-xs">{petName}</Badge>}
            </div>
            <p className="text-sm text-muted-foreground">
              {log.amount} {log.unit}
            </p>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {log.date}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MealPlanCard({ plan }: { plan: MealPlan }) {
  return (
    <Card data-testid={`meal-plan-${plan.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-5 h-5 text-primary" />
          <h3 className="font-medium">AI Generated Meal Plan</h3>
        </div>
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {plan.planContent}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Generated on {new Date(plan.generatedAt!).toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

export default function Nutrition() {
  const [, navigate] = useLocation();
  const [selectedPetId, setSelectedPetId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: nutritionLogs, isLoading: nutritionLoading } = useQuery<NutritionLog[]>({
    queryKey: ["/api/nutrition-logs"],
  });

  const { data: hydrationLogs, isLoading: hydrationLoading } = useQuery<HydrationLog[]>({
    queryKey: ["/api/hydration-logs"],
  });

  const { data: mealPlans, isLoading: plansLoading } = useQuery<MealPlan[]>({
    queryKey: ["/api/meal-plans"],
  });

  const generatePlanMutation = useMutation({
    mutationFn: async (petId: number) => {
      const response = await apiRequest("POST", "/api/meal-plans/generate", { petId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/meal-plans"] });
      toast({ title: "Meal plan generated!" });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to generate meal plan", description: error.message, variant: "destructive" });
    },
  });

  const petMap = new Map(pets?.map(p => [p.id, p.name]) || []);

  const handleGeneratePlan = () => {
    if (!selectedPetId) {
      toast({ title: "Please select a pet first", variant: "destructive" });
      return;
    }
    generatePlanMutation.mutate(parseInt(selectedPetId));
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/more")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Nutrition</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="font-heading font-semibold">AI Meal Plan Generator</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Get personalized nutrition recommendations for your pet based on their profile.
            </p>
            <div className="flex gap-2">
              <Select value={selectedPetId} onValueChange={setSelectedPetId}>
                <SelectTrigger className="flex-1" data-testid="select-pet-meal-plan">
                  <SelectValue placeholder="Select a pet" />
                </SelectTrigger>
                <SelectContent>
                  {pets?.map((pet) => (
                    <SelectItem key={pet.id} value={pet.id.toString()}>
                      {pet.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={handleGeneratePlan}
                disabled={generatePlanMutation.isPending || !selectedPetId}
                data-testid="button-generate-meal-plan"
              >
                {generatePlanMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-1" />
                    Generate
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="food" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="food" data-testid="tab-food">
              <Utensils className="w-4 h-4 mr-1" />
              Food
            </TabsTrigger>
            <TabsTrigger value="water" data-testid="tab-water">
              <Droplets className="w-4 h-4 mr-1" />
              Water
            </TabsTrigger>
            <TabsTrigger value="plans" data-testid="tab-plans">
              <Sparkles className="w-4 h-4 mr-1" />
              Plans
            </TabsTrigger>
          </TabsList>

          <TabsContent value="food" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" asChild data-testid="button-log-food">
                <Link href="/nutrition/logs/new">
                  <Plus className="w-4 h-4 mr-1" />
                  Log Food
                </Link>
              </Button>
            </div>
            
            {nutritionLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
                <Skeleton className="h-20 w-full" />
              </div>
            ) : nutritionLogs && nutritionLogs.length > 0 ? (
              <div className="space-y-3">
                {nutritionLogs.map((log) => (
                  <NutritionLogCard key={log.id} log={log} petName={petMap.get(log.petId)} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed" data-testid="empty-nutrition">
                <CardContent className="p-6 text-center">
                  <Utensils className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No food logs yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="water" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" asChild data-testid="button-log-water">
                <Link href="/nutrition/hydration/new">
                  <Plus className="w-4 h-4 mr-1" />
                  Log Water
                </Link>
              </Button>
            </div>
            
            {hydrationLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-20 w-full" />
              </div>
            ) : hydrationLogs && hydrationLogs.length > 0 ? (
              <div className="space-y-3">
                {hydrationLogs.map((log) => (
                  <HydrationLogCard key={log.id} log={log} petName={petMap.get(log.petId)} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed" data-testid="empty-hydration">
                <CardContent className="p-6 text-center">
                  <Droplets className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No water logs yet</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="plans" className="space-y-4">
            {plansLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : mealPlans && mealPlans.length > 0 ? (
              <div className="space-y-4">
                {mealPlans.map((plan) => (
                  <MealPlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed" data-testid="empty-plans">
                <CardContent className="p-6 text-center">
                  <Sparkles className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground mb-3">No meal plans yet</p>
                  <p className="text-xs text-muted-foreground">
                    Select a pet above and click Generate to create an AI meal plan
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
}
