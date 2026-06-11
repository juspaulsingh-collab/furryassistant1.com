// Google Tag (gtag.js) loader for Google Analytics 4 + Google Ads
// with full Consent Mode v2 support (required by Google for EU traffic
// since March 2024).
//
// Configure by setting any of these in Replit Secrets BEFORE building:
//   VITE_GA_MEASUREMENT_ID            e.g. "G-XXXXXXXXXX"  (GA4)
//   VITE_GOOGLE_ADS_ID                e.g. "AW-XXXXXXXXXX" (Google Ads)
//   VITE_GOOGLE_ADS_CONVERSION_LABEL  e.g. "AbCdEfGhIj"    (signup conversion)
//
// If neither tag ID is set, this file is inert — no scripts load,
// no cookies are set, no network calls happen.

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID as string | undefined;
const ADS_ID = import.meta.env.VITE_GOOGLE_ADS_ID as string | undefined;
const SIGNUP_CONVERSION_LABEL = import.meta.env
  .VITE_GOOGLE_ADS_CONVERSION_LABEL as string | undefined;

const CONSENT_STORAGE_KEY = "furry-cookie-consent";

let initialized = false;

function ensureGtagShim() {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  if (!window.gtag) {
    window.gtag = function gtag() {
      // eslint-disable-next-line prefer-rest-params
      window.dataLayer!.push(arguments);
    };
  }
}

/**
 * Initialize Google tag(s). Safe to call multiple times — only runs once.
 * Sets Consent Mode v2 defaults to denied; will flip to granted after
 * the user accepts cookies in CookieConsentBanner.
 */
export function initAnalytics() {
  if (initialized) return;
  if (typeof window === "undefined") return;
  if (!GA_ID && !ADS_ID) return; // No IDs configured → do nothing.

  initialized = true;
  ensureGtagShim();
  const gtag = window.gtag!;

  // 1) Consent Mode v2 defaults — DENIED until user opts in.
  //    Honors any saved choice from a previous session.
  const saved =
    typeof localStorage !== "undefined"
      ? localStorage.getItem(CONSENT_STORAGE_KEY)
      : null;
  const granted = saved === "granted";
  const consentState = granted ? "granted" : "denied";

  gtag("consent", "default", {
    ad_storage: consentState,
    ad_user_data: consentState,
    ad_personalization: consentState,
    analytics_storage: consentState,
    functionality_storage: "granted",
    security_storage: "granted",
    wait_for_update: 500,
  });

  // 2) Inject the gtag.js loader (uses the first available ID).
  const primaryId = GA_ID || ADS_ID!;
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${primaryId}`;
  document.head.appendChild(script);

  // 3) Initialize the timestamp + each configured tag.
  gtag("js", new Date());
  if (GA_ID) {
    // send_page_view: false — the SPA's own AnalyticsBootstrap fires
    // page_view on every wouter route change (including the initial mount),
    // so letting gtag also auto-send the first page_view would double-count.
    gtag("config", GA_ID, {
      send_page_view: false,
      anonymize_ip: true,
    });
  }
  if (ADS_ID) {
    gtag("config", ADS_ID);
  }
}

/**
 * Update Consent Mode v2 grants when the user accepts/declines cookies.
 * Persists their choice so we don't ask again on the next visit.
 */
export function setConsent(granted: boolean) {
  if (typeof window === "undefined") return;
  if (typeof localStorage !== "undefined") {
    localStorage.setItem(CONSENT_STORAGE_KEY, granted ? "granted" : "denied");
  }
  if (!GA_ID && !ADS_ID) return;
  ensureGtagShim();
  const value = granted ? "granted" : "denied";
  window.gtag!("consent", "update", {
    ad_storage: value,
    ad_user_data: value,
    ad_personalization: value,
    analytics_storage: value,
  });
}

export function getConsentChoice(): "granted" | "denied" | null {
  if (typeof localStorage === "undefined") return null;
  const v = localStorage.getItem(CONSENT_STORAGE_KEY);
  return v === "granted" || v === "denied" ? v : null;
}

/** Fire a generic GA4 event (no-op if no GA tag is set). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", name, params);
}

/** Fire a SPA page_view to GA4 on route change. */
export function trackPageView(path: string) {
  if (typeof window === "undefined" || !window.gtag) return;
  if (!GA_ID) return;
  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.origin + path,
  });
}

/**
 * Fire a Google Ads conversion. Use after signup, purchase, or any
 * key action you want to optimize ad campaigns toward.
 *
 * If `label` is omitted, falls back to VITE_GOOGLE_ADS_CONVERSION_LABEL
 * (typically your "signup_completed" conversion label).
 */
export function trackConversion(opts: {
  label?: string;
  value?: number;
  currency?: string;
  transactionId?: string;
} = {}) {
  if (typeof window === "undefined" || !window.gtag) return;
  if (!ADS_ID) return;
  const label = opts.label ?? SIGNUP_CONVERSION_LABEL;
  if (!label) return;
  window.gtag("event", "conversion", {
    send_to: `${ADS_ID}/${label}`,
    value: opts.value,
    currency: opts.currency ?? "USD",
    transaction_id: opts.transactionId,
  });
}

/** True only when at least one Google tag ID is configured at build time. */
export const analyticsEnabled = Boolean(GA_ID || ADS_ID);
