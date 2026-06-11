import { QRCodeSVG } from "qrcode.react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  Check,
  MessageCircle,
  Mail,
  Link as LinkIcon
} from "lucide-react";
import { SiFacebook, SiX, SiWhatsapp, SiLinkedin } from "react-icons/si";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

export default function Share() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  
  const appUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareTitle = "Furry Assistant 1 - Your Pet Care Companion";
  const shareText = "Check out Furry Assistant 1! The best app to manage your pet's health, activities, nutrition, and more.";

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
          title: shareTitle,
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
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(appUrl)}`,
    },
    {
      name: "X (Twitter)",
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
    {
      name: "LinkedIn",
      icon: SiLinkedin,
      color: "bg-[#0A66C2]",
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(appUrl)}&title=${encodeURIComponent(shareTitle)}`,
    },
    {
      name: "Email",
      icon: Mail,
      color: "bg-gray-600",
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent(`${shareText}\n\n${appUrl}`)}`,
    },
    {
      name: "SMS",
      icon: MessageCircle,
      color: "bg-green-600",
      url: `sms:?body=${encodeURIComponent(`${shareText} ${appUrl}`)}`,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" asChild data-testid="button-back">
              <Link href="/more">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <h1 className="font-heading font-semibold text-lg">Share App</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <Card data-testid="qr-code-card">
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Scan to Download</CardTitle>
            <p className="text-sm text-muted-foreground">
              Share this QR code with friends and family
            </p>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="bg-white p-4 rounded-lg">
              <QRCodeSVG 
                value={appUrl} 
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-xs text-muted-foreground text-center max-w-xs">
              Point your phone camera at this code to open Furry Assistant 1
            </p>
          </CardContent>
        </Card>

        <Card data-testid="share-link-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <LinkIcon className="w-5 h-5" />
              Share Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                Share
              </Button>
            )}
          </CardContent>
        </Card>

        <Card data-testid="social-share-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5" />
              Share on Social Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  data-testid={`button-share-${social.name.toLowerCase().replace(/[^a-z]/g, '')}`}
                >
                  <Button
                    className={`w-full ${social.color} text-white`}
                    variant="default"
                  >
                    <social.icon className="w-5 h-5" />
                  </Button>
                  <p className="text-xs text-center mt-1 text-muted-foreground">
                    {social.name}
                  </p>
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="invite-friends-card">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Share2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">
              Invite Friends & Family
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              Help other pet owners discover Furry Assistant 1! Share the app and help them take better care of their furry friends.
            </p>
            <Button asChild data-testid="button-share-pet">
              <Link href="/pets">
                Share Your Pet
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
