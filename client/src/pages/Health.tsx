import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Heart, Plus, FileText, Pill, Calendar, 
  Clock, ChevronRight, Stethoscope
} from "lucide-react";
import { Link } from "wouter";
import type { HealthRecord, Medication, Pet } from "@shared/schema";

function HealthRecordCard({ record, petName }: { record: HealthRecord; petName?: string }) {
  return (
    <Link href={`/health/records/${record.id}`} aria-label={`View health record: ${record.title}`}>
      <Card 
        className="hover-elevate cursor-pointer" 
        data-testid={`health-record-${record.id}`}
        role="article"
        aria-label={`${record.title}, ${record.recordType}${petName ? ` for ${petName}` : ''}, ${record.date}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0" aria-hidden="true">
              <FileText className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-medium truncate">{record.title}</h3>
                <Badge variant="secondary" className="text-xs">
                  {record.recordType}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {record.description || "No description"}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                {petName && <span>{petName}</span>}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {record.date}
                </span>
                {record.veterinarian && (
                  <span className="flex items-center gap-1">
                    <Stethoscope className="w-3 h-3" />
                    {record.veterinarian}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </div>
          {record.photos && record.photos.length > 0 && (
            <div className="flex gap-2 mt-3">
              {record.photos.slice(0, 4).map((photo, idx) => (
                <div key={idx} className="w-12 h-12 rounded-md bg-muted overflow-hidden">
                  <img src={photo} alt="" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function MedicationCard({ medication, petName }: { medication: Medication; petName?: string }) {
  const statusText = medication.isActive ? "Active" : "Completed";
  return (
    <Link href={`/health/medications/${medication.id}`} aria-label={`View medication: ${medication.name}`}>
      <Card 
        className="hover-elevate cursor-pointer" 
        data-testid={`medication-${medication.id}`}
        role="article"
        aria-label={`${medication.name}, ${statusText}, ${medication.dosage}, ${medication.frequency}${petName ? ` for ${petName}` : ''}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0" aria-hidden="true">
              <Pill className="w-5 h-5 text-chart-2" aria-hidden="true" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-medium truncate">{medication.name}</h3>
                {medication.isActive ? (
                  <Badge className="text-xs bg-chart-3/20 text-chart-3">Active</Badge>
                ) : (
                  <Badge variant="secondary" className="text-xs">Completed</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {medication.dosage} - {medication.frequency}
              </p>
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                {petName && <span>{petName}</span>}
                {medication.startDate && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Started {medication.startDate}
                  </span>
                )}
                {medication.refillDate && (
                  <span className="flex items-center gap-1 text-primary">
                    Refill: {medication.refillDate}
                  </span>
                )}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Health() {
  const { data: pets } = useQuery<Pet[]>({
    queryKey: ["/api/pets"],
  });

  const { data: healthRecords, isLoading: recordsLoading } = useQuery<HealthRecord[]>({
    queryKey: ["/api/health-records"],
  });

  const { data: medications, isLoading: medsLoading } = useQuery<Medication[]>({
    queryKey: ["/api/medications"],
  });

  const petMap = new Map(pets?.map(p => [p.id, p.name]) || []);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <h1 className="font-heading font-semibold text-lg">Health</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        <Tabs defaultValue="records" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="records" data-testid="tab-records">
              <FileText className="w-4 h-4 mr-2" />
              Records
            </TabsTrigger>
            <TabsTrigger value="medications" data-testid="tab-medications">
              <Pill className="w-4 h-4 mr-2" />
              Medications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="records" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" asChild data-testid="button-add-record">
                <Link href="/health/records/new">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Record
                </Link>
              </Button>
            </div>

            {recordsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : healthRecords && healthRecords.length > 0 ? (
              <div className="space-y-4">
                {healthRecords.map((record) => (
                  <HealthRecordCard 
                    key={record.id} 
                    record={record} 
                    petName={petMap.get(record.petId)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed" data-testid="empty-records">
                <CardContent className="p-8 text-center">
                  <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">No health records</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Start tracking vet visits, vaccinations, and more
                  </p>
                  <Button asChild>
                    <Link href="/health/records/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Record
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="medications" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" asChild data-testid="button-add-medication">
                <Link href="/health/medications/new">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Medication
                </Link>
              </Button>
            </div>

            {medsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : medications && medications.length > 0 ? (
              <div className="space-y-4">
                {medications.map((med) => (
                  <MedicationCard 
                    key={med.id} 
                    medication={med}
                    petName={petMap.get(med.petId)}
                  />
                ))}
              </div>
            ) : (
              <Card className="border-dashed" data-testid="empty-medications">
                <CardContent className="p-8 text-center">
                  <Pill className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">No medications</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Track medications with dosage and refill reminders
                  </p>
                  <Button asChild>
                    <Link href="/health/medications/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Medication
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>

      <BottomNavigation />
    </div>
  );
}
