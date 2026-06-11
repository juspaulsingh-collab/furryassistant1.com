import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Loader2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { NutritionLog, InsertNutritionLog, Pet } from "@shared/schema";
import { insertNutritionLogSchema } from "@shared/schema";

const nutritionLogFormSchema = insertNutritionLogSchema.extend({
  mealType: z.string().min(1, "Meal type is required"),
  date: z.string().min(1, "Date is required"),
  petId: z.coerce.number().min(1, "Please select a pet"),
  amount: z.string().optional(),
  calories: z.coerce.number().optional(),
});

type NutritionLogFormValues = z.infer<typeof nutritionLogFormSchema>;

export default function NutritionLogForm() {
  const [, params] = useRoute("/nutrition/logs/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = params?.id && params.id !== "new";
  const logId = isEdit ? parseInt(params.id) : null;

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: existingLog, isLoading: loadingLog } = useQuery<NutritionLog>({
    queryKey: ["/api/nutrition-logs", logId],
    enabled: !!logId,
  });

  const form = useForm<NutritionLogFormValues>({
    resolver: zodResolver(nutritionLogFormSchema),
    defaultValues: {
      petId: 0,
      mealType: "",
      foodName: "",
      amount: "",
      unit: "cups",
      calories: undefined,
      date: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertNutritionLog) => {
      const response = await apiRequest("POST", "/api/nutrition-logs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      toast({ title: "Meal logged!" });
      navigate("/nutrition");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to log meal", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertNutritionLog) => {
      const response = await apiRequest("PATCH", `/api/nutrition-logs/${logId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs", logId] });
      toast({ title: "Meal log updated!" });
      navigate("/nutrition");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update meal", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/nutrition-logs/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/nutrition-logs"] });
      toast({ title: "Meal log deleted" });
      navigate("/nutrition");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete meal", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: NutritionLogFormValues) => {
    const submitData: InsertNutritionLog = {
      ...data,
      amount: data.amount || null,
      calories: data.calories || null,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (loadingLog) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEdit && existingLog && !form.formState.isDirty) {
    form.reset({
      petId: existingLog.petId,
      mealType: existingLog.mealType,
      foodName: existingLog.foodName || "",
      amount: existingLog.amount || "",
      unit: existingLog.unit || "cups",
      calories: existingLog.calories || undefined,
      date: existingLog.date,
      notes: existingLog.notes || "",
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/nutrition")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">
            {isEdit ? "Edit Meal" : "Log Meal"}
          </h1>
          {isEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-log"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Trash2 className="w-5 h-5 text-destructive" />
              )}
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Card>
              <CardContent className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="petId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet *</FormLabel>
                      <Select onValueChange={(v) => field.onChange(parseInt(v))} value={field.value?.toString() || ""}>
                        <FormControl>
                          <SelectTrigger data-testid="select-pet">
                            <SelectValue placeholder="Select pet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {pets?.map((pet) => (
                            <SelectItem key={pet.id} value={pet.id.toString()}>
                              {pet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="mealType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Meal Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-meal-type">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="breakfast">Breakfast</SelectItem>
                            <SelectItem value="lunch">Lunch</SelectItem>
                            <SelectItem value="dinner">Dinner</SelectItem>
                            <SelectItem value="snack">Snack</SelectItem>
                            <SelectItem value="treat">Treat</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date *</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="foodName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Food Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Blue Buffalo Chicken" {...field} value={field.value || ""} data-testid="input-food-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 1.5" {...field} data-testid="input-amount" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unit</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || "cups"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-unit">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="cups">Cups</SelectItem>
                            <SelectItem value="oz">Ounces</SelectItem>
                            <SelectItem value="g">Grams</SelectItem>
                            <SelectItem value="pieces">Pieces</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="calories"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Calories (optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="e.g., 350"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          value={field.value || ""}
                          data-testid="input-calories"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any observations about eating..."
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-notes"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
              data-testid="button-save-meal"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Logging..."}
                </>
              ) : (
                isEdit ? "Update Meal" : "Log Meal"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNavigation />
    </div>
  );
}
