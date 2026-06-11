# Furry Assistant 1 - Pet Care Companion App

## Overview

Furry Assistant 1 is a comprehensive pet care mobile-first web application that helps pet owners manage their pets' health, activities, nutrition, behavior, and expenses. The app provides AI-powered features for nutrition guidance and behavior suggestions, along with practical tools for tracking medications, vet visits, and daily care routines.

Key features include:
- Pet profile management with photos
- Health records and medication tracking with reminders
- Activity logging with GPS and goal setting
- AI-powered nutrition meal plans and hydration tracking
- Behavior tracking with AI suggestions
- **AI Chat Assistant** for general pet care questions (accessible from Home page)
- Expense tracking for pet-related costs
- Emergency contacts and first aid guides
- Training resources library
- Admin dashboard for usage analytics

## User Preferences

Preferred communication style: Simple, everyday language.
**Budget priority: Always suggest free options first. Do not recommend paid services unless explicitly requested. Use built-in Replit features and free tiers whenever possible.**

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack Query (React Query) for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and CSS variables for theming
- **Build Tool**: Vite with HMR support

The frontend follows a mobile-first design approach with a bottom navigation pattern for core sections (Home, Pets, Activities, Health, More). The design system uses Inter for body text and Poppins for headings, with a warm color palette centered around orange/amber tones.

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript with ESM modules
- **API Design**: RESTful JSON APIs under `/api/*` prefix
- **Authentication**: Replit Auth with OpenID Connect, session-based with PostgreSQL session store
- **AI Integration**: OpenAI API (via Replit AI Integrations) for chat, image generation, and nutrition/behavior suggestions

The server uses a storage abstraction pattern (`IStorage` interface) for database operations, making it easy to swap implementations. Routes are registered modularly with separate files for auth, pets, health, activities, etc.

### Data Layer
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with type-safe schema definitions
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Drizzle Kit with `drizzle-kit push` for schema updates
- **Validation**: Zod schemas generated from Drizzle schemas via `drizzle-zod`

Core entities include: users, pets, health_records, medications, activities, activity_goals, nutrition_logs, hydration_logs, behavior_logs, expenses, emergency_contacts, training_resources, meal_plans, reminders, and feature_usage (for analytics).

### Build System
- **Development**: Vite dev server with Express backend proxy
- **Production**: esbuild bundles server code, Vite builds client to `dist/public`
- **Scripts**: `npm run dev` for development, `npm run build` for production, `npm run db:push` for schema migrations

## External Dependencies

### Database
- **PostgreSQL**: Primary data store, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session storage in PostgreSQL

### AI Services
- **OpenAI API**: Used for chat completions, image generation (gpt-image-1), and AI-powered suggestions
- **Environment Variables**: `AI_INTEGRATIONS_OPENAI_API_KEY`, `AI_INTEGRATIONS_OPENAI_BASE_URL`

### Authentication
- **Replit Auth**: OpenID Connect provider for user authentication
- **Environment Variables**: `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`

### Pricing Model — 100% FREE
- **The app is fully free for all users.** No paid tiers, no premium gates, no pet limit, no payment required.
- **Stripe code is intentionally retained** (routes, schema, sync, admin grant/revoke) so paid tiers can be re-enabled later without re-architecting. It is unreachable from any user-facing UI today.
- **No `Upgrade to Premium` CTAs anywhere** in the app. The `/subscription` page now shows a "Free Forever" message instead of plan tiers.
- **Backend pet creation has no limit** (`POST /api/pets` no longer checks `isPremium`).
- **Stripe sync infrastructure** still runs at boot (webhook setup + product/price/subscription sync to `stripe.*` tables) — leave it intact.

### Local Services / Google Places API
- **Google Places API (New)**: Find nearby veterinarians, pet stores, and boarding facilities
- **Environment Variables**: `GOOGLE_PLACES_API_KEY`
- **Endpoint**: `GET /api/places/nearby?lat=&lng=&type=` - Returns nearby pet services from Google Places
- **Place Types Mapped**: veterinary → veterinary_care, groomer/pet_store → pet_store, boarding → lodging

### Admin Dashboard
- **Access Control**: `isAdmin` middleware checks `users.is_admin` field in database
- **Endpoints**:
  - `GET /api/admin/metrics` - Total users, premium users, active users (7 days), new signups (7 days), total pets
  - `GET /api/admin/features` - Top feature usage statistics from feature_usage table
  - `GET /api/admin/user-growth` - Daily user growth data for past 30 days
  - `GET /api/admin/users` - All users with search capability
  - `PATCH /api/admin/users/:id/admin` - Toggle admin status (cannot modify self)
  - `GET /api/admin/stripe/revenue` - Subscription statistics from stripe schema
- **Pages**: `/admin` (AdminDashboard.tsx), `/admin/users` (AdminUsers.tsx)
- **Charts**: Uses recharts library for user growth line chart and feature usage bar chart

### Third-Party Libraries
- **Radix UI**: Accessible component primitives (dialogs, dropdowns, tabs, etc.)
- **TanStack Query**: Data fetching and caching
- **date-fns**: Date manipulation utilities
- **Lucide React**: Icon library
- **react-hook-form**: Form state management with Zod validation

## iOS & Android App Store Compliance

### PWA Configuration
- **Manifest**: `client/public/manifest.json` - Contains app metadata, icons, shortcuts
- **Service Worker**: `client/public/sw.js` - Offline support and caching
- **Meta Tags**: iOS and Android specific tags in `client/index.html`

### Required Assets
All PWA icons generated as exact squares in `client/public/icons/`:
- icon-16x16.png, icon-32x32.png (favicons)
- icon-72x72.png, icon-96x96.png, icon-128x128.png, icon-144x144.png
- icon-152x152.png, icon-167x167.png, icon-180x180.png (iOS apple-touch-icon)
- icon-192x192.png, icon-384x384.png, icon-512x512.png (Android/PWA, includes maskable variants)
- shortcut-add.png, shortcut-health.png (96x96 shortcut icons)

Splash screens (optional, for App Store submission) in `client/public/splash/`:
- splash-640x1136.png, splash-750x1334.png, splash-1242x2208.png
- splash-1125x2436.png, splash-1284x2778.png

### Marketing Website
- **Public landing page** (`client/src/pages/Landing.tsx`) is the default route `/` for logged-out users
- Includes hero, features, single "Free Forever" pricing card, competitor comparison table (showing "Free" in price row), install instructions, FAQ (focused on "is it really free / what's the catch"), footer
- **Install banner** uses `beforeinstallprompt` event for Android/Chrome/Edge, shows iOS Safari instructions for iPhone/iPad
- All CTAs route to `/login` for signup — no payment flow exposed

### SEO
- **Title/description/keywords** in `client/index.html` target high-volume queries: "free pet care app", "dog app", "cat app", "pet health tracker", "AI pet assistant", etc.
- **Canonical URL** + `hreflang` (en, x-default): `https://www.furryassistant1.com/`
- **Structured data (JSON-LD), 6 blocks**, all validated:
  1. SoftwareApplication (with single Free Forever offer)
  2. Organization (with logo ImageObject + alternateName)
  3. WebSite (with publisher reference)
  4. FAQPage (verbatim match to Landing FAQ Q1–Q6 — eligible for Google rich results)
  5. HowTo (install on iPhone/Android — eligible for "how to install pet care app" rich results)
  6. BreadcrumbList
- **Search engines covered**: Google, Bing, Yandex, DuckDuckGo, Apple (Applebot), Baidu — via standard `robots`/`googlebot` meta + canonical/hreflang.
- **Open Graph** (Facebook, LinkedIn, WhatsApp, iMessage, Discord, Slack) + **Twitter/X Card** with image dimensions and alt text.
- **`client/public/robots.txt`**: Single `User-agent: *` group (per the spec, bot-specific groups override `*` instead of inheriting — keeping a single group ensures every crawler honors the same disallows). Disallows `/api/`, `/admin`, `/admin/`, `/pets/*/share`, `/pets/*/handoff`. References sitemap.
- **`client/public/sitemap.xml`**: Lists `/`, `/login`, `/register`, `/privacy`, `/terms`, `/support` with `<lastmod>`; root URL includes `image:image` extension for Google Image search.
- **`client/public/llms.txt`** (new): Markdown summary for AI search engines (ChatGPT, Claude, Perplexity) following the emerging llms.txt convention — contains app description, feature list, comparison, and key URLs.
- **PWA manifest**: Updated `name`, `description`, `categories`, `display_override`, `dir`, `lang` for app-store-style install prompts on Chrome/Edge.

### Google Ads & Analytics (Consent Mode v2)
- **Library**: `client/src/lib/analytics.ts` — single source of truth for Google tag (gtag.js) loading, Consent Mode v2 defaults, page-view tracking, and conversion tracking. **Inert when no IDs are configured** (no scripts load, no cookies, no network calls).
- **Build-time env vars** (set in Replit Secrets — they ship to the client, so they must be the public-facing IDs only):
  - `VITE_GA_MEASUREMENT_ID` — GA4 measurement ID, e.g. `G-XXXXXXXXXX`
  - `VITE_GOOGLE_ADS_ID` — Google Ads tag ID, e.g. `AW-XXXXXXXXXX`
  - `VITE_GOOGLE_ADS_CONVERSION_LABEL` — Conversion action label for the signup conversion, e.g. `AbCdEfGhIj`
- **Consent Mode v2** (required by Google for EU traffic since March 2024): defaults to `denied` for `ad_storage`, `ad_user_data`, `ad_personalization`, `analytics_storage`. Flips to `granted` only after the user clicks Accept in the cookie banner. Choice persisted in localStorage key `furry-cookie-consent`.
- **Cookie banner**: `client/src/components/CookieConsentBanner.tsx`. Mounted in `App.tsx`. Hides itself on `/privacy` and `/terms` so users can read before deciding. Only renders when at least one tag ID is configured.
- **Conversion event**: signup fires `trackConversion()` (Google Ads `conversion`) + `trackEvent("sign_up", { method: "email" })` (GA4) in `EmailLogin.tsx` after successful registration.
- **SPA page-view tracking**: `AnalyticsBootstrap` in `App.tsx` listens to wouter `useLocation` and fires `page_view` on every client-side route change (since gtag's auto page_view only catches the initial load).
- **Privacy Policy**: `client/src/pages/PrivacyPolicy.tsx` has a "Cookies, Analytics, and Advertising" section disclosing GA4 + Google Ads, the consent banner, opt-out URLs (Google Ads Settings, GA opt-out add-on). Required for Google Ads policy approval.
- **AdsBot-Google**: explicitly allowed by `robots.txt` (under the catch-all `*` Allow), so Google Ads can crawl the landing page to score the destination URL.

### Onboarding & Sitter Handoff
- **Onboarding wizard** (`client/src/components/OnboardingWizard.tsx`): 4-step modal shown to new users with 0 pets — welcome → pet basics (name/species/breed) → quick tour → confirm. Persists completion in localStorage key `furry-onboarding-completed`. Auto-opens once per Dashboard mount.
- **Sitter handoff sheet** (`client/src/pages/SitterHandoff.tsx` at `/pets/:id/handoff`): Print-friendly one-page summary with pet info, owner contact, vet, emergency contacts, active meds, recent vaccinations, care notes. Uses browser's native `window.print()` — no PDF library required. Print styles in `client/src/index.css`. Accessible via FileText icon button on the pet edit page.

### Design Guidelines Met
- **Touch Targets**: Minimum 44px (iOS) / 48dp (Android) for all interactive elements
- **Safe Areas**: CSS env() variables for notch and home indicator handling
- **Bottom Navigation**: Respects safe-area-inset-bottom for iOS home indicator
- **Viewport**: Configured with viewport-fit=cover for full-screen experience
- **Status Bar**: black-translucent style for iOS

### App Wrapping Options
To submit to app stores, wrap the PWA using:
- **Capacitor**: Recommended for iOS/Android native wrapping
- **PWABuilder**: Quick submission tool from Microsoft
- **Trusted Web Activity (TWA)**: Android-only option via Play Store