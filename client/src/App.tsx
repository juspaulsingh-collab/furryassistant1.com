import { useEffect } from "react";
import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import CookieConsentBanner from "@/components/CookieConsentBanner";
import { initAnalytics, trackPageView } from "@/lib/analytics";
import { loadAdSense } from "@/lib/adsense";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Pets from "@/pages/Pets";
import PetForm from "@/pages/PetForm";
import Health from "@/pages/Health";
import HealthRecordForm from "@/pages/HealthRecordForm";
import MedicationForm from "@/pages/MedicationForm";
import Activities from "@/pages/Activities";
import ActivityForm from "@/pages/ActivityForm";
import GpsTracking from "@/pages/GpsTracking";
import More from "@/pages/More";
import Nutrition from "@/pages/Nutrition";
import NutritionLogForm from "@/pages/NutritionLogForm";
import HydrationLogForm from "@/pages/HydrationLogForm";
import Behavior from "@/pages/Behavior";
import BehaviorForm from "@/pages/BehaviorForm";
import Training from "@/pages/Training";
import Expenses from "@/pages/Expenses";
import ExpenseForm from "@/pages/ExpenseForm";
import Reminders from "@/pages/Reminders";
import ReminderForm from "@/pages/ReminderForm";
import Emergency from "@/pages/Emergency";
import EmergencyContactForm from "@/pages/EmergencyContactForm";
import LocalServices from "@/pages/LocalServices";
import Admin from "@/pages/Admin";
import Subscription from "@/pages/Subscription";
import Share from "@/pages/Share";
import SharePet from "@/pages/SharePet";
import SitterHandoff from "@/pages/SitterHandoff";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Support from "@/pages/Support";
import AiChat from "@/pages/AiChat";
import EmailLogin from "@/pages/EmailLogin";
import type { User } from "@shared/schema";
import appIcon from "@assets/FurryA1_1766761740789.png";

function AuthenticatedRoutes() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/pets" component={Pets} />
      <Route path="/pets/new" component={PetForm} />
      <Route path="/pets/:id/share" component={SharePet} />
      <Route path="/pets/:id/handoff" component={SitterHandoff} />
      <Route path="/pets/:id" component={PetForm} />
      <Route path="/health" component={Health} />
      <Route path="/health/records/new" component={HealthRecordForm} />
      <Route path="/health/records/:id" component={HealthRecordForm} />
      <Route path="/health/medications/new" component={MedicationForm} />
      <Route path="/health/medications/:id" component={MedicationForm} />
      <Route path="/activities" component={Activities} />
      <Route path="/activities/new" component={ActivityForm} />
      <Route path="/activities/track" component={GpsTracking} />
      <Route path="/activities/:id" component={ActivityForm} />
      <Route path="/more" component={More} />
      <Route path="/nutrition" component={Nutrition} />
      <Route path="/nutrition/logs/new" component={NutritionLogForm} />
      <Route path="/nutrition/logs/:id" component={NutritionLogForm} />
      <Route path="/nutrition/hydration/new" component={HydrationLogForm} />
      <Route path="/nutrition/hydration/:id" component={HydrationLogForm} />
      <Route path="/behavior" component={Behavior} />
      <Route path="/behavior/new" component={BehaviorForm} />
      <Route path="/behavior/:id" component={BehaviorForm} />
      <Route path="/training" component={Training} />
      <Route path="/expenses" component={Expenses} />
      <Route path="/expenses/new" component={ExpenseForm} />
      <Route path="/expenses/:id" component={ExpenseForm} />
      <Route path="/reminders" component={Reminders} />
      <Route path="/reminders/new" component={ReminderForm} />
      <Route path="/reminders/:id" component={ReminderForm} />
      <Route path="/emergency" component={Emergency} />
      <Route path="/emergency/contacts/new" component={EmergencyContactForm} />
      <Route path="/emergency/contacts/:id" component={EmergencyContactForm} />
      <Route path="/services" component={LocalServices} />
      <Route path="/subscription" component={Subscription} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/share" component={Share} />
      <Route path="/settings" component={Settings} />
      <Route path="/profile" component={Profile} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/support" component={Support} />
      <Route path="/ai-chat" component={AiChat} />
      <Route component={NotFound} />
    </Switch>
  );
}

function Router() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    retry: false,
    queryFn: async () => {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.status === 401) {
        return null;
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-orange-50 to-orange-100 dark:from-orange-950 dark:to-background">
        <img 
          src={appIcon} 
          alt="Furry Assistant 1" 
          className="w-32 h-32 mb-6 animate-pulse"
          data-testid="img-splash-logo"
        />
        <h1 className="text-2xl font-bold text-foreground mb-2 font-heading">Furry Assistant 1</h1>
        <p className="text-muted-foreground mb-6">Love Your Pet</p>
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Switch>
        <Route path="/privacy" component={PrivacyPolicy} />
        <Route path="/terms" component={TermsOfService} />
        <Route path="/support" component={Support} />
        <Route path="/login" component={EmailLogin} />
        <Route path="/register" component={EmailLogin} />
        <Route path="/" component={Landing} />
        <Route component={EmailLogin} />
      </Switch>
    );
  }

  return <AuthenticatedRoutes />;
}

function AnalyticsBootstrap() {
  const [location] = useLocation();
  useEffect(() => {
    initAnalytics();
  }, []);
  useEffect(() => {
    trackPageView(location);
  }, [location]);
  return null;
}

function AdSenseBootstrap() {
  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
  });
  useEffect(() => {
    if (isLoading) return;
    if (user?.adFree) return;
    loadAdSense();
  }, [user?.adFree, isLoading]);
  return null;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <AnalyticsBootstrap />
          <AdSenseBootstrap />
          <Toaster />
          <Router />
          <CookieConsentBanner />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
