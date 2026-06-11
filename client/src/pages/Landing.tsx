import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  PawPrint, Heart, Activity, Brain, Shield, Sparkles,
  Check, Smartphone, Download, X, MapPin, Bell,
  MessageCircle, DollarSign, Camera, Share2,
} from "lucide-react";
import appIcon from "@assets/FurryA1_1766761740789.png";

const features = [
  { icon: PawPrint, title: "Pet Profiles", description: "Store complete profiles for all your furry friends with photos and details" },
  { icon: Heart, title: "Health Tracking", description: "Keep track of vet visits, vaccinations, and health records with photo attachments" },
  { icon: Activity, title: "Activity & GPS", description: "Monitor walks and exercise with GPS tracking and customizable goals" },
  { icon: Bell, title: "Smart Reminders", description: "Never miss a dose, vet visit, or feeding with timely notifications" },
  { icon: Brain, title: "AI Nutrition Guide", description: "Get personalized meal-plan suggestions powered by AI" },
  { icon: MessageCircle, title: "AI Pet Care Chat", description: "Ask any pet care question and get helpful AI-powered guidance anytime" },
  { icon: DollarSign, title: "Expense Tracking", description: "Log and categorize all pet-related costs to manage your budget" },
  { icon: MapPin, title: "Local Services", description: "Find nearby vets, pet stores, groomers, and boarding facilities" },
  { icon: Shield, title: "Emergency Ready", description: "Quick access to emergency contacts and first-aid guides" },
  { icon: Camera, title: "Photo Memories", description: "Attach photos to records, milestones, and daily moments" },
  { icon: Share2, title: "QR Pet Sharing", description: "Share your pet's profile with sitters and family via QR code" },
  { icon: Sparkles, title: "Behavior Insights", description: "Track behaviors and get AI-powered training suggestions" },
];

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function useInstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // @ts-expect-error iOS-specific
      window.navigator.standalone === true;
    if (isStandalone) setInstalled(true);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setDeferred(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const promptInstall = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  const isIOS = typeof navigator !== "undefined" && /iPad|iPhone|iPod/.test(navigator.userAgent);

  return { canPrompt: !!deferred, promptInstall, installed, isIOS };
}

function InstallBanner() {
  const { canPrompt, promptInstall, installed, isIOS } = useInstallPrompt();
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("install-banner-dismissed") === "1";
  });

  if (installed || dismissed) return null;
  if (!canPrompt && !isIOS) return null;

  const dismiss = () => {
    sessionStorage.setItem("install-banner-dismissed", "1");
    setDismissed(true);
  };

  return (
    <div className="bg-primary text-primary-foreground" data-testid="banner-install">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
        <Smartphone className="w-5 h-5 shrink-0" />
        <div className="flex-1 text-sm">
          <span className="font-medium">Install Furry Assistant 1</span>
          <span className="hidden sm:inline ml-2 opacity-90">— add it to your home screen for the full app experience</span>
        </div>
        {canPrompt ? (
          <Button size="sm" variant="secondary" onClick={promptInstall} data-testid="button-install-app">
            <Download className="w-4 h-4 mr-1" /> Install
          </Button>
        ) : (
          <Button size="sm" variant="secondary" onClick={() => setShowIos(true)} data-testid="button-install-ios">
            How to install
          </Button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="p-1 hover:opacity-80"
          data-testid="button-dismiss-install"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
      {showIos && (
        <div className="bg-background text-foreground border-t border-border" data-testid="dialog-ios-instructions">
          <div className="max-w-7xl mx-auto px-4 py-3 text-sm">
            <p className="font-medium mb-1">Install on iPhone / iPad:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>Tap the <span className="font-medium">Share</span> button in Safari</li>
              <li>Scroll and tap <span className="font-medium">Add to Home Screen</span></li>
              <li>Tap <span className="font-medium">Add</span> — the icon will appear on your home screen</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <InstallBanner />

      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a href="#top" className="flex items-center gap-2" data-testid="link-home">
            <img src={appIcon} alt="Furry Assistant 1" className="w-9 h-9 rounded-lg" />
            <span className="font-heading font-bold text-xl hidden sm:inline">Furry Assistant 1</span>
          </a>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#features" className="hover:text-primary" data-testid="nav-features">Features</a>
            <a href="#pricing" className="hover:text-primary" data-testid="nav-pricing">Pricing</a>
            <a href="#faq" className="hover:text-primary" data-testid="nav-faq">FAQ</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="ghost" asChild data-testid="button-login">
              <a href="/login">Sign In</a>
            </Button>
            <Button asChild data-testid="button-signup-header">
              <a href="/login">Get Started</a>
            </Button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* Hero */}
        <section className="relative overflow-hidden py-16 md:py-24 bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full mb-6">
                <Sparkles className="w-4 h-4" />
                <span className="text-sm font-medium">AI-Powered Pet Care</span>
              </div>
              <h1 className="font-heading font-bold text-4xl md:text-5xl lg:text-6xl mb-6 leading-tight">
                Everything your pet needs,<br className="hidden md:block" /> in one app.
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8">
                Track health, medications, walks, nutrition, expenses, and more.
                Get AI-powered pet care guidance anytime. Built for the way modern pet parents live.
              </p>
              <div className="flex justify-center">
                <Button size="lg" className="text-lg px-8" asChild data-testid="button-get-started-hero">
                  <a href="/login">Get Started Free</a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                100% free • All features included • No credit card required
              </p>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-20">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
                One app for every part of pet care
              </h2>
              <p className="text-muted-foreground text-lg">
                From everyday routines to emergencies — Furry Assistant 1 keeps your pet's whole life organized.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <Card key={index} className="hover-elevate" data-testid={`feature-card-${index}`}>
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground text-sm">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing — fully free */}
        <section id="pricing" className="py-16 md:py-20 bg-muted/40">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-green-500/15 text-green-700 dark:text-green-400 hover:bg-green-500/15">
                <Sparkles className="w-3 h-3 mr-1" /> 100% Free
              </Badge>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
                Every feature. Free for everyone.
              </h2>
              <p className="text-muted-foreground text-lg">
                No paid tiers, no hidden fees, no credit card. Just sign up and start caring for your pets.
              </p>
            </div>

            <Card className="border-primary/30 border-2 shadow-lg bg-gradient-to-br from-primary/5 via-chart-3/5 to-chart-4/5" data-testid="plan-card-free">
              <CardContent className="p-8">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="font-heading font-semibold text-2xl mb-1">Free Forever</h3>
                  <p className="text-muted-foreground text-sm mb-4">Everything included, no upsells</p>
                  <div>
                    <span className="text-5xl font-bold">$0</span>
                    <span className="text-muted-foreground"> / forever</span>
                  </div>
                </div>

                <ul className="grid sm:grid-cols-2 gap-3 text-sm mb-8">
                  {[
                    "Unlimited pets",
                    "Health & medication tracking",
                    "Activity & GPS logging",
                    "AI nutrition meal plans",
                    "AI behavior insights",
                    "AI pet care chat 24/7",
                    "Expense tracking",
                    "Smart reminders",
                    "Sitter handoff PDF",
                    "QR code pet sharing",
                    "Local vet & service finder",
                    "Emergency contacts & first aid",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>

                <Button size="lg" className="w-full text-base" asChild data-testid="button-choose-free">
                  <a href="/login">Get Started Free</a>
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-3">
                  No credit card required · Cancel any time (there's nothing to cancel!)
                </p>
              </CardContent>
            </Card>

            <p className="text-center text-sm text-muted-foreground mt-6">
              💛 If you love the app, the best way to support us is to tell a friend.
            </p>
          </div>
        </section>

        {/* Install on phone */}
        <section className="py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-4">
            <Card className="overflow-hidden">
              <CardContent className="p-8 md:p-12 grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">
                    <Smartphone className="w-3 h-3 mr-1" /> Works on Every Device
                  </Badge>
                  <h2 className="font-heading font-bold text-2xl md:text-3xl mb-4">
                    Install it like a real app
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    Add Furry Assistant 1 to your phone's home screen and it works exactly
                    like an app from the app store — full-screen, fast, and right at your fingertips.
                  </p>
                  <div className="space-y-4 text-sm">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">1</div>
                      <div>
                        <p className="font-semibold">On iPhone / iPad</p>
                        <p className="text-muted-foreground">Open in Safari → tap Share → Add to Home Screen</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">2</div>
                      <div>
                        <p className="font-semibold">On Android</p>
                        <p className="text-muted-foreground">Open in Chrome → tap menu → Install App (or accept the prompt)</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">3</div>
                      <div>
                        <p className="font-semibold">An icon appears on your home screen</p>
                        <p className="text-muted-foreground">Tap it any time — just like a regular app</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-64 h-[28rem] rounded-[2.5rem] border-8 border-foreground/80 bg-background shadow-2xl overflow-hidden flex flex-col">
                      <div className="h-6 bg-foreground/80" />
                      <div className="flex-1 bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-950/40 dark:to-background p-4 grid grid-cols-3 gap-3 content-start">
                        <div className="aspect-square rounded-xl bg-white/40 dark:bg-white/5" />
                        <div className="aspect-square rounded-xl bg-white/40 dark:bg-white/5" />
                        <div className="aspect-square rounded-xl bg-white/40 dark:bg-white/5" />
                        <div className="aspect-square rounded-xl bg-white/40 dark:bg-white/5" />
                        <div className="aspect-square rounded-xl bg-primary flex items-center justify-center shadow-lg ring-2 ring-primary/40">
                          <img src={appIcon} alt="App icon" className="w-full h-full object-cover rounded-xl" />
                        </div>
                        <div className="aspect-square rounded-xl bg-white/40 dark:bg-white/5" />
                        <div className="aspect-square rounded-xl bg-white/40 dark:bg-white/5" />
                        <div className="aspect-square rounded-xl bg-white/40 dark:bg-white/5" />
                        <div className="aspect-square rounded-xl bg-white/40 dark:bg-white/5" />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Competitor comparison */}
        <section id="compare" className="py-16 md:py-20 bg-muted/40">
          <div className="max-w-5xl mx-auto px-4">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary hover:bg-primary/10">How We Compare</Badge>
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
                Why pet parents pick Furry Assistant 1
              </h2>
              <p className="text-muted-foreground text-lg">
                Most pet apps do one thing. We do all of them — for less.
              </p>
            </div>

            <div className="overflow-x-auto rounded-xl border border-border bg-card">
              <table className="w-full text-sm" data-testid="table-comparison">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="p-4 font-semibold text-primary">Furry A1</th>
                    <th className="p-4 font-semibold text-muted-foreground">11pets</th>
                    <th className="p-4 font-semibold text-muted-foreground">Pawprint</th>
                    <th className="p-4 font-semibold text-muted-foreground">Whistle</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { f: "Health & medication tracking", us: true, c1: true, c2: true, c3: false },
                    { f: "Activity & GPS tracking", us: true, c1: false, c2: false, c3: "hardware" },
                    { f: "AI nutrition meal plans", us: true, c1: false, c2: false, c3: false },
                    { f: "AI pet care chat", us: true, c1: false, c2: false, c3: false },
                    { f: "AI behavior insights", us: true, c1: false, c2: false, c3: false },
                    { f: "Expense tracking", us: true, c1: true, c2: false, c3: false },
                    { f: "Local vet & service finder", us: true, c1: false, c2: false, c3: false },
                    { f: "Emergency contacts & first aid", us: true, c1: true, c2: false, c3: false },
                    { f: "QR code pet sharing", us: true, c1: false, c2: false, c3: false },
                    { f: "Works without extra hardware", us: true, c1: true, c2: true, c3: false },
                    { f: "Price", us: "Free", c1: "$3 / mo", c2: "Free", c3: "$10 / mo + $99 device" },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-border last:border-0" data-testid={`row-compare-${i}`}>
                      <td className="p-4 font-medium">{row.f}</td>
                      {[row.us, row.c1, row.c2, row.c3].map((v, j) => (
                        <td key={j} className={`p-4 text-center ${j === 0 ? "bg-primary/5" : ""}`}>
                          {v === true ? (
                            <Check className="w-5 h-5 text-green-500 mx-auto" />
                          ) : v === false ? (
                            <X className="w-5 h-5 text-muted-foreground/40 mx-auto" />
                          ) : (
                            <span className={j === 0 ? "font-semibold text-primary" : "text-muted-foreground text-xs"}>
                              {v}
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-4">
              Comparison based on publicly available information about each app's features and pricing.
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
                Frequently asked questions
              </h2>
              <p className="text-muted-foreground text-lg">Everything you need to know before signing up.</p>
            </div>
            <Accordion type="single" collapsible className="w-full" data-testid="accordion-faq">
              <AccordionItem value="q1">
                <AccordionTrigger data-testid="faq-q1">Is it really free?</AccordionTrigger>
                <AccordionContent>
                  Yes — 100% free, forever. Every feature is included for everyone, including AI nutrition plans,
                  AI pet chat, GPS tracking, unlimited pets, and more. No credit card required.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q2">
                <AccordionTrigger data-testid="faq-q2">What's the catch?</AccordionTrigger>
                <AccordionContent>
                  No catch. We don't sell your data, we don't show ads, and we don't have a paid tier waiting to
                  upsell you. If you love the app, the best way to support us is to tell a friend.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q3">
                <AccordionTrigger data-testid="faq-q3">Do I need to download from the App Store?</AccordionTrigger>
                <AccordionContent>
                  No download required. Furry Assistant 1 works in any modern browser, and you can install
                  it directly from this website to your phone's home screen — it'll behave just like a native app.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q4">
                <AccordionTrigger data-testid="faq-q4">Is my pet's data private?</AccordionTrigger>
                <AccordionContent>
                  Yes. Your data is encrypted, stored securely, and never sold. Only you can see your pet's
                  records, unless you explicitly share them with someone via QR code.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q5">
                <AccordionTrigger data-testid="faq-q5">Can I use it for multiple pets?</AccordionTrigger>
                <AccordionContent>
                  Absolutely — add as many pets as you'd like. There's no limit on the free plan, which is the
                  only plan. Perfect for households with several furry friends.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q6">
                <AccordionTrigger data-testid="faq-q6">Will you start charging later?</AccordionTrigger>
                <AccordionContent>
                  Our intention is to keep the core app free for individual pet parents. If we ever add optional
                  paid extras (like advanced veterinary integrations for clinics), the features available today
                  will remain free.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q7">
                <AccordionTrigger data-testid="faq-q7">Is the AI a replacement for a veterinarian?</AccordionTrigger>
                <AccordionContent>
                  No. The AI features in Furry Assistant 1 provide general pet care information and suggestions
                  to help you stay organized, but they are not veterinary medical advice, diagnosis, or treatment.
                  Always consult a licensed veterinarian for any health concerns, emergencies, or before making
                  changes to your pet's diet or medications.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="q8">
                <AccordionTrigger data-testid="faq-q8">How does the app stay free? Are there ads?</AccordionTrigger>
                <AccordionContent>
                  The app is supported by unobtrusive advertising (via Google AdSense), which is what allows
                  every feature to remain 100% free for every user. Ads are personalized only if you accept
                  cookies in the consent banner — otherwise you'll still see ads, but they'll be based on the
                  page content, not your browsing history. We never sell your pet's data and never share your
                  account contents with advertisers.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-16 md:py-20">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="font-heading font-bold text-3xl md:text-4xl mb-4">
              Give your pet the care they deserve
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Join pet owners using Furry Assistant 1 to keep their best friends happy and healthy.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button size="lg" className="text-lg px-8" asChild data-testid="button-signup-bottom">
                <a href="/login">Create Your Free Account</a>
              </Button>
              <Button size="lg" variant="outline" className="text-lg px-8" asChild data-testid="button-pricing-bottom">
                <a href="#pricing">View Pricing</a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <img src={appIcon} alt="Furry Assistant 1" className="w-8 h-8 rounded-lg" />
              <span className="font-heading font-semibold">Furry Assistant 1</span>
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <a href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy">
                Privacy
              </a>
              <a href="/terms" className="hover:text-foreground transition-colors" data-testid="link-terms">
                Terms
              </a>
              <a href="/support" className="hover:text-foreground transition-colors" data-testid="link-support">
                Support
              </a>
              <a href="/login" className="hover:text-foreground transition-colors" data-testid="link-signin-footer">
                Sign In
              </a>
            </div>
            <div className="flex flex-col items-center md:items-end gap-1">
              <a
                href="https://replit.com/?utm_source=furryassistant1&utm_medium=referral&utm_campaign=builtwith"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                data-testid="link-built-on-replit"
              >
                Built and hosted on <span className="font-semibold">Replit</span>
              </a>
              <p className="text-xs text-muted-foreground">
                &copy; {new Date().getFullYear()} Furry Assistant 1
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
