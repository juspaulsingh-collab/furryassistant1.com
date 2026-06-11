import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { ArrowLeft, Loader2, Trash2, Droplets } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { HydrationLog, InsertHydrationLog, Pet } from "@shared/schema";
import { insertHydrationLogSchema } from "@shared/schema";

const hydrationLogFormSchema = insertHydrationLogSchema.extend({
  amount: z.string().min(1, "Amount is required"),
  date: z.string().min(1, "Date is required"),
  petId: z.coerce.number().min(1, "Please select a pet"),
});

type HydrationLogFormValues = z.infer<typeof hydrationLogFormSchema>;

export default function HydrationLogForm() {
  const [, params] = useRoute("/nutrition/hydration/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = params?.id && params.id !== "new";
  const logId = isEdit ? parseInt(params.id) : null;

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: existingLog, isLoading: loadingLog } = useQuery<HydrationLog>({
    queryKey: ["/api/hydration-logs", logId],
    enabled: !!logId,
  });

  const form = useForm<HydrationLogFormValues>({
    resolver: zodResolver(hydrationLogFormSchema),
    defaultValues: {
      petId: 0,
      amount: "",
      unit: "ml",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHydrationLog) => {
      const response = await apiRequest("POST", "/api/hydration-logs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hydration-logs"] });
      toast({ title: "Water intake logged!" });
      navigate("/nutrition");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to log water intake", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertHydrationLog) => {
      const response = await apiRequest("PATCH", `/api/hydration-logs/${logId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hydration-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hydration-logs", logId] });
      toast({ title: "Water intake updated!" });
      navigate("/nutrition");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update log", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/hydration-logs/${logId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hydration-logs"] });
      toast({ title: "Log deleted" });
      navigate("/nutrition");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete log", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: HydrationLogFormValues) => {
    const submitData: InsertHydrationLog = {
      ...data,
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
      amount: existingLog.amount,
      unit: existingLog.unit || "ml",
      date: existingLog.date,
    });
  }

  const quickAmounts = [100, 200, 300, 500];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/nutrition")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">
            {isEdit ? "Edit Water Intake" : "Log Water Intake"}
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
            <div className="flex justify-center">
              <div className="w-20 h-20 rounded-full bg-chart-4/10 flex items-center justify-center">
                <Droplets className="w-10 h-10 text-chart-4" />
              </div>
            </div>

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

                <div>
                  <FormLabel>Quick Add</FormLabel>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {quickAmounts.map((amount) => (
                      <Button
                        key={amount}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => form.setValue("amount", amount.toString())}
                        data-testid={`quick-add-${amount}`}
                      >
                        {amount}ml
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount *</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="e.g., 250" {...field} data-testid="input-amount" />
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
                        <Select onValueChange={field.onChange} value={field.value || "ml"}>
                          <FormControl>
                            <SelectTrigger data-testid="select-unit">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ml">Milliliters (ml)</SelectItem>
                            <SelectItem value="oz">Ounces (oz)</SelectItem>
                            <SelectItem value="cups">Cups</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
              data-testid="button-save-hydration"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Logging..."}
                </>
              ) : (
                isEdit ? "Update Log" : "Log Water Intake"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNavigation />
    </div>
  );
}
