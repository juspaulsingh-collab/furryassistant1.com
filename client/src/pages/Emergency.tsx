import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  Phone, Plus, ArrowLeft, MapPin, Star, AlertTriangle,
  Heart, BookOpen, ChevronRight
} from "lucide-react";
import { Link, useLocation } from "wouter";
import type { EmergencyContact, FirstAidGuide } from "@shared/schema";

const contactTypeIcons: Record<string, typeof Phone> = {
  veterinarian: Heart,
  emergency_vet: AlertTriangle,
  poison_control: AlertTriangle,
  pet_sitter: Star,
  groomer: Star,
  other: Phone,
};

function EmergencyContactCard({ contact }: { contact: EmergencyContact }) {
  const Icon = contactTypeIcons[contact.contactType] || Phone;
  
  return (
    <Card data-testid={`contact-${contact.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h3 className="font-medium">{contact.name}</h3>
              {contact.isPrimary && (
                <Badge className="bg-primary/20 text-primary text-xs">Primary</Badge>
              )}
            </div>
            <Badge variant="secondary" className="text-xs capitalize mb-2">
              {contact.contactType.replace(/_/g, ' ')}
            </Badge>
            {contact.phone && (
              <p className="text-sm flex items-center gap-1">
                <Phone className="w-3 h-3" />
                <a href={`tel:${contact.phone}`} className="text-primary">
                  {contact.phone}
                </a>
              </p>
            )}
            {contact.address && (
              <p className="text-sm text-muted-foreground flex items-start gap-1 mt-1">
                <MapPin className="w-3 h-3 shrink-0 mt-0.5" />
                {contact.address}
              </p>
            )}
            {contact.notes && (
              <p className="text-sm text-muted-foreground mt-2">{contact.notes}</p>
            )}
          </div>
        </div>
        {contact.phone && (
          <Button className="w-full mt-3" asChild data-testid={`call-${contact.id}`}>
            <a href={`tel:${contact.phone}`}>
              <Phone className="w-4 h-4 mr-2" />
              Call Now
            </a>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

const severityColors: Record<string, string> = {
  low: "bg-chart-3/20 text-chart-3",
  moderate: "bg-chart-5/20 text-chart-5",
  severe: "bg-destructive/20 text-destructive",
};

function FirstAidGuideCard({ guide }: { guide: FirstAidGuide }) {
  return (
    <Link href={`/emergency/guides/${guide.id}`}>
      <Card className="hover-elevate cursor-pointer" data-testid={`guide-${guide.id}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-chart-2/10 flex items-center justify-center shrink-0">
              <BookOpen className="w-5 h-5 text-chart-2" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h3 className="font-medium">{guide.title}</h3>
                {guide.severity && (
                  <Badge className={severityColors[guide.severity] || ""}>
                    {guide.severity}
                  </Badge>
                )}
              </div>
              <Badge variant="secondary" className="text-xs">{guide.category}</Badge>
              {guide.symptoms && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                  {guide.symptoms}
                </p>
              )}
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Emergency() {
  const [, navigate] = useLocation();

  const { data: contacts, isLoading: contactsLoading } = useQuery<EmergencyContact[]>({
    queryKey: ["/api/emergency-contacts"],
  });

  const { data: guides, isLoading: guidesLoading } = useQuery<FirstAidGuide[]>({
    queryKey: ["/api/first-aid-guides"],
  });

  const primaryContacts = contacts?.filter(c => c.isPrimary) || [];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/more")} data-testid="button-back">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="font-heading font-semibold text-lg flex-1">Emergency</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {primaryContacts.length > 0 && (
          <Card className="mb-6 border-destructive/20 bg-destructive/5">
            <CardContent className="p-4">
              <h2 className="font-medium flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                Quick Emergency Contacts
              </h2>
              <div className="space-y-2">
                {primaryContacts.map((contact) => (
                  <Button 
                    key={contact.id}
                    variant="outline" 
                    className="w-full justify-start"
                    asChild
                  >
                    <a href={`tel:${contact.phone}`}>
                      <Phone className="w-4 h-4 mr-2" />
                      {contact.name}
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="contacts" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="contacts" data-testid="tab-contacts">
              <Phone className="w-4 h-4 mr-1" />
              Contacts
            </TabsTrigger>
            <TabsTrigger value="guides" data-testid="tab-guides">
              <BookOpen className="w-4 h-4 mr-1" />
              First Aid
            </TabsTrigger>
          </TabsList>

          <TabsContent value="contacts" className="space-y-4">
            <div className="flex justify-end">
              <Button size="sm" asChild data-testid="button-add-contact">
                <Link href="/emergency/contacts/new">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Contact
                </Link>
              </Button>
            </div>

            {contactsLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-32 w-full" />
                <Skeleton className="h-32 w-full" />
              </div>
            ) : contacts && contacts.length > 0 ? (
              <div className="space-y-4">
                {contacts.map((contact) => (
                  <EmergencyContactCard key={contact.id} contact={contact} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed" data-testid="empty-contacts">
                <CardContent className="p-8 text-center">
                  <Phone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">No emergency contacts</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add your vet and emergency numbers for quick access
                  </p>
                  <Button asChild>
                    <Link href="/emergency/contacts/new">
                      <Plus className="w-4 h-4 mr-2" />
                      Add First Contact
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="guides" className="space-y-4">
            {guidesLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            ) : guides && guides.length > 0 ? (
              <div className="space-y-4">
                {guides.map((guide) => (
                  <FirstAidGuideCard key={guide.id} guide={guide} />
                ))}
              </div>
            ) : (
              <Card className="border-dashed" data-testid="empty-guides">
                <CardContent className="p-8 text-center">
                  <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                  <h3 className="font-medium mb-1">No first aid guides</h3>
                  <p className="text-sm text-muted-foreground">
                    First aid guides will be available soon
                  </p>
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
