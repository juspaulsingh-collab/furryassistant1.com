import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Cookie, X } from "lucide-react";
import {
  analyticsEnabled,
  getConsentChoice,
  setConsent,
} from "@/lib/analytics";

export default function CookieConsentBanner() {
  const [location] = useLocation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show the banner if analytics/ads are actually configured
    // and the user hasn't already chosen.
    if (!analyticsEnabled) return;
    if (getConsentChoice() !== null) return;

    // Don't pop the banner over the legal pages — let people read
    // them in peace before deciding.
    if (location === "/privacy" || location === "/terms") return;

    // Tiny delay so it doesn't fight the initial paint.
    const t = setTimeout(() => setVisible(true), 600);
    return () => clearTimeout(t);
  }, [location]);

  if (!visible) return null;

  const accept = () => {
    setConsent(true);
    setVisible(false);
  };

  const decline = () => {
    setConsent(false);
    setVisible(false);
  };

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      data-testid="banner-cookie-consent"
      className="fixed inset-x-0 bottom-0 z-[100] p-4 md:p-6 pointer-events-none"
      style={{
        paddingBottom:
          "calc(env(safe-area-inset-bottom, 0px) + 1rem)",
      }}
    >
      <div className="pointer-events-auto max-w-3xl mx-auto bg-card border border-border rounded-2xl shadow-2xl p-4 md:p-5">
        <div className="flex items-start gap-3 md:gap-4">
          <div className="hidden sm:flex w-10 h-10 rounded-full bg-primary/10 items-center justify-center flex-shrink-0">
            <Cookie className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-heading font-semibold text-base mb-1">
              We use cookies to improve Furry Assistant 1
            </h2>
            <p className="text-sm text-muted-foreground">
              We use cookies for analytics and to measure our advertising so we
              can keep the app free for everyone. You can accept or decline —
              the app works either way. Learn more in our{" "}
              <Link
                href="/privacy"
                className="text-primary underline"
                data-testid="link-cookie-privacy"
              >
                Privacy Policy
              </Link>
              .
            </p>
          </div>
          <button
            onClick={decline}
            aria-label="Close cookie banner"
            className="text-muted-foreground hover:text-foreground p-1 -m-1 sm:hidden"
            data-testid="button-cookie-close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <Button
            variant="outline"
            onClick={decline}
            className="w-full sm:w-auto min-h-11"
            data-testid="button-cookie-decline"
          >
            Decline
          </Button>
          <Button
            onClick={accept}
            className="w-full sm:w-auto min-h-11"
            data-testid="button-cookie-accept"
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
