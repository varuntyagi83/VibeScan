import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Terms of Service — VibeScan",
};

const LAST_UPDATED = "April 2026";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 px-6 py-4">
        <Link href="/" className="inline-flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 ring-1 ring-primary/30">
            <Shield className="h-4 w-4 text-primary" />
          </div>
          <span className="font-bold tracking-tight">
            Vibe<span className="text-primary">Scan</span>
          </span>
        </Link>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground">
              By accessing or using VibeScan (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree to these terms, do not use the Service. VibeScan is operated by its founders (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Description of Service</h2>
            <p className="text-muted-foreground">
              VibeScan is an AI-powered code security scanner that analyses source code for vulnerabilities, security misconfigurations, and risky patterns. The Service provides automated analysis only — it does not constitute professional security advice or a guarantee that your code is free from vulnerabilities.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. Accounts and Eligibility</h2>
            <p className="text-muted-foreground mb-3">
              You must be at least 16 years old to use the Service. You are responsible for maintaining the confidentiality of your account credentials and for all activity that occurs under your account.
            </p>
            <p className="text-muted-foreground">
              You may not share your account, create multiple accounts for the purpose of circumventing limits, or use the Service on behalf of a third party without their consent.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Acceptable Use</h2>
            <p className="text-muted-foreground mb-3">You agree not to:</p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
              <li>Upload code you do not own or do not have permission to scan</li>
              <li>Attempt to reverse-engineer, scrape, or systematically extract data from the Service</li>
              <li>Use the Service to scan code for the purpose of finding vulnerabilities to exploit</li>
              <li>Upload content that is illegal, harmful, or violates the rights of others</li>
              <li>Attempt to circumvent billing limits, rate limits, or access controls</li>
              <li>Resell or sublicense the Service without our express written permission</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Your Code and Data</h2>
            <p className="text-muted-foreground mb-3">
              You retain all ownership rights to the code you submit for scanning. By submitting code, you grant us a limited, non-exclusive licence to process it solely for the purpose of providing the Service to you.
            </p>
            <p className="text-muted-foreground">
              We do not use your code to train AI models, share it with third parties, or retain it beyond what is necessary to provide the Service. Scan results and findings are stored in your account until you delete them.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Subscriptions and Billing</h2>
            <p className="text-muted-foreground mb-3">
              Paid plans are billed on a monthly or annual basis via Stripe. Prices are listed in EUR and do not include applicable taxes, which may be added depending on your location.
            </p>
            <p className="text-muted-foreground mb-3">
              You may cancel your subscription at any time via the billing portal. Cancellation takes effect at the end of the current billing period — you will retain access until then. We do not provide refunds for partial periods.
            </p>
            <p className="text-muted-foreground">
              We reserve the right to change pricing with 30 days&apos; notice to existing subscribers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Disclaimer of Warranties</h2>
            <p className="text-muted-foreground">
              The Service is provided &quot;as is&quot; and &quot;as available&quot; without warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, error-free, or that scan results will be complete or accurate. Security scanning is probabilistic — VibeScan may miss vulnerabilities or flag false positives.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Limitation of Liability</h2>
            <p className="text-muted-foreground">
              To the fullest extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service, including but not limited to security breaches in code that was scanned by VibeScan. Our total liability to you for any claim arising from the Service shall not exceed the amount you paid us in the 3 months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Termination</h2>
            <p className="text-muted-foreground">
              We may suspend or terminate your account at any time if we reasonably believe you are violating these terms. You may delete your account at any time, which will remove your data from our systems within 30 days, subject to any legal retention obligations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Changes to These Terms</h2>
            <p className="text-muted-foreground">
              We may update these terms from time to time. We will notify you of material changes by email or by displaying a notice in the app. Continued use of the Service after changes take effect constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">11. Governing Law</h2>
            <p className="text-muted-foreground">
              These terms are governed by the laws of England and Wales. Any disputes shall be subject to the exclusive jurisdiction of the courts of England and Wales.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">12. Contact</h2>
            <p className="text-muted-foreground">
              Questions about these terms? Email us at{" "}
              <a href="mailto:hello@vibescan.app" className="text-primary hover:underline">
                hello@vibescan.app
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border flex gap-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">← Back to VibeScan</Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link>
        </div>
      </main>
    </div>
  );
}
