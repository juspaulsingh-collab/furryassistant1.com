import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function TermsOfService() {
  const lastUpdated = "December 27, 2024";
  const appName = "Furry Assistant 1";
  const contactEmail = "support@furryassistant1.com";

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild data-testid="button-back">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="font-heading font-semibold text-lg">Terms of Service</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-8 prose prose-sm dark:prose-invert max-w-none">
            <h1 className="text-2xl font-bold mb-2">Terms of Service for {appName}</h1>
            <p className="text-muted-foreground mb-6">Last updated: {lastUpdated}</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">1. Acceptance of Terms</h2>
              <p className="text-foreground mb-4">
                By downloading, installing, or using {appName} (the "App"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the App.
              </p>
              <p className="text-foreground mb-4">
                We reserve the right to modify these Terms at any time. Your continued use of the App after any changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">2. Description of Service</h2>
              <p className="text-foreground mb-4">
                {appName} is a pet care management application that provides tools for tracking pet health, activities, nutrition, expenses, and more. The App is provided free of charge to all users.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">3. User Accounts</h2>
              <p className="text-foreground mb-4">
                To use certain features of the App, you must create an account. You are responsible for:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Maintaining the confidentiality of your account credentials</li>
                <li>All activities that occur under your account</li>
                <li>Providing accurate and complete information</li>
                <li>Notifying us immediately of any unauthorized use</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">4. Pricing</h2>
              <p className="text-foreground mb-4">
                {appName} is provided <strong>free of charge</strong> to all users. There are no subscription tiers, no paywalls, and no payment is required to access any feature. We may, in the future, offer optional paid extras (such as professional veterinary integrations) but the features available today will remain free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">5. Acceptable Use</h2>
              <p className="text-foreground mb-4">You agree not to:</p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Use the App for any illegal purpose</li>
                <li>Upload malicious content or attempt to harm the App</li>
                <li>Impersonate others or provide false information</li>
                <li>Attempt to gain unauthorized access to the App or its systems</li>
                <li>Use the App in any way that could damage or overburden our servers</li>
                <li>Reproduce, duplicate, or resell any part of the App</li>
                <li>Use automated systems to access the App without permission</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">6. User Content</h2>
              <p className="text-foreground mb-4">
                You retain ownership of any content you submit to the App (photos, notes, etc.). By submitting content, you grant us a non-exclusive, worldwide, royalty-free license to use, store, and display that content as necessary to provide the App services.
              </p>
              <p className="text-foreground mb-4">
                You are solely responsible for the content you upload and represent that you have the right to share such content.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">7. AI-Powered Features</h2>
              <p className="text-foreground mb-4">
                The App includes AI-powered features for nutrition suggestions, behavior insights, and other recommendations. These features are for informational purposes only and should not be considered as professional veterinary advice.
              </p>
              <p className="text-foreground mb-4">
                <strong>Important:</strong> Always consult with a qualified veterinarian for medical decisions regarding your pet's health.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">8. Medical Disclaimer</h2>
              <p className="text-foreground mb-4">
                {appName} is not a substitute for professional veterinary care. The App provides tools to help you track and organize pet information, but:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>We do not provide veterinary advice, diagnosis, or treatment</li>
                <li>Information in the App should not replace professional veterinary consultation</li>
                <li>In case of pet emergencies, contact your veterinarian or emergency animal hospital immediately</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">9. Intellectual Property</h2>
              <p className="text-foreground mb-4">
                The App and its original content, features, and functionality are owned by {appName} and are protected by international copyright, trademark, and other intellectual property laws.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">10. Third-Party Services</h2>
              <p className="text-foreground mb-4">
                The App integrates with third-party services including:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>OpenAI for AI features</li>
                <li>Stripe for payment processing</li>
                <li>Google Places for location services</li>
              </ul>
              <p className="text-foreground mb-4">
                Your use of these services is subject to their respective terms and privacy policies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">11. Limitation of Liability</h2>
              <p className="text-foreground mb-4">
                To the maximum extent permitted by law, {appName} and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Loss of data or content</li>
                <li>Personal injury or property damage</li>
                <li>Unauthorized access to your data</li>
                <li>Any interruption or cessation of the App</li>
                <li>Any errors or inaccuracies in the App</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">12. Disclaimer of Warranties</h2>
              <p className="text-foreground mb-4">
                The App is provided "as is" and "as available" without warranties of any kind, either express or implied. We do not guarantee that the App will be uninterrupted, secure, or error-free.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">13. Termination</h2>
              <p className="text-foreground mb-4">
                We may terminate or suspend your account and access to the App immediately, without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or third parties, or for any other reason at our sole discretion.
              </p>
              <p className="text-foreground mb-4">
                You may delete your account at any time through the App settings or by contacting us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">14. Governing Law</h2>
              <p className="text-foreground mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">15. Changes to Terms</h2>
              <p className="text-foreground mb-4">
                We reserve the right to modify these Terms at any time. We will provide notice of significant changes through the App or via email. Your continued use of the App after such modifications constitutes acceptance of the updated Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">16. Contact Us</h2>
              <p className="text-foreground mb-4">
                If you have any questions about these Terms of Service, please contact us:
              </p>
              <ul className="list-none mb-4 text-foreground">
                <li><strong>App Name:</strong> {appName}</li>
                <li><strong>Email:</strong> <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a></li>
              </ul>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
