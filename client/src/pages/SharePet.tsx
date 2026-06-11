import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, 
  Share2, 
  Download,
  Copy,
  Check,
  PawPrint
} from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import type { Pet } from "@shared/schema";

export default function SharePet() {
  const [, params] = useRoute("/pets/:id/share");
  const petId = params?.id ? parseInt(params.id) : null;
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const { data: pet, isLoading } = useQuery<Pet>({
    queryKey: ["/api/pets", petId],
    enabled: !!petId,
  });

  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = pet 
    ? `Meet ${pet.name}! Check out Furry Assistant 1 - the best app to manage your pet's health and care.`
    : "Check out Furry Assistant 1 - the best app for pet care!";

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      toast({ title: "Link copied!" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Failed to copy", variant: "destructive" });
    }
  };

  const shareNative = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Meet ${pet?.name || 'my pet'}!`,
          text: shareText,
          url: appUrl,
        });
      } catch {
      }
    } else {
      copyToClipboard();
    }
  };

  const socialLinks = [
    {
      name: "Facebook",
      icon: SiFacebook,
      color: "bg-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}&quote=${encodeURIComponent(shareText)}`,
    },
    {
      name: "X",
      icon: SiX,
      color: "bg-black dark:bg-white dark:text-black",
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(appUrl)}`,
    },
    {
      name: "WhatsApp",
      icon: SiWhatsapp,
      color: "bg-[#25D366]",
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${appUrl}`)}`,
    },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-20">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
          <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-4">
            <Button variant="ghost" size="icon" asChild>
              <Link href={`/pets/${petId}`}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-heading font-semibold text-lg">Share Pet</h1>
          </div>
        </header>
        <main className="max-w-lg mx-auto px-4 py-6">
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="min-h-screen bg-background pb-20 flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <PawPrint className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="font-heading font-semibold text-xl mb-2">Pet not found</h2>
            <Button asChild>
              <Link href="/pets">Back to Pets</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild data-testid="button-back">
              <Link href={`/pets/${petId}`}>
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-heading font-semibold text-lg">Share {pet.name}</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div 
          ref={shareCardRef}
          className="bg-gradient-to-br from-primary/20 via-background to-primary/10 rounded-xl p-6 border"
          data-testid="pet-share-card"
        >
          <div className="text-center mb-6">
            <Avatar className="w-24 h-24 mx-auto mb-4 border-4 border-background shadow-lg">
              <AvatarImage src={pet.photoUrl || undefined} alt={pet.name} />
              <AvatarFallback className="bg-primary/10 text-primary text-3xl font-semibold">
                {pet.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h2 className="font-heading font-bold text-2xl mb-1">{pet.name}</h2>
            <div className="flex items-center justify-center gap-2 flex-wrap">
              <Badge variant="secondary">{pet.species}</Badge>
              {pet.breed && <Badge variant="outline">{pet.breed}</Badge>}
            </div>
          </div>

          <div className="bg-white rounded-lg p-4 mx-auto w-fit shadow-sm">
            <QRCodeSVG 
              value={appUrl} 
              size={140}
              level="H"
              includeMargin={false}
            />
          </div>
          
          <p className="text-center text-sm text-muted-foreground mt-4">
            Screenshot this card to share on social media!
          </p>
          <p className="text-center text-xs text-muted-foreground">
            Friends can scan the QR code to download Furry Assistant 1
          </p>
          
          <div className="flex items-center justify-center gap-2 mt-2">
            <PawPrint className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Furry Assistant 1</span>
          </div>
        </div>

        <Card data-testid="share-actions-card">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-md px-3 py-2 text-sm truncate">
                {appUrl}
              </div>
              <Button 
                size="icon" 
                variant="outline"
                onClick={copyToClipboard}
                data-testid="button-copy-link"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>

            {"share" in navigator && (
              <Button 
                className="w-full" 
                onClick={shareNative}
                data-testid="button-native-share"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share {pet.name}
              </Button>
            )}

            <div className="flex gap-2 justify-center">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`button-share-${social.name.toLowerCase()}`}
                >
                  <Button
                    size="icon"
                    className={`${social.color} text-white`}
                  >
                    <social.icon className="w-5 h-5" />
                  </Button>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-muted/50" data-testid="share-tips-card">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-2 flex items-center gap-2">
              <Share2 className="w-4 h-4" />
              How to Share
            </h3>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Take a screenshot of the card above</li>
              <li>Share it on Instagram, Facebook, or your favorite social media</li>
              <li>Friends can scan the QR code to download the app</li>
              <li>Use the buttons below to share the app link directly</li>
            </ul>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
