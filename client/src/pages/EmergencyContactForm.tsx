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
import type { EmergencyContact, InsertEmergencyContact } from "@shared/schema";
import { insertEmergencyContactSchema } from "@shared/schema";

const emergencyContactFormSchema = insertEmergencyContactSchema.extend({
  name: z.string().min(1, "Name is required"),
  contactType: z.string().min(1, "Contact type is required"),
  phone: z.string().optional(),
});

type EmergencyContactFormValues = z.infer<typeof emergencyContactFormSchema>;

export default function EmergencyContactForm() {
  const [, params] = useRoute("/emergency/contacts/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = params?.id && params.id !== "new";
  const contactId = isEdit ? parseInt(params.id) : null;

  const { data: existingContact, isLoading: loadingContact } = useQuery<EmergencyContact>({
    queryKey: ["/api/emergency-contacts", contactId],
    enabled: !!contactId,
  });

  const form = useForm<EmergencyContactFormValues>({
    resolver: zodResolver(emergencyContactFormSchema),
    defaultValues: {
      name: "",
      contactType: "",
      phone: "",
      address: "",
      notes: "",
      isPrimary: false,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertEmergencyContact) => {
      const response = await apiRequest("POST", "/api/emergency-contacts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({ title: "Emergency contact added!" });
      navigate("/emergency");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add contact", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertEmergencyContact) => {
      const response = await apiRequest("PATCH", `/api/emergency-contacts/${contactId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts", contactId] });
      toast({ title: "Emergency contact updated!" });
      navigate("/emergency");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update contact", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/emergency-contacts/${contactId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/emergency-contacts"] });
      toast({ title: "Emergency contact deleted" });
      navigate("/emergency");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete contact", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: EmergencyContactFormValues) => {
    const submitData: InsertEmergencyContact = {
      ...data,
    };

    if (isEdit) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (loadingContact) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEdit && existingContact && !form.formState.isDirty) {
    form.reset({
      name: existingContact.name,
      contactType: existingContact.contactType,
      phone: existingContact.phone || "",
      address: existingContact.address || "",
      notes: existingContact.notes || "",
      isPrimary: existingContact.isPrimary ?? false,
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/emergency")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">
            {isEdit ? "Edit Contact" : "Add Emergency Contact"}
          </h1>
          {isEdit && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              data-testid="button-delete-contact"
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
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Contact or clinic name" {...field} data-testid="input-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="contactType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-contact-type">
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="veterinarian">Veterinarian</SelectItem>
                          <SelectItem value="emergency_vet">Emergency Vet (24/7)</SelectItem>
                          <SelectItem value="poison_control">Animal Poison Control</SelectItem>
                          <SelectItem value="pet_sitter">Pet Sitter</SelectItem>
                          <SelectItem value="groomer">Groomer</SelectItem>
                          <SelectItem value="trainer">Trainer</SelectItem>
                          <SelectItem value="boarding">Boarding Facility</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input type="tel" placeholder="(555) 555-5555" {...field} data-testid="input-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Street address, city, state..."
                          className="resize-none"
                          {...field}
                          value={field.value || ""}
                          data-testid="textarea-address"
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
                          placeholder="Hours, specialties, additional info..."
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

                <FormField
                  control={form.control}
                  name="isPrimary"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Primary Contact</FormLabel>
                        <FormDescription className="text-sm text-muted-foreground">
                          Mark as your primary emergency contact
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value ?? false}
                          onCheckedChange={field.onChange}
                          data-testid="switch-primary"
                        />
                      </FormControl>
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
              data-testid="button-save-contact"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEdit ? "Update Contact" : "Add Contact"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNavigation />
    </div>
  );
}
