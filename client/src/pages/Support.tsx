import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  HelpCircle,
  FileText,
  Shield,
  PawPrint,
  Send,
  ExternalLink
} from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import appIcon from "@assets/FurryA1_1766761740789.png";

export default function Support() {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const appName = "Furry Assistant 1";
  const contactEmail = "support@furryassistant1.com";
  const appVersion = "1.0.0";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.email || !formData.message) {
      toast({ 
        title: "Please fill in required fields", 
        variant: "destructive" 
      });
      return;
    }

    setIsSubmitting(true);
    
    const mailtoLink = `mailto:${contactEmail}?subject=${encodeURIComponent(formData.subject || "Support Request")}&body=${encodeURIComponent(
      `Name: ${formData.name || "Not provided"}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}\n\n---\nApp Version: ${appVersion}`
    )}`;
    
    window.location.href = mailtoLink;
    
    toast({ title: "Opening email client..." });
    setIsSubmitting(false);
  };

  const faqItems = [
    {
      question: "How do I add a new pet?",
      answer: "Go to the Pets tab and tap the '+' button. Fill in your pet's details including name, species, breed, and photo."
    },
    {
      question: "How do I set up medication reminders?",
      answer: "Navigate to the Health section, select Medications, and add a new medication. You can set the frequency and reminder times."
    },
    {
      question: "Is my data secure?",
      answer: "Yes! We use encryption to protect your data both in transit and at rest. Your pet information is stored securely on our servers."
    },
    {
      question: "Is the app really free?",
      answer: "Yes — every feature is 100% free, with no paid tiers or hidden fees. There's no subscription to manage or cancel."
    },
    {
      question: "Can I use the app offline?",
      answer: "Basic features work offline. Your data will sync automatically when you're back online."
    },
    {
      question: "How do I share my pet's profile?",
      answer: "Go to your pet's profile and tap the Share button. You can generate a QR code or share directly to social media."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-heading font-semibold text-lg">Support</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="text-center mb-8">
          <img 
            src={appIcon} 
            alt={appName}
            className="w-20 h-20 mx-auto mb-4 rounded-2xl shadow-lg"
          />
          <h2 className="text-2xl font-bold font-heading mb-2">{appName} Support</h2>
          <p className="text-muted-foreground">We're here to help you and your furry friends!</p>
        </div>

        <Card data-testid="about-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PawPrint className="w-5 h-5" />
              About {appName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-foreground">
            <p>
              <strong>{appName}</strong> is a free, all-in-one pet care web app that helps owners track their
              pets' health, medications, walks, nutrition, expenses, and more. We built it because pet owners
              deserve a single place to manage everything about their furry friends — without paywalls, without
              juggling five different apps, and without giving up their data.
            </p>
            <p>
              The app is owned and operated by an independent publisher and is hosted on{" "}
              <a
                href="https://replit.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                Replit
              </a>
              . It is supported by advertising (Google AdSense) so that every feature can remain free for
              every user.
            </p>
            <p>
              For questions, feedback, or partnership inquiries, please use the contact form below or email us
              directly at{" "}
              <a href={`mailto:${contactEmail}`} className="text-primary underline">
                {contactEmail}
              </a>
              .
            </p>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="text-center">
            <CardContent className="p-6">
              <Mail className="w-10 h-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Email Us</h3>
              <a 
                href={`mailto:${contactEmail}`} 
                className="text-sm text-primary underline"
                data-testid="link-email"
              >
                {contactEmail}
              </a>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <MessageCircle className="w-10 h-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">Response Time</h3>
              <p className="text-sm text-muted-foreground">Within 24-48 hours</p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="p-6">
              <PawPrint className="w-10 h-10 mx-auto mb-3 text-primary" />
              <h3 className="font-semibold mb-1">App Version</h3>
              <p className="text-sm text-muted-foreground">{appVersion}</p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="contact-form">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Contact Us
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="Your name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    data-testid="input-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your@email.com"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    data-testid="input-email"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="What can we help you with?"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  data-testid="input-subject"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message *</Label>
                <Textarea
                  id="message"
                  placeholder="Describe your issue or question in detail..."
                  rows={5}
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  data-testid="input-message"
                />
              </div>
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                data-testid="button-submit"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSubmitting ? "Opening Email..." : "Send Message"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card data-testid="faq-section">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Frequently Asked Questions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqItems.map((item, index) => (
              <div key={index} className="border-b border-border last:border-0 pb-4 last:pb-0">
                <h4 className="font-medium mb-1">{item.question}</h4>
                <p className="text-sm text-muted-foreground">{item.answer}</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card data-testid="legal-links">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Legal Documents
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/privacy">
              <Button variant="outline" className="w-full justify-between" data-testid="link-privacy">
                <span className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Privacy Policy
                </span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/terms">
              <Button variant="outline" className="w-full justify-between" data-testid="link-terms">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Terms of Service
                </span>
                <ExternalLink className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6 text-center">
            <PawPrint className="w-12 h-12 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-2">Love {appName}?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Please rate us on the App Store or Google Play! Your feedback helps us improve and helps other pet owners find us.
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
