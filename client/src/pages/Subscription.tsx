import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BottomNavigation } from "@/components/BottomNavigation";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { ArrowLeft, Heart, Sparkles, Check, PawPrint, ShieldOff, Loader2 } from "lucide-react";
import type { User } from "@shared/schema";

const includedFeatures = [
  "Unlimited pets — no caps, ever",
  "Full health, medication & vaccination tracking",
  "Activity & GPS walk logging",
  "AI nutrition meal plans",
  "AI behavior insights & training tips",
  "AI pet care chat 24/7",
  "Expense tracking",
  "Smart reminders & notifications",
  "Emergency contacts & first-aid guides",
  "Sitter handoff PDF",
  "QR code pet sharing",
  "Local vet & service finder",
];

export default function Subscription() {
  const [location, setLocation] = useLocation();
  const { toast } = useToast();
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    document.title = "Plan | Furry Assistant 1";
  }, []);

  const { data: user } = useQuery<User>({
    queryKey: ["/api/auth/user"],
  });

  const checkoutMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/stripe/checkout/remove-ads");
      return res.json() as Promise<{ url: string }>;
    },
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
    onError: (err: any) => {
      toast({ title: "Could not start checkout", description: err?.message || "Please try again.", variant: "destructive" });
    },
  });

  // Handle redirect back from Stripe
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get("adfree");
    const sessionId = params.get("session_id");

    if (status === "cancelled") {
      toast({ title: "Checkout cancelled", description: "No charge was made." });
      setLocation("/subscription", { replace: true });
      return;
    }

    if (status === "success" && sessionId && !verifying) {
      setVerifying(true);
      apiRequest("POST", "/api/stripe/verify-remove-ads", { sessionId })
        .then((r) => r.json())
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
          toast({ title: "Ads removed 🎉", description: "Thanks for supporting Furry Assistant 1!" });
          setLocation("/subscription", { replace: true });
        })
        .catch((err) => {
          toast({ title: "Verification failed", description: err?.message || "Please contact support.", variant: "destructive" });
        })
        .finally(() => setVerifying(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location]);

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <Link href="/more">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="font-heading font-semibold text-lg">Your Plan</h1>
          <ThemeToggle />
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Free badge / hero */}
        <Card className="border-primary/30 bg-gradient-to-br from-primary/5 via-chart-3/5 to-chart-4/5" data-testid="free-status-card">
          <CardContent className="p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
              <Heart className="w-8 h-8 text-primary" />
            </div>
            <Badge className="bg-green-500/20 text-green-700 dark:text-green-400 mb-3">
              <Sparkles className="w-3 h-3 mr-1" /> 100% Free
            </Badge>
            <h2 className="font-heading font-bold text-2xl mb-2">
              Every feature is free for everyone
            </h2>
            <p className="text-muted-foreground mb-4">
              {user?.firstName ? `${user.firstName}, you and your pets ` : "You and your pets "}
              get full access to every feature with no limits, no trial countdown, and no payment required. The app is supported by ads.
            </p>
            <p className="text-sm text-muted-foreground">
              💛 If you love the app, the best way to thank us is to tell a friend.
            </p>
          </CardContent>
        </Card>

        {/* Remove Ads — one-time purchase */}
        <Card className="border-primary/40" data-testid="remove-ads-card">
          <CardContent className="p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                <ShieldOff className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-heading font-semibold text-lg">Remove Ads</h3>
                  {user?.adFree && (
                    <Badge className="bg-green-500/20 text-green-700 dark:text-green-400" data-testid="badge-adfree-active">
                      <Check className="w-3 h-3 mr-1" /> Active
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  One-time payment. No subscription. Permanently removes advertising from your account on every device you sign in to.
                </p>
              </div>
            </div>

            {user?.adFree ? (
              <div className="rounded-md bg-green-500/10 px-4 py-3 text-sm text-green-700 dark:text-green-400" data-testid="text-adfree-thanks">
                Thanks for supporting Furry Assistant 1 — you won't see ads anymore. ❤️
              </div>
            ) : (
              <>
                <div className="flex items-baseline gap-2 mb-4">
                  <span className="font-heading font-bold text-3xl" data-testid="text-remove-ads-price">$1.99</span>
                  <span className="text-sm text-muted-foreground">one-time</span>
                </div>
                <Button
                  className="w-full"
                  onClick={() => checkoutMutation.mutate()}
                  disabled={checkoutMutation.isPending || verifying}
                  data-testid="button-remove-ads"
                >
                  {checkoutMutation.isPending || verifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {verifying ? "Confirming…" : "Redirecting…"}
                    </>
                  ) : (
                    "Remove ads — $1.99"
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  Secure checkout via Stripe. All other features stay free.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Features included */}
        <div>
          <h3 className="font-heading font-semibold text-lg mb-3">What's included (free)</h3>
          <Card>
            <CardContent className="p-4">
              <ul className="space-y-3">
                {includedFeatures.map((feature) => (
                  <li key={feature} className="flex items-start gap-3 text-sm" data-testid={`included-feature-${feature.split(" ")[0].toLowerCase()}`}>
                    <Check className="w-4 h-4 text-green-500 mt-0.5 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* CTA back to app */}
        <Card className="border-dashed">
          <CardContent className="p-6 text-center">
            <PawPrint className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground mb-4">
              Ready to take care of your furry friends?
            </p>
            <Button asChild className="w-full" data-testid="button-go-pets">
              <Link href="/pets">Go to my pets</Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <BottomNavigation />
    </div>
  );
}
