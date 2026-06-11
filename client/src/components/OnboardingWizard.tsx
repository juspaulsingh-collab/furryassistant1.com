import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PawPrint, Sparkles, Heart, Activity, Loader2, ArrowRight, ArrowLeft, X } from "lucide-react";

interface OnboardingWizardProps {
  open: boolean;
  onClose: () => void;
}

const STORAGE_KEY = "furry-onboarding-completed";

export function hasCompletedOnboarding(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function markOnboardingCompleted() {
  try {
    localStorage.setItem(STORAGE_KEY, "true");
  } catch {
    /* ignore */
  }
}

export function OnboardingWizard({ open, onClose }: OnboardingWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState("");
  const [species, setSpecies] = useState("");
  const [breed, setBreed] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!open) {
      setStep(0);
      setName("");
      setSpecies("");
      setBreed("");
    }
  }, [open]);

  const createPet = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/pets", {
        name: name.trim(),
        species,
        breed: breed.trim() || undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pets"] });
      markOnboardingCompleted();
      toast({ title: `Welcome, ${name}! 🐾`, description: "Your first pet is added. Explore the app to log activities, health records, and more." });
      onClose();
    },
    onError: (err: any) => {
      toast({ title: "Could not add pet", description: err?.message || "Try again", variant: "destructive" });
    },
  });

  const handleSkip = () => {
    markOnboardingCompleted();
    onClose();
  };

  const handleDismiss = () => {
    // Closing via backdrop/Escape only closes; doesn't permanently dismiss.
    // User can re-trigger by reloading. Explicit Skip persists.
    onClose();
  };

  const totalSteps = 4;
  const progress = ((step + 1) / totalSteps) * 100;

  const canAdvance = () => {
    if (step === 1) return name.trim().length > 0 && species.length > 0;
    return true;
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && !createPet.isPending) handleDismiss(); }}>
      <DialogContent className="max-w-md" data-testid="dialog-onboarding">
        <button
          onClick={handleSkip}
          disabled={createPet.isPending}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Skip onboarding"
          data-testid="button-skip-onboarding"
        >
          <X className="w-4 h-4" />
        </button>

        <Progress value={progress} className="h-1 mb-2" />

        {/* Step 0: Welcome */}
        {step === 0 && (
          <>
            <DialogHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <PawPrint className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-2xl font-heading">Welcome to Furry Assistant 1!</DialogTitle>
              <DialogDescription className="text-center">
                Let's set up your pet profile in under a minute. We'll guide you through the basics.
              </DialogDescription>
            </DialogHeader>
            <ul className="space-y-3 my-4 text-sm">
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Track health records, medications, and vet visits</span>
              </li>
              <li className="flex items-start gap-3">
                <Activity className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Log walks, activities, nutrition, and more</span>
              </li>
              <li className="flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <span>Get AI-powered care advice 24/7</span>
              </li>
            </ul>
            <DialogFooter className="flex-col sm:flex-col gap-2">
              <Button onClick={() => setStep(1)} className="w-full" data-testid="button-onboarding-start">
                Let's go <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
              <Button variant="ghost" onClick={handleSkip} className="w-full" data-testid="button-onboarding-skip-welcome">
                Skip for now
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 1: Pet basics */}
        {step === 1 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">Tell us about your pet</DialogTitle>
              <DialogDescription>
                Just the basics — you can add photos and more details later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 my-4">
              <div className="space-y-1.5">
                <Label htmlFor="onboarding-name">Pet's name *</Label>
                <Input
                  id="onboarding-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Bella"
                  autoFocus
                  data-testid="input-onboarding-name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="onboarding-species">Species *</Label>
                <Select value={species} onValueChange={setSpecies}>
                  <SelectTrigger id="onboarding-species" data-testid="select-onboarding-species">
                    <SelectValue placeholder="Select species" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Dog">🐕 Dog</SelectItem>
                    <SelectItem value="Cat">🐈 Cat</SelectItem>
                    <SelectItem value="Bird">🦜 Bird</SelectItem>
                    <SelectItem value="Rabbit">🐇 Rabbit</SelectItem>
                    <SelectItem value="Hamster">🐹 Hamster</SelectItem>
                    <SelectItem value="Fish">🐠 Fish</SelectItem>
                    <SelectItem value="Reptile">🦎 Reptile</SelectItem>
                    <SelectItem value="Other">🐾 Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="onboarding-breed">Breed (optional)</Label>
                <Input
                  id="onboarding-breed"
                  value={breed}
                  onChange={(e) => setBreed(e.target.value)}
                  placeholder="e.g. Golden Retriever"
                  data-testid="input-onboarding-breed"
                />
              </div>
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="ghost" onClick={() => setStep(0)} className="sm:flex-1" data-testid="button-onboarding-back-1">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canAdvance()}
                className="sm:flex-1"
                data-testid="button-onboarding-next-1"
              >
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Quick tour */}
        {step === 2 && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-heading">A quick tour</DialogTitle>
              <DialogDescription>
                Here's where to find the main features.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 my-4">
              <TourItem emoji="🏠" title="Home" desc="Dashboard with reminders and quick stats" />
              <TourItem emoji="🐾" title="Pets" desc="Manage profiles for all your pets" />
              <TourItem emoji="🏃" title="Activities" desc="Log walks, playtime, and GPS tracking" />
              <TourItem emoji="❤️" title="Health" desc="Records, medications, vaccinations" />
              <TourItem emoji="✨" title="AI Assistant" desc="Ask anything about pet care" />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="ghost" onClick={() => setStep(1)} className="sm:flex-1" data-testid="button-onboarding-back-2">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button onClick={() => setStep(3)} className="sm:flex-1" data-testid="button-onboarding-next-2">
                Continue <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <>
            <DialogHeader>
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <DialogTitle className="text-center text-xl font-heading">You're all set!</DialogTitle>
              <DialogDescription className="text-center">
                We'll create <span className="font-semibold text-foreground">{name}</span>'s profile now.
                You can add a photo, weight, and more details from the pet's profile page.
              </DialogDescription>
            </DialogHeader>
            <div className="rounded-lg bg-muted/50 p-4 my-4 text-sm">
              <p><span className="text-muted-foreground">Name: </span><span className="font-medium">{name}</span></p>
              <p><span className="text-muted-foreground">Species: </span><span className="font-medium">{species}</span></p>
              {breed && <p><span className="text-muted-foreground">Breed: </span><span className="font-medium">{breed}</span></p>}
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button variant="ghost" onClick={() => setStep(2)} className="sm:flex-1" disabled={createPet.isPending} data-testid="button-onboarding-back-3">
                <ArrowLeft className="w-4 h-4 mr-1" /> Back
              </Button>
              <Button
                onClick={() => createPet.mutate()}
                disabled={createPet.isPending}
                className="sm:flex-1"
                data-testid="button-onboarding-finish"
              >
                {createPet.isPending ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</>
                ) : (
                  <>Create Profile <PawPrint className="w-4 h-4 ml-2" /></>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function TourItem({ emoji, title, desc }: { emoji: string; title: string; desc: string }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40">
      <span className="text-2xl shrink-0">{emoji}</span>
      <div>
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}
