import { useState } from "react";
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
import { ArrowLeft, Loader2, Trash2, Sparkles, Bot, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { BehaviorLog, InsertBehaviorLog, Pet } from "@shared/schema";
import { insertBehaviorLogSchema } from "@shared/schema";

const behaviorFormSchema = insertBehaviorLogSchema.extend({
  behaviorType: z.string().min(1, "Behavior type is required"),
  date: z.string().min(1, "Date is required"),
  petId: z.coerce.number().min(1, "Please select a pet"),
});

type BehaviorFormValues = z.infer<typeof behaviorFormSchema>;

export default function BehaviorForm() {
  const [, params] = useRoute("/behavior/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const isEdit = params?.id && params.id !== "new";
  const behaviorId = isEdit ? parseInt(params.id) : null;

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: existingBehavior, isLoading: loadingBehavior } = useQuery<BehaviorLog>({
    queryKey: ["/api/behavior-logs", behaviorId],
    enabled: !!behaviorId,
  });

  const form = useForm<BehaviorFormValues>({
    resolver: zodResolver(behaviorFormSchema),
    defaultValues: {
      petId: 0,
      behaviorType: "",
      severity: "",
      description: "",
      triggers: "",
      date: new Date().toISOString().split("T")[0],
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertBehaviorLog) => {
      const response = await apiRequest("POST", "/api/behavior-logs", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/behavior-logs"] });
      toast({ title: "Behavior logged!" });
      navigate("/behavior");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to log behavior", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertBehaviorLog) => {
      const response = await apiRequest("PATCH", `/api/behavior-logs/${behaviorId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/behavior-logs"] });
      queryClient.invalidateQueries({ queryKey: ["/api/behavior-logs", behaviorId] });
      toast({ title: "Behavior log updated!" });
      navigate("/behavior");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update behavior", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/behavior-logs/${behaviorId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/behavior-logs"] });
      toast({ title: "Behavior log deleted" });
      navigate("/behavior");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete behavior", description: error.message, variant: "destructive" });
    },
  });

  const getAiSuggestionMutation = useMutation({
    mutationFn: async () => {
      const data = form.getValues();
      const response = await apiRequest("POST", "/api/behavior-suggestions", {
        behaviorType: data.behaviorType,
        description: data.description,
        triggers: data.triggers,
        petId: data.petId,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.suggestion) {
        setAiSuggestion(data.suggestion);
        toast({ title: "AI suggestion received!" });
      }
    },
    onError: (error: Error) => {
      toast({ title: "Failed to get suggestion", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: BehaviorFormValues) => {
    const submitData: InsertBehaviorLog = {
      ...data,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (loadingBehavior) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEdit && existingBehavior && !form.formState.isDirty) {
    form.reset({
      petId: existingBehavior.petId,
      behaviorType: existingBehavior.behaviorType,
      severity: existingBehavior.severity || "",
      description: existingBehavior.description || "",
      triggers: existingBehavior.triggers || "",
      date: existingBehavior.date,
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/behavior")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">
            {isEdit ? "Edit Behavior" : "Log Behavior"}
          </h1>
          {isEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-behavior"
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
                    name="behaviorType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Behavior Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-behavior-type">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="aggression">Aggression</SelectItem>
                            <SelectItem value="anxiety">Anxiety</SelectItem>
                            <SelectItem value="barking">Excessive Barking</SelectItem>
                            <SelectItem value="destructive">Destructive</SelectItem>
                            <SelectItem value="fear">Fear</SelectItem>
                            <SelectItem value="jumping">Jumping</SelectItem>
                            <SelectItem value="leash_pulling">Leash Pulling</SelectItem>
                            <SelectItem value="separation">Separation Issues</SelectItem>
                            <SelectItem value="resource_guarding">Resource Guarding</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Severity</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-severity">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="mild">Mild</SelectItem>
                            <SelectItem value="moderate">Moderate</SelectItem>
                            <SelectItem value="severe">Severe</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe the behavior in detail..."
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="triggers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Triggers</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="What seems to trigger this behavior?"
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-triggers"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => getAiSuggestionMutation.mutate()}
                  disabled={getAiSuggestionMutation.isPending || !form.watch("behaviorType")}
                  data-testid="button-get-ai-suggestion"
                >
                  {getAiSuggestionMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  Get AI Suggestions
                </Button>

                {aiSuggestion && (
                  <Card className="mt-4 bg-primary/5 border-primary/20" data-testid="card-ai-suggestion">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <h4 className="font-medium text-sm">AI Suggestion</h4>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => setAiSuggestion(null)}
                              data-testid="button-dismiss-suggestion"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{aiSuggestion}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isPending}
              data-testid="button-save-behavior"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Logging..."}
                </>
              ) : (
                isEdit ? "Update Behavior" : "Log Behavior"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNavigation />
    </div>
  );
}
