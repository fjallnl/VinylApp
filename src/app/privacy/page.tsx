import type { Metadata } from "next";
import Link from "next/link";
import { Disc3 } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy & Cookies · Vinyl Collection",
};

const LAST_UPDATED = "9 October 2026";

type StorageItem = {
  name: string;
  kind: string;
  purpose: string;
  retention: string;
};

const STORAGE_ITEMS: StorageItem[] = [
  {
    name: "authjs.session-token",
    kind: "Cookie (HttpOnly)",
    purpose: "Keeps you signed in after logging in.",
    retention: "30 days, or until you sign out",
  },
  {
    name: "authjs.csrf-token",
    kind: "Cookie (HttpOnly)",
    purpose: "Protects the sign-in form against cross-site request forgery.",
    retention: "Until you close your browser",
  },
  {
    name: "authjs.callback-url",
    kind: "Cookie",
    purpose: "Remembers which page to return to after signing in.",
    retention: "Until you close your browser",
  },
  {
    name: "vinyl.nav.desktopCollapsed",
    kind: "Local storage",
    purpose: "Remembers whether you collapsed the navigation sidebar.",
    retention: "Until you clear your browser data",
  },
];

const sectionClass = "space-y-3";
const headingClass = "text-sm font-bold uppercase tracking-widest text-accent";
const textClass = "text-sm text-muted leading-relaxed";

export default function PrivacyPage() {
  const controllerName = process.env.PRIVACY_CONTROLLER_NAME || "the operator of this website";
  const contactEmail = process.env.PRIVACY_CONTACT_EMAIL;

  return (
    <div className="min-h-screen p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-10">
          <Link href="/" className="flex items-center gap-2">
            <Disc3 size={22} className="text-accent" />
            <span className="text-sm font-bold uppercase tracking-widest">Vinyl Collection</span>
          </Link>
        </header>

        <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-widest mb-2">Privacy &amp; Cookies</h1>
        <p className="text-dim text-xs uppercase tracking-widest mb-10">Last updated: {LAST_UPDATED}</p>

        <div className="bg-surface border border-card rounded-3xl p-6 md:p-8 space-y-10">
          <section className={sectionClass}>
            <h2 className={headingClass}>Who we are</h2>
            <p className={textClass}>
              Vinyl Collection is a personal record collection manager. The controller for the personal data
              processed through this website is {controllerName}.{" "}
              {contactEmail ? (
                <>
                  For any privacy question or request, email{" "}
                  <a href={`mailto:${contactEmail}`} className="text-accent hover:underline">
                    {contactEmail}
                  </a>
                  .
                </>
              ) : (
                <>For any privacy question or request, contact the site administrator.</>
              )}
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Cookies and local storage</h2>
            <p className={textClass}>
              We only use cookies and browser storage that are strictly necessary for the website to work or that
              store a preference you set yourself. We do not use advertising, tracking or third-party cookies, so we
              do not ask for cookie consent. Blocking these cookies will prevent you from signing in.
            </p>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-left text-xs min-w-[520px]">
                <thead>
                  <tr className="text-dim uppercase tracking-widest">
                    <th className="px-2 py-2 font-semibold">Name</th>
                    <th className="px-2 py-2 font-semibold">Type</th>
                    <th className="px-2 py-2 font-semibold">Purpose</th>
                    <th className="px-2 py-2 font-semibold">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {STORAGE_ITEMS.map((item) => (
                    <tr key={item.name} className="border-t border-subtle align-top">
                      <td className="px-2 py-2.5 font-mono text-secondary break-all">{item.name}</td>
                      <td className="px-2 py-2.5 text-muted">{item.kind}</td>
                      <td className="px-2 py-2.5 text-muted">{item.purpose}</td>
                      <td className="px-2 py-2.5 text-muted">{item.retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className={textClass}>
              On HTTPS connections the cookie names carry a <code className="font-mono">__Secure-</code> or{" "}
              <code className="font-mono">__Host-</code> prefix.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Analytics</h2>
            <p className={textClass}>
              We use Vercel Web Analytics to count page views. It does not set cookies or store anything on your
              device, and it does not track you across websites. Visitors are counted using a hash of the request
              that is discarded after 24 hours, so individual visitors cannot be identified. We use these statistics
              only to understand how the website is used (legitimate interest).
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>What personal data we process</h2>
            <ul className={`${textClass} list-disc pl-5 space-y-2`}>
              <li>
                <span className="text-secondary">Account data</span>: email address, optional name, a hashed
                password (never the password itself), your role, your theme preference and when your account was
                created and verified. We need this to provide your account (performance of a contract).
              </li>
              <li>
                <span className="text-secondary">Collection data</span>: the records, tracks, wantlist items,
                ratings, conditions, notes, purchase prices and dates and cover images you add. This data is only
                visible to you and is stored to provide the service.
              </li>
              <li>
                <span className="text-secondary">Email verification</span>: when you register we send a
                verification email. We store a hashed, single-use token that expires after 60 minutes.
              </li>
              <li>
                <span className="text-secondary">Security data</span>: IP addresses and email addresses are
                briefly kept in server memory to limit repeated registration and verification attempts. They are
                not written to the database and are cleared after at most one hour (legitimate interest:
                preventing abuse).
              </li>
              <li>
                <span className="text-secondary">Camera</span>: the barcode scanner uses your camera only in
                your browser. Camera images are never uploaded.
              </li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Third parties</h2>
            <p className={textClass}>We do not sell your data. We share it only with these service providers:</p>
            <ul className={`${textClass} list-disc pl-5 space-y-2`}>
              <li>
                <span className="text-secondary">SMTP2GO</span>: delivers verification emails and receives your
                email address for that purpose.
              </li>
              <li>
                <span className="text-secondary">Vercel</span>: provides the anonymous page-view analytics
                described above.
              </li>
              <li>
                <span className="text-secondary">Discogs</span>: search terms and barcodes you look up are sent
                to the Discogs API from our server. Your account details are not shared with Discogs.
              </li>
            </ul>
            <p className={textClass}>
              Where a provider processes data outside the European Economic Area, this is done under appropriate
              safeguards such as the EU-US Data Privacy Framework or standard contractual clauses.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>How long we keep your data</h2>
            <p className={textClass}>
              We keep your account and collection data for as long as your account exists. When your account is
              deleted, your records, wantlist and tokens are deleted with it. Unverified registrations and expired
              tokens serve no further purpose and may be removed at any time.
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Your rights</h2>
            <p className={textClass}>
              Under the GDPR you have the right to access, correct and delete your personal data, to receive a
              copy of it in a portable format, to restrict or object to its processing, and to withdraw any consent
              you have given. To exercise these rights, contact us using the details above; we will respond within
              one month. You also have the right to lodge a complaint with your data protection authority, in the
              Netherlands the{" "}
              <a
                href="https://www.autoriteitpersoonsgegevens.nl"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Autoriteit Persoonsgegevens
              </a>
              .
            </p>
          </section>

          <section className={sectionClass}>
            <h2 className={headingClass}>Changes</h2>
            <p className={textClass}>
              If we start using cookies or tools that require your consent, we will update this page and ask for
              your consent before using them.
            </p>
          </section>
        </div>

        <p className="text-center text-xs text-dim mt-8">
          <Link href="/" className="text-accent hover:underline">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
