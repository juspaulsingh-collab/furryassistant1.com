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
import { ArrowLeft, Loader2, Trash2, Camera, Plus } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { HealthRecord, InsertHealthRecord, Pet } from "@shared/schema";
import { insertHealthRecordSchema } from "@shared/schema";

const healthRecordFormSchema = insertHealthRecordSchema.extend({
  title: z.string().min(1, "Title is required"),
  recordType: z.string().min(1, "Record type is required"),
  date: z.string().min(1, "Date is required"),
  petId: z.coerce.number().min(1, "Please select a pet"),
});

type HealthRecordFormValues = z.infer<typeof healthRecordFormSchema>;

export default function HealthRecordForm() {
  const [, params] = useRoute("/health/records/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = params?.id && params.id !== "new";
  const recordId = isEdit ? parseInt(params.id) : null;

  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: existingRecord, isLoading: loadingRecord } = useQuery<HealthRecord>({
    queryKey: ["/api/health-records", recordId],
    enabled: !!recordId,
  });

  const form = useForm<HealthRecordFormValues>({
    resolver: zodResolver(healthRecordFormSchema),
    defaultValues: {
      petId: 0,
      recordType: "",
      title: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      veterinarian: "",
      clinic: "",
      reminderDate: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertHealthRecord) => {
      const response = await apiRequest("POST", "/api/health-records", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-records"] });
      toast({ title: "Health record added!" });
      navigate("/health");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add record", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertHealthRecord) => {
      const response = await apiRequest("PATCH", `/api/health-records/${recordId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-records"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health-records", recordId] });
      toast({ title: "Health record updated!" });
      navigate("/health");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update record", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/health-records/${recordId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/health-records"] });
      toast({ title: "Record deleted" });
      navigate("/health");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete record", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: HealthRecordFormValues) => {
    const submitData: InsertHealthRecord = {
      ...data,
      reminderDate: data.reminderDate || null,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (loadingRecord) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEdit && existingRecord && !form.formState.isDirty) {
    form.reset({
      petId: existingRecord.petId,
      recordType: existingRecord.recordType,
      title: existingRecord.title,
      description: existingRecord.description || "",
      date: existingRecord.date,
      veterinarian: existingRecord.veterinarian || "",
      clinic: existingRecord.clinic || "",
      reminderDate: existingRecord.reminderDate || "",
      notes: existingRecord.notes || "",
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/health")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">
            {isEdit ? "Edit Record" : "Add Health Record"}
          </h1>
          {isEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-record"
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
                    name="recordType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-record-type">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="vaccination">Vaccination</SelectItem>
                            <SelectItem value="checkup">Check-up</SelectItem>
                            <SelectItem value="surgery">Surgery</SelectItem>
                            <SelectItem value="dental">Dental</SelectItem>
                            <SelectItem value="lab">Lab Work</SelectItem>
                            <SelectItem value="imaging">Imaging</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
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
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title *</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Annual vaccination" {...field} data-testid="input-title" />
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
                          placeholder="Details about the visit..."
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="veterinarian"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Veterinarian</FormLabel>
                        <FormControl>
                          <Input placeholder="Dr. Name" {...field} value={field.value || ""} data-testid="input-vet" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clinic"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Clinic</FormLabel>
                        <FormControl>
                          <Input placeholder="Clinic name" {...field} value={field.value || ""} data-testid="input-clinic" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="reminderDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reminder Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} value={field.value || ""} data-testid="input-reminder" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div>
                  <FormLabel>Photos (up to 4)</FormLabel>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {[0, 1, 2, 3].map((idx) => (
                      <div
                        key={idx}
                        className="aspect-square rounded-lg border-2 border-dashed border-muted-foreground/25 flex items-center justify-center cursor-pointer hover-elevate"
                        data-testid={`photo-slot-${idx}`}
                      >
                        <Camera className="w-5 h-5 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Additional notes..."
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
              data-testid="button-save-record"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEdit ? "Update Record" : "Add Record"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNavigation />
    </div>
  );
}
