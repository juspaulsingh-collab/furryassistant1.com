import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { PawPrint, Plus, ChevronRight, Calendar } from "lucide-react";
import { Link } from "wouter";
import type { Pet, User } from "@shared/schema";

function calculateAge(dateOfBirth: string | null): string {
  if (!dateOfBirth) return "";
  const birth = new Date(dateOfBirth);
  const today = new Date();
  const years = today.getFullYear() - birth.getFullYear();
  const months = today.getMonth() - birth.getMonth();
  
  if (years === 0) {
    return `${months} month${months !== 1 ? 's' : ''} old`;
  } else if (years === 1 && months < 0) {
    return `${12 + months} months old`;
  }
  return `${years} year${years !== 1 ? 's' : ''} old`;
}

function PetCard({ pet }: { pet: Pet }) {
  const age = calculateAge(pet.dateOfBirth);
  const petDescription = [
    pet.breed || "Mixed breed",
    age,
    pet.weight ? `${pet.weight} kg` : null,
    pet.gender
  ].filter(Boolean).join(", ");
  
  return (
    <Link href={`/pets/${pet.id}`} aria-label={`View ${pet.name}'s profile`}>
      <Card 
        className="hover-elevate cursor-pointer" 
        data-testid={`pet-card-${pet.id}`}
        role="article"
        aria-label={`${pet.name}, ${pet.species}. ${petDescription}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={pet.photoUrl || undefined} alt={`Photo of ${pet.name}`} />
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold" aria-label={`${pet.name}'s avatar`}>
                {pet.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-heading font-semibold text-lg truncate">{pet.name}</h3>
                <Badge variant="secondary" className="text-xs">
                  {pet.species}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground truncate">
                {pet.breed || "Mixed breed"}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {age && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" aria-hidden="true" />
                    <span aria-label={`Age: ${age}`}>{age}</span>
                  </span>
                )}
                {pet.weight && (
                  <span aria-label={`Weight: ${pet.weight} kilograms`}>{pet.weight} kg</span>
                )}
                {pet.gender && (
                  <span className="capitalize" aria-label={`Gender: ${pet.gender}`}>{pet.gender}</span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0 self-center" aria-hidden="true" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Pets() {
  const { data: pets, isLoading } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  void user;

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <h1 className="font-heading font-semibold text-lg">My Pets</h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button size="sm" asChild data-testid="button-add-pet">
              <Link href="/pets/new">
                <Plus className="w-4 h-4 mr-1" />
                Add Pet
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : pets && pets.length > 0 ? (
          <div className="space-y-4">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} />
            ))}
          </div>
        ) : (
          <Card className="border-dashed" data-testid="empty-pets">
            <CardContent className="p-8 text-center">
              <PawPrint className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h2 className="font-heading font-semibold text-xl mb-2">No pets yet</h2>
              <p className="text-muted-foreground mb-6">
                Add your furry friends to start tracking their health, activities, and more.
              </p>
              <Button size="lg" asChild data-testid="button-add-first-pet">
                <Link href="/pets/new">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Pet
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
