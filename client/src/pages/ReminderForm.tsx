import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import type { Reminder, InsertReminder, Pet } from "@shared/schema";
import { insertReminderSchema } from "@shared/schema";

const reminderFormSchema = insertReminderSchema.omit({ userId: true }).extend({
  title: z.string().min(1, "Title is required"),
  reminderType: z.string().min(1, "Type is required"),
  reminderDate: z.string().min(1, "Date is required"),
  reminderTime: z.string().optional(),
  description: z.string().optional(),
  petId: z.coerce.number().optional().nullable(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.string().optional(),
});

type ReminderFormValues = z.infer<typeof reminderFormSchema>;

const reminderTypes = [
  { value: "medication", label: "Medication" },
  { value: "vaccination", label: "Vaccination" },
  { value: "vet_visit", label: "Vet Visit" },
  { value: "grooming", label: "Grooming" },
  { value: "feeding", label: "Feeding" },
  { value: "exercise", label: "Exercise" },
  { value: "other", label: "Other" },
];

const recurringIntervals = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" },
];

export default function ReminderForm() {
  const [, params] = useRoute("/reminders/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = params?.id && params.id !== "new";
  const reminderId = isEdit ? parseInt(params.id) : null;

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: existingReminder, isLoading: loadingReminder } = useQuery<Reminder>({
    queryKey: ["/api/reminders", reminderId],
    enabled: !!reminderId,
  });

  const form = useForm<ReminderFormValues>({
    resolver: zodResolver(reminderFormSchema),
    defaultValues: {
      title: "",
      description: "",
      reminderType: "",
      reminderDate: new Date().toISOString().split("T")[0],
      reminderTime: "",
      petId: null,
      isRecurring: false,
      recurringInterval: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertReminder) => {
      const response = await apiRequest("POST", "/api/reminders", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({ title: "Reminder created!" });
      navigate("/reminders");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to create reminder", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<InsertReminder>) => {
      const response = await apiRequest("PATCH", `/api/reminders/${reminderId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reminders", reminderId] });
      toast({ title: "Reminder updated!" });
      navigate("/reminders");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update reminder", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/reminders/${reminderId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/reminders"] });
      toast({ title: "Reminder deleted" });
      navigate("/reminders");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete reminder", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: ReminderFormValues) => {
    const submitData = {
      ...data,
      petId: data.petId || null,
      reminderTime: data.reminderTime || null,
      recurringInterval: data.isRecurring ? data.recurringInterval : null,
    };

    if (isEdit) {
      updateMutation.mutate(submitData as Partial<InsertReminder>);
    } else {
      createMutation.mutate(submitData as InsertReminder);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;
  const isRecurring = form.watch("isRecurring");

  if (loadingReminder) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEdit && existingReminder && !form.formState.isDirty) {
    form.reset({
      title: existingReminder.title,
      description: existingReminder.description || "",
      reminderType: existingReminder.reminderType,
      reminderDate: existingReminder.reminderDate,
      reminderTime: existingReminder.reminderTime || "",
      petId: existingReminder.petId || null,
      isRecurring: existingReminder.isRecurring || false,
      recurringInterval: existingReminder.recurringInterval || "",
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/reminders")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">
            {isEdit ? "Edit Reminder" : "New Reminder"}
          </h1>
          {isEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-reminder"
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Max's flea medication" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="reminderType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {reminderTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
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
                  name="petId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pet (Optional)</FormLabel>
                      <Select 
                        onValueChange={(value) => field.onChange(value === "none" ? null : parseInt(value))} 
                        value={field.value?.toString() || "none"}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-pet">
                            <SelectValue placeholder="Select pet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">No specific pet</SelectItem>
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Add any notes or details..." 
                          className="resize-none"
                          {...field} 
                          data-testid="input-description" 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <h3 className="font-medium">Schedule</h3>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="reminderDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-date" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="reminderTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Time (Optional)</FormLabel>
                        <FormControl>
                          <Input type="time" {...field} data-testid="input-time" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="isRecurring"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Recurring</FormLabel>
                        <FormDescription className="text-xs">
                          Repeat this reminder
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="switch-recurring"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {isRecurring && (
                  <FormField
                    control={form.control}
                    name="recurringInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Repeat Every</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-interval">
                              <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {recurringIntervals.map((interval) => (
                              <SelectItem key={interval.value} value={interval.value}>
                                {interval.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </CardContent>
            </Card>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isPending}
              data-testid="button-submit"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Creating..."}
                </>
              ) : (
                isEdit ? "Update Reminder" : "Create Reminder"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNavigation />
    </div>
  );
}
