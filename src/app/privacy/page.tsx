import Link from "next/link";
import { Shield } from "lucide-react";

export const metadata = {
  title: "Privacy Policy — VibeScan",
};

const LAST_UPDATED = "April 2026";

export default function PrivacyPage() {
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
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="prose prose-invert prose-zinc max-w-none space-y-8 text-sm leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold mb-3">1. Overview</h2>
            <p className="text-muted-foreground">
              VibeScan (&quot;we&quot;, &quot;us&quot;, &quot;our&quot;) is committed to protecting your privacy. This policy explains what data we collect, why we collect it, and how we use it when you use VibeScan at vibescan.app.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. Data We Collect</h2>

            <h3 className="font-medium text-foreground mb-2 mt-4">Account data</h3>
            <p className="text-muted-foreground mb-3">
              When you sign in, we store your email address, name (if provided), and a profile image URL from your OAuth provider (GitHub). This is used to identify your account and personalise your experience.
            </p>

            <h3 className="font-medium text-foreground mb-2 mt-4">Code you submit</h3>
            <p className="text-muted-foreground mb-3">
              When you scan code, we process and store the scan results (findings, severity, file paths, line numbers, code snippets) associated with your account. We store this so you can view historical scan results. We do not store the full contents of your submitted code beyond what is necessary to display scan results.
            </p>

            <h3 className="font-medium text-foreground mb-2 mt-4">GitHub integration</h3>
            <p className="text-muted-foreground mb-3">
              If you connect GitHub, we store an OAuth access token scoped to read your repositories. This token is used only to download code for scanning on your request and to post PR review comments. We do not access, store, or index your repository contents beyond what is needed for an active scan.
            </p>

            <h3 className="font-medium text-foreground mb-2 mt-4">Billing data</h3>
            <p className="text-muted-foreground mb-3">
              Payment processing is handled by Stripe. We store your Stripe customer ID and subscription status, but never your card number or full payment details — those remain with Stripe under their own privacy policy.
            </p>

            <h3 className="font-medium text-foreground mb-2 mt-4">Usage data</h3>
            <p className="text-muted-foreground">
              We collect basic server logs (request timestamps, response codes) for operational purposes. We do not use third-party analytics trackers.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. How We Use Your Data</h2>
            <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
              <li>To provide, operate, and improve the Service</li>
              <li>To authenticate you and keep your account secure</li>
              <li>To send transactional emails (magic link sign-in, subscription confirmation)</li>
              <li>To enforce usage limits and billing</li>
              <li>To respond to support requests</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              We do not sell your data. We do not use your code to train AI models. We do not share your data with third parties except as described in section 4.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. Third-Party Services</h2>
            <p className="text-muted-foreground mb-3">We use the following sub-processors:</p>
            <div className="rounded-lg border border-border overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Service</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Purpose</th>
                    <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">Data shared</th>
                  </tr>
                </thead>
                <tbody className="text-muted-foreground">
                  {[
                    ["Railway", "Database and app hosting", "All stored data (hosted infrastructure)"],
                    ["Stripe", "Payment processing", "Email, billing details"],
                    ["Resend", "Transactional email", "Email address"],
                    ["OpenAI", "AI-powered explanations", "Code snippets from findings (not full files)"],
                    ["GitHub", "OAuth sign-in and repo access", "OAuth token, repo contents during scan"],
                  ].map(([service, purpose, data]) => (
                    <tr key={service} className="border-b border-border/50">
                      <td className="px-4 py-2.5 font-medium text-foreground">{service}</td>
                      <td className="px-4 py-2.5">{purpose}</td>
                      <td className="px-4 py-2.5">{data}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. Data Retention</h2>
            <p className="text-muted-foreground mb-3">
              Scan results are retained until you delete them or delete your account. When you delete a scan, all associated findings are permanently removed.
            </p>
            <p className="text-muted-foreground">
              When you delete your account, we remove your personal data within 30 days, except where we are required to retain it for legal or compliance reasons (e.g., billing records for tax purposes, retained for up to 7 years).
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. Cookies</h2>
            <p className="text-muted-foreground">
              We use a single session cookie to keep you signed in. We do not use advertising cookies or third-party tracking cookies. No cookie consent banner is required for essential session cookies under PECR.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. Your Rights (GDPR)</h2>
            <p className="text-muted-foreground mb-3">
              If you are located in the EEA or UK, you have the following rights under GDPR:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-1.5 ml-2">
              <li><strong className="text-foreground">Access</strong> — request a copy of the data we hold about you</li>
              <li><strong className="text-foreground">Rectification</strong> — ask us to correct inaccurate data</li>
              <li><strong className="text-foreground">Erasure</strong> — ask us to delete your account and associated data</li>
              <li><strong className="text-foreground">Portability</strong> — request your data in a machine-readable format</li>
              <li><strong className="text-foreground">Objection</strong> — object to processing where we rely on legitimate interests</li>
            </ul>
            <p className="text-muted-foreground mt-3">
              To exercise any of these rights, email{" "}
              <a href="mailto:hello@vibescan.app" className="text-primary hover:underline">
                hello@vibescan.app
              </a>. We will respond within 30 days.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. Security</h2>
            <p className="text-muted-foreground">
              We implement industry-standard security measures including encrypted connections (HTTPS), hashed session tokens, and access controls. However, no system is completely secure. If you discover a security vulnerability in VibeScan, please disclose it responsibly to{" "}
              <a href="mailto:hello@vibescan.app" className="text-primary hover:underline">
                hello@vibescan.app
              </a>.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">9. Changes to This Policy</h2>
            <p className="text-muted-foreground">
              We may update this policy from time to time. We will notify you of material changes by email. The &quot;last updated&quot; date at the top reflects the most recent revision.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">10. Contact</h2>
            <p className="text-muted-foreground">
              Questions or concerns about your privacy? Contact us at{" "}
              <a href="mailto:hello@vibescan.app" className="text-primary hover:underline">
                hello@vibescan.app
              </a>
            </p>
          </section>

        </div>

        <div className="mt-12 pt-6 border-t border-border flex gap-6 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition-colors">← Back to VibeScan</Link>
          <Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link>
        </div>
      </main>
    </div>
  );
}
