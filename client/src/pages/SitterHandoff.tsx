import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Printer, PawPrint, Phone, Heart, Pill, AlertCircle, User as UserIcon } from "lucide-react";
import type { Pet, Medication, HealthRecord, EmergencyContact, User } from "@shared/schema";
import { format, parseISO, differenceInYears, differenceInMonths } from "date-fns";

function formatAge(dob: string | null | undefined): string {
  if (!dob) return "Unknown";
  try {
    const date = parseISO(dob);
    const years = differenceInYears(new Date(), date);
    if (years >= 1) return `${years} year${years !== 1 ? "s" : ""} old`;
    const months = differenceInMonths(new Date(), date);
    return `${months} month${months !== 1 ? "s" : ""} old`;
  } catch {
    return "Unknown";
  }
}

export default function SitterHandoff() {
  const [, params] = useRoute("/pets/:id/handoff");
  const parsedId = params?.id ? parseInt(params.id, 10) : NaN;
  const petId = Number.isFinite(parsedId) ? parsedId : null;

  useEffect(() => {
    document.title = "Pet Sitter Handoff | Furry Assistant 1";
  }, []);

  const { data: pet, isLoading: petLoading } = useQuery<Pet>({
    queryKey: ["/api/pets", petId],
    enabled: !!petId,
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const { data: medications = [] } = useQuery<Medication[]>({
    queryKey: [`/api/pets/${petId}/medications`],
    enabled: !!petId,
  });

  const { data: healthRecords = [] } = useQuery<HealthRecord[]>({
    queryKey: [`/api/pets/${petId}/health-records`],
    enabled: !!petId,
  });

  const { data: emergencyContacts = [] } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });

  const handlePrint = () => {
    window.print();
  };

  if (petLoading) {
    return (
      <div className="min-h-screen bg-background p-4 max-w-3xl mx-auto">
        <Skeleton className="h-12 w-full mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Pet not found</p>
            <Button asChild>
              <Link href="/pets">Back to Pets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeMeds = medications.filter((m) => m.isActive);
  const recentVet = healthRecords
    .filter((r) => r.veterinarian || r.clinic)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  const recentVaccinations = healthRecords
    .filter((r) => r.recordType === "vaccination")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);
  const ownerName = user ? [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email : "";

  return (
    <div className="min-h-screen bg-background pb-12">
      {/* Top toolbar - hidden in print */}
      <div className="print:hidden sticky top-0 z-40 bg-background/95 backdrop-blur border-b">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <Button variant="ghost" size="sm" asChild data-testid="button-back">
            <Link href={`/pets/${petId}`}>
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Link>
          </Button>
          <Button onClick={handlePrint} size="sm" data-testid="button-print-handoff">
            <Printer className="w-4 h-4 mr-2" />
            Print / Save as PDF
          </Button>
        </div>
      </div>

      {/* Print intro - hidden in print */}
      <div className="print:hidden max-w-3xl mx-auto px-4 pt-6">
        <h1 className="font-heading font-bold text-2xl mb-1">Pet Sitter Handoff Sheet</h1>
        <p className="text-sm text-muted-foreground mb-4">
          A printable one-page summary you can hand to a sitter, family member, or boarding facility. Use the button above to print or save as a PDF.
        </p>
      </div>

      {/* Printable area */}
      <main className="max-w-3xl mx-auto px-4 py-6 print:py-0 print:px-6 print:max-w-none" id="handoff-print-area">
        <div className="border rounded-lg p-6 print:border-0 print:p-0 bg-card text-card-foreground print:bg-white print:text-black">
          {/* Header */}
          <header className="flex items-start gap-4 pb-4 border-b mb-4">
            <Avatar className="w-20 h-20 print:w-16 print:h-16 border">
              <AvatarImage src={pet.photoUrl || undefined} alt={pet.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {pet.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-muted-foreground print:text-gray-600 mb-1">
                <PawPrint className="w-3 h-3" />
                Pet Sitter Handoff Sheet
              </div>
              <h1 className="font-heading font-bold text-3xl print:text-2xl" data-testid="text-handoff-name">{pet.name}</h1>
              <p className="text-sm text-muted-foreground print:text-gray-700">
                {pet.breed ? `${pet.breed} • ` : ""}{pet.species}
                {pet.gender ? ` • ${pet.gender}` : ""}
                {pet.dateOfBirth ? ` • ${formatAge(pet.dateOfBirth)}` : ""}
              </p>
            </div>
            <div className="text-right text-xs text-muted-foreground print:text-gray-600">
              <p>Generated</p>
              <p>{format(new Date(), "MMM d, yyyy")}</p>
            </div>
          </header>

          {/* Quick facts grid */}
          <section className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <Fact label="Weight" value={pet.weight ? `${pet.weight} lb` : "—"} />
            <Fact label="Color" value={pet.color || "—"} />
            <Fact label="Microchip ID" value={pet.microchipId || "—"} />
            <Fact label="Date of Birth" value={pet.dateOfBirth ? format(parseISO(pet.dateOfBirth), "MMM d, yyyy") : "—"} />
          </section>

          {/* Owner contact */}
          <Section icon={UserIcon} title="Owner Contact">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-muted-foreground print:text-gray-600">Name: </span>
                <span className="font-medium" data-testid="text-handoff-owner-name">{ownerName || "—"}</span>
              </div>
              <div>
                <span className="text-muted-foreground print:text-gray-600">Email: </span>
                <span className="font-medium">{user?.email || "—"}</span>
              </div>
            </div>
          </Section>

          {/* Veterinarian */}
          <Section icon={Heart} title="Primary Veterinarian">
            {recentVet ? (
              <div className="text-sm space-y-1">
                {recentVet.veterinarian && (
                  <p><span className="text-muted-foreground print:text-gray-600">Vet: </span><span className="font-medium">{recentVet.veterinarian}</span></p>
                )}
                {recentVet.clinic && (
                  <p><span className="text-muted-foreground print:text-gray-600">Clinic: </span><span className="font-medium">{recentVet.clinic}</span></p>
                )}
                <p className="text-xs text-muted-foreground print:text-gray-600">From most recent health record on {format(parseISO(recentVet.date), "MMM d, yyyy")}</p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground print:text-gray-600">No vet on file. Add a health record with vet details to populate this section.</p>
            )}
          </Section>

          {/* Emergency contacts */}
          <Section icon={Phone} title="Emergency Contacts">
            {emergencyContacts.length > 0 ? (
              <ul className="text-sm space-y-2">
                {emergencyContacts.slice(0, 5).map((c) => (
                  <li key={c.id} className="flex flex-wrap gap-x-3 gap-y-1" data-testid={`handoff-contact-${c.id}`}>
                    <span className="font-medium">{c.name}</span>
                    {c.contactType && <span className="text-muted-foreground print:text-gray-600">({c.contactType})</span>}
                    {c.phone && <span className="font-mono text-sm">{c.phone}</span>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground print:text-gray-600">No emergency contacts saved.</p>
            )}
          </Section>

          {/* Medications */}
          <Section icon={Pill} title={`Active Medications${activeMeds.length ? ` (${activeMeds.length})` : ""}`}>
            {activeMeds.length > 0 ? (
              <ul className="text-sm space-y-3">
                {activeMeds.map((m) => (
                  <li key={m.id} className="border-l-2 border-primary print:border-gray-400 pl-3" data-testid={`handoff-med-${m.id}`}>
                    <p className="font-semibold">{m.name}{m.dosage ? ` — ${m.dosage}` : ""}</p>
                    {m.frequency && <p className="text-muted-foreground print:text-gray-700">Frequency: {m.frequency}</p>}
                    {m.instructions && <p className="text-xs mt-1">{m.instructions}</p>}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground print:text-gray-600">No active medications.</p>
            )}
          </Section>

          {/* Recent vaccinations */}
          {recentVaccinations.length > 0 && (
            <Section icon={Heart} title="Recent Vaccinations">
              <ul className="text-sm space-y-1">
                {recentVaccinations.map((v) => (
                  <li key={v.id} className="flex justify-between gap-3">
                    <span>{v.title}</span>
                    <span className="text-muted-foreground print:text-gray-600 text-xs">{format(parseISO(v.date), "MMM d, yyyy")}</span>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* Care notes */}
          {pet.notes && (
            <Section icon={AlertCircle} title="Important Care Notes">
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{pet.notes}</p>
            </Section>
          )}

          {/* Footer */}
          <footer className="mt-6 pt-4 border-t text-xs text-muted-foreground print:text-gray-600 text-center">
            Generated by Furry Assistant 1 — your complete pet care companion. Visit furryassistant1.com
          </footer>
        </div>
      </main>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="border rounded-md p-2 print:border-gray-300">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground print:text-gray-600">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}

function Section({ icon: Icon, title, children }: { icon: typeof PawPrint; title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 print:break-inside-avoid">
      <h2 className="flex items-center gap-2 font-heading font-semibold text-base mb-2 pb-1 border-b">
        <Icon className="w-4 h-4 text-primary print:text-black" />
        {title}
      </h2>
      <div>{children}</div>
    </section>
  );
}
