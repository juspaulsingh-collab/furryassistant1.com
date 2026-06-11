import { useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute, Link } from "wouter";
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BottomNavigation } from "@/components/BottomNavigation";
import { useToast } from "@/hooks/use-toast";
import { useUpload } from "@/hooks/use-upload";
import { ArrowLeft, Camera, Loader2, Trash2, Share2, FileText } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Pet, InsertPet } from "@shared/schema";
import { insertPetSchema } from "@shared/schema";

const petFormSchema = insertPetSchema.omit({ userId: true }).extend({
  name: z.string().min(1, "Name is required").max(100),
  species: z.string().min(1, "Species is required"),
  dateOfBirth: z.string().optional(),
  weight: z.string().optional(),
});

type PetFormValues = z.infer<typeof petFormSchema>;

export default function PetForm() {
  const [, params] = useRoute("/pets/:id");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEdit = params?.id && params.id !== "new";
  const petId = isEdit ? parseInt(params.id) : null;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: existingPet, isLoading: loadingPet } = useQuery<Pet>({
    queryKey: ["/api/pets", petId],
    enabled: !!petId,
  });

  const { uploadFile, isUploading } = useUpload({
    onSuccess: (response) => {
      form.setValue("photoUrl", response.objectPath);
      toast({ title: "Photo uploaded!" });
    },
    onError: (error) => {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const form = useForm<PetFormValues>({
    resolver: zodResolver(petFormSchema),
    defaultValues: {
      name: "",
      species: "",
      breed: "",
      dateOfBirth: "",
      weight: "",
      gender: "",
      color: "",
      microchipId: "",
      photoUrl: "",
      notes: "",
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: InsertPet) => {
      const response = await apiRequest("POST", "/api/pets", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      toast({ title: "Pet added successfully!" });
      navigate("/pets");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to add pet", description: error.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: InsertPet) => {
      const response = await apiRequest("PATCH", `/api/pets/${petId}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      queryClient.invalidateQueries({ queryKey: ["/api/pets", petId] });
      toast({ title: "Pet updated successfully!" });
      navigate("/pets");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to update pet", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("DELETE", `/api/pets/${petId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      toast({ title: "Pet deleted" });
      navigate("/pets");
    },
    onError: (error: Error) => {
      toast({ title: "Failed to delete pet", description: error.message, variant: "destructive" });
    },
  });

  const onSubmit = (data: PetFormValues) => {
    const submitData = {
      ...data,
      weight: data.weight || null,
      dateOfBirth: data.dateOfBirth || null,
    };
    
    if (isEdit) {
      updateMutation.mutate(submitData as InsertPet);
    } else {
      createMutation.mutate(submitData as InsertPet);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  if (loadingPet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isEdit && existingPet && !form.formState.isDirty) {
    form.reset({
      name: existingPet.name,
      species: existingPet.species,
      breed: existingPet.breed || "",
      dateOfBirth: existingPet.dateOfBirth || "",
      weight: existingPet.weight || "",
      gender: existingPet.gender || "",
      color: existingPet.color || "",
      microchipId: existingPet.microchipId || "",
      photoUrl: existingPet.photoUrl || "",
      notes: existingPet.notes || "",
    });
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/pets")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">
            {isEdit ? "Edit Pet" : "Add New Pet"}
          </h1>
          {isEdit && (
            <>
              <Button
                variant="ghost"
                size="icon"
                asChild
                data-testid="button-sitter-handoff"
                title="Sitter handoff sheet"
              >
                <Link href={`/pets/${petId}/handoff`}>
                  <FileText className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                asChild
                data-testid="button-share-pet"
              >
                <Link href={`/pets/${petId}/share`}>
                  <Share2 className="w-5 h-5" />
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteMutation.mutate()}
                disabled={deleteMutation.isPending}
                data-testid="button-delete-pet"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Trash2 className="w-5 h-5 text-destructive" />
                )}
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={form.watch("photoUrl") || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-semibold">
                    {form.watch("name")?.charAt(0)?.toUpperCase() || "?"}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  data-testid="input-photo-file"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute -bottom-1 -right-1 rounded-full w-8 h-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  data-testid="button-upload-photo"
                >
                  {isUploading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>

            <Card>
              <CardContent className="p-4 space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter pet name" {...field} data-testid="input-pet-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="species"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Species *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-species">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="dog">Dog</SelectItem>
                            <SelectItem value="cat">Cat</SelectItem>
                            <SelectItem value="bird">Bird</SelectItem>
                            <SelectItem value="rabbit">Rabbit</SelectItem>
                            <SelectItem value="hamster">Hamster</SelectItem>
                            <SelectItem value="fish">Fish</SelectItem>
                            <SelectItem value="reptile">Reptile</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="gender"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Gender</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl>
                            <SelectTrigger data-testid="select-gender">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="male">Male</SelectItem>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="unknown">Unknown</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="breed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Breed</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Golden Retriever" {...field} value={field.value || ""} data-testid="input-breed" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dateOfBirth"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Date of Birth</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} data-testid="input-dob" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (Lbs)</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.1" placeholder="e.g., 12.5" {...field} data-testid="input-weight" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Golden" {...field} value={field.value || ""} data-testid="input-color" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="microchipId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Microchip ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter microchip ID" {...field} value={field.value || ""} data-testid="input-microchip" />
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
                          placeholder="Any additional notes about your pet..."
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
              data-testid="button-save-pet"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isEdit ? "Updating..." : "Adding..."}
                </>
              ) : (
                isEdit ? "Update Pet" : "Add Pet"
              )}
            </Button>
          </form>
        </Form>
      </main>

      <BottomNavigation />
    </div>
  );
}
