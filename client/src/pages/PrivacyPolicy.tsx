import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";
import { Link } from "wouter";

export default function PrivacyPolicy() {
  const lastUpdated = "April 29, 2026";
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
          <h1 className="font-heading font-semibold text-lg">Privacy Policy</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-6 md:p-8 prose prose-sm dark:prose-invert max-w-none">
            <h1 className="text-2xl font-bold mb-2">Privacy Policy for {appName}</h1>
            <p className="text-muted-foreground mb-6">Last updated: {lastUpdated}</p>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Introduction</h2>
              <p className="text-foreground mb-4">
                {appName} ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application and related services (collectively, the "App").
              </p>
              <p className="text-foreground mb-4">
                Please read this Privacy Policy carefully. By using the App, you agree to the collection and use of information in accordance with this policy. If you do not agree with the terms of this Privacy Policy, please do not access the App.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>
              
              <h3 className="text-lg font-medium mb-2">Personal Information</h3>
              <p className="text-foreground mb-4">We may collect the following types of personal information:</p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Account information (name, email address, profile picture) when you sign in</li>
                <li>Pet information (pet names, species, breed, age, weight, photos)</li>
                <li>Health records you choose to store (vet visits, medications, vaccinations)</li>
                <li>Activity data (walks, playtime, GPS location data when tracking activities)</li>
                <li>Nutrition and hydration logs</li>
                <li>Behavior tracking notes</li>
                <li>Expense records</li>
                <li>Emergency contact information you provide</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Device information (device type, operating system, unique device identifiers)</li>
                <li>Usage data (features used, time spent in app)</li>
                <li>Location data (only when you actively use GPS tracking features)</li>
              </ul>

              <h3 className="text-lg font-medium mb-2">Camera and Photo Access</h3>
              <p className="text-foreground mb-4">
                The App may request access to your device's camera and photo library to:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Take photos of your pets for their profiles</li>
                <li>Upload existing photos from your device</li>
                <li>Capture images of health documents or prescriptions</li>
              </ul>
              <p className="text-foreground mb-4">
                Camera access is only used when you explicitly choose to add or update photos. Photos are stored securely and are only visible to you unless you choose to share them.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <p className="text-foreground mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Provide, maintain, and improve the App</li>
                <li>Create and manage your account</li>
                <li>Store and display your pet information</li>
                <li>Send medication and appointment reminders</li>
                <li>Generate AI-powered nutrition and behavior suggestions</li>
                <li>Track activities and display GPS routes</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send important updates about the App</li>
                <li>Analyze usage patterns to improve our services</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Sharing and Disclosure</h2>
              <p className="text-foreground mb-4">We may share your information in the following circumstances:</p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li><strong>Service Providers:</strong> We share data with third-party services that help us operate the App, including:
                  <ul className="list-disc pl-6 mt-2">
                    <li>OpenAI (for AI-powered features - anonymized queries only)</li>
                    <li>Google Places API (for finding local pet services)</li>
                    <li>Cloud storage providers (for photo storage)</li>
                  </ul>
                </li>
                <li><strong>Legal Requirements:</strong> We may disclose information if required by law or to protect our rights</li>
                <li><strong>With Your Consent:</strong> When you choose to share pet profiles via QR codes or social media</li>
              </ul>
              <p className="text-foreground mb-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Cookies, Analytics, and Advertising</h2>
              <p className="text-foreground mb-4">
                {appName} is free to use. To keep it free, we display advertising and use cookies and similar technologies to understand how the App is used and to measure the effectiveness of our marketing. The first time you visit, we'll show you a banner asking whether to accept or decline these cookies. You can change your mind anytime by clearing your browser's site data for {appName} or using the controls in your account Settings.
              </p>
              <p className="text-foreground mb-4">
                When you accept, we may set cookies and pixels from the following providers:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li><strong>Google Analytics 4</strong> — Aggregated, anonymized usage statistics (which pages are visited, how long you stay) so we can improve the App. IP addresses are anonymized.</li>
                <li><strong>Google Ads</strong> — Conversion measurement so we can tell which advertising campaigns successfully bring new users to the App.</li>
                <li><strong>Google AdSense</strong> — Third-party advertising network that shows ads inside {appName}. Google and its partners may use cookies to serve ads based on your prior visits to this and other websites. With your consent, ads may be personalized; without consent, ads will be non-personalized (contextual). Ad revenue is what allows us to keep {appName} free for everyone.</li>
              </ul>
              <p className="text-foreground mb-4">
                We use <strong>Google Consent Mode v2</strong>, which means analytics and advertising cookies are <em>disabled by default</em> until you explicitly accept them. If you decline, you'll still see ads, but they'll be non-personalized (based only on the page content, not your browsing history).
              </p>
              <p className="text-foreground mb-4">
                You can opt out of personalized Google advertising at any time at{" "}
                <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">adssettings.google.com</a>,{" "}
                manage third-party vendor cookies at{" "}
                <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-primary underline">aboutads.info</a>{" "}
                (US) or{" "}
                <a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-primary underline">youronlinechoices.eu</a>{" "}
                (EU), or install the official{" "}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" className="text-primary underline">Google Analytics opt-out browser add-on</a>.
              </p>
              <p className="text-foreground mb-4">
                We do not sell your personal information. We do not share your pet records, health data, or account details with advertisers — advertising is served based on the page being viewed and, with your consent, your general browsing signals (handled by Google), not the contents of your account.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Storage and Security</h2>
              <p className="text-foreground mb-4">
                We implement appropriate technical and organizational security measures to protect your personal information. Your data is stored on secure servers with encryption in transit and at rest.
              </p>
              <p className="text-foreground mb-4">
                While we strive to protect your information, no method of transmission over the Internet or electronic storage is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Data Retention and Account Deletion</h2>
              <p className="text-foreground mb-4">
                We retain your personal information for as long as your account is active or as needed to provide you services.
              </p>
              <p className="text-foreground mb-4">
                <strong>You can delete your account at any time</strong> through the App by going to Settings and selecting "Delete Account" in the Danger Zone section. This will permanently and immediately delete:
              </p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Your account and profile information</li>
                <li>All pet profiles and photos</li>
                <li>Health records, medications, and vet visit history</li>
                <li>Activity logs and GPS tracking data</li>
                <li>Nutrition and behavior logs</li>
                <li>Expenses and reminders</li>
              </ul>
              <p className="text-foreground mb-4">
                Account deletion is immediate and irreversible. You may also request deletion by contacting us at the email below.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Your Rights and Choices</h2>
              <p className="text-foreground mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-4 text-foreground">
                <li>Access the personal information we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your data</li>
                <li>Opt out of marketing communications</li>
                <li>Disable location tracking in your device settings</li>
                <li>Withdraw consent for data collection</li>
              </ul>
              <p className="text-foreground mb-4">
                To exercise these rights, please contact us at <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a>.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Location Data</h2>
              <p className="text-foreground mb-4">
                The App uses GPS location data only when you actively start an activity tracking session. Location tracking is never performed in the background without your knowledge. You can disable location services for the App at any time through your device settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Children's Privacy</h2>
              <p className="text-foreground mb-4">
                The App is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">International Data Transfers</h2>
              <p className="text-foreground mb-4">
                Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place to protect your data in accordance with this Privacy Policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Changes to This Privacy Policy</h2>
              <p className="text-foreground mb-4">
                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-foreground mb-4">
                If you have any questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none mb-4 text-foreground">
                <li><strong>App Name:</strong> {appName}</li>
                <li><strong>Email:</strong> <a href={`mailto:${contactEmail}`} className="text-primary underline">{contactEmail}</a></li>
              </ul>
            </section>

            <section className="mb-4">
              <h2 className="text-xl font-semibold mb-3">California Privacy Rights (CCPA)</h2>
              <p className="text-foreground mb-4">
                If you are a California resident, you have specific rights regarding your personal information under the California Consumer Privacy Act (CCPA). You have the right to request disclosure of collected information, request deletion, and opt-out of the sale of personal information. We do not sell personal information.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-3">European Privacy Rights (GDPR)</h2>
              <p className="text-foreground mb-4">
                If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation (GDPR) including the right to access, rectify, port, and erase your data, as well as the right to restrict and object to certain processing of your data.
              </p>
            </section>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
