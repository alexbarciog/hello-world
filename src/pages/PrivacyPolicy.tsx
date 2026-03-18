import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Phone, MapPin, Shield, ChevronRight } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";

const sections = [
  {
    id: "intro",
    title: null,
    content: [
      { type: "paragraph", text: "This Privacy Policy describes how we process, handle, or otherwise maintain data we collect, including in connection with your use of our products, services, APIs, apps, and websites that link to this policy (we refer to these collectively as our \"Services\")." },
      { type: "paragraph", text: "Intentsly is committed to protecting and processing your personal information responsibly. We value the data you share with us and treat it with respect." }
    ]
  },
  {
    id: "who-we-are",
    title: "Who Are We?",
    content: [
      { type: "paragraph", text: "Intentsly provides a B2B Marketing Intelligence tool that gives go-to-market teams a comprehensive B2B dataset across company, contact, and IP address intelligence. By using our full dataset, customers are able to enrich key systems, build products, and power personalization." },
      { type: "paragraph", text: "Our Services are designed to help our customers and partners in a wide variety of ways, including by helping them determine which companies might make the best customers, identify the contacts within those organizations by department, role, or seniority to improve or expedite their interactions with those companies, and enabling them to personalize their interactions with those companies." }
    ]
  },
  {
    id: "applies-to",
    title: "What Does This Policy Apply To?",
    content: [
      { type: "paragraph", text: "This Privacy Policy applies to information Intentsly collects or maintains, including through our websites that link to this policy (\"Site\"), software (including APIs, browser extensions, and integrations with third-party software) and other Services." },
      { type: "paragraph", text: "This Privacy Policy includes additional notices that may apply to you if you live in certain jurisdictions, such as residents of the European Economic Area, United Kingdom, Brazil, or California. These notices may include information on how to exercise certain rights you may have with respect to personal information." },
      { type: "paragraph", text: "This Privacy Policy does not apply to the privacy practices of any companies we don't control, including the privacy practices of our customers." }
    ]
  },
  {
    id: "information-collected",
    title: "The Information We Collect",
    content: [
      { type: "paragraph", text: "We collect information in the following ways: (1) information you provide directly to us, (2) information we collect through our Services, (3) information we collect through the use of technologies such as cookies, and (4) information we collect from third parties, including through Intentsly Indexers." }
    ]
  },
  {
    id: "info-direct",
    title: "Information You Provide Directly",
    content: [
      { type: "paragraph", text: "When you browse or visit our Site, contact us, install our free products or set up a user account with us, we might collect information that you voluntarily provide to us. The information we or our vendors collect directly from you may include:" },
      { type: "list", items: [
        "Identifiers, such as your name, business address, email address, and similar identifiers;",
        "Transaction Information, such as the Services you've purchased or considered purchasing;",
        "Professional or Employment-Related Information, such as your job title and/or roles within your employer;",
        "Financial Information, such as credit card or other banking information, billing name, and billing address;",
        "Support Service Information, such as messages submitted to us through email or customer support;",
        "Other Information You Provide, such as feedback, comments, or other information through communications with us."
      ]},
      { type: "paragraph", text: "In accordance with applicable laws, we may record any calls, training sessions, webinars, or similar events that you participate in with us." }
    ]
  },
  {
    id: "info-customers",
    title: "Information from Customer Services",
    content: [
      { type: "paragraph", text: "We may collect information when our customers use our analytics-based, data-driven solutions in their business-to-business marketing and sales efforts. We may receive personal information about your online activity and commercial information based on your interactions with our customers." },
      { type: "paragraph", text: "When our customers use certain Services, Intentsly may receive data from the website visitors of those customers. Some of the data we receive may be considered personal information, such as IP address, cookie identifiers, and other identifiers." }
    ]
  },
  {
    id: "cookies",
    title: "Cookies & Tracking Technologies",
    content: [
      { type: "paragraph", text: "Like many other commercial websites, we may also automatically gather information in connection with your use of the Site or Services through the use of \"cookies\" and other similar technologies such as web server logs, pixels, and end-user website activity." },
      { type: "paragraph", text: "We use third-party analytics services, such as Google Analytics, a web analytics service provided by Google, Inc. Google Analytics uses cookies to help us analyze how users use the Site and enhance your experience when you use the Services." }
    ]
  },
  {
    id: "third-party-info",
    title: "Information from Third Parties",
    content: [
      { type: "paragraph", text: "We or our service providers may collect publicly available information about businesses and the personnel who work or were previously employed with them. Such information could include identifiers, such as name, title, company or business, business contact information, email address, employment history, social media data, and similar information." },
      { type: "paragraph", text: "Third parties, including certain data vendors and our customers, may provide us with information through licensing, sponsorship, or other agreements." }
    ]
  },
  {
    id: "indexers",
    title: "Intentsly Indexers",
    content: [
      { type: "paragraph", text: "Our proprietary indexing systems (\"Intentsly Indexers\") collect information from a variety of sources in order to compile \"Attribute Data\" about corporations, non-profits, and similar entities (\"Companies\") and the professionals that work for them (\"Professionals\")." },
      { type: "paragraph", text: "Our Intentsly Indexers collect a variety of information and data for purposes of creating our database of Attribute Data and for providing, improving, and maintaining the Services. We collect personal information as Attribute Data in the following ways: (1) from publicly accessible sources, both online and offline; (2) through licensing agreements directly with data brokers or other Companies; and (3) directly contributed by individuals about both Professionals and Companies." }
    ]
  },
  {
    id: "how-we-use",
    title: "How We Use Your Information",
    content: [
      { type: "paragraph", text: "We may use the information we collect in the following ways:" },
      { type: "list", items: [
        "We may use Business Profile Information to provide enriched data to our customers and partners for their business-to-business marketing and sales purposes.",
        "For our operational purposes, such as responding to your inquiries, maintaining and servicing your account, providing customer service, processing payments, and similar purposes.",
        "For auditing, security, debugging, internal research and development, maintaining the quality and safety of our Services.",
        "To maintain, improve, and enhance the functionality and quality of our Site and other Services.",
        "To communicate with you about your accounts and activities involving us and our services.",
        "To enforce the legal terms that govern use of our Services, including to identify, prevent, and stop possible fraudulent activity.",
        "To comply with regulatory requirements.",
        "To personalize your experience and customize the Services.",
        "For internal research and development purposes."
      ]}
    ]
  },
  {
    id: "disclosures",
    title: "Disclosures & Transfers",
    content: [
      { type: "paragraph", text: "We may disclose information in the following situations:" }
    ]
  },
  {
    id: "with-customers",
    title: "With Customers",
    content: [
      { type: "paragraph", text: "We disclose information, such as Attribute Data, to our customers who may use this data for their internal sales and marketing operations, or in certain cases and with our permission, use it as part of their in-product offering." }
    ]
  },
  {
    id: "service-providers",
    title: "Service Providers",
    content: [
      { type: "paragraph", text: "We also disclose information with service providers and third parties for our operational purposes and other business purposes. Among other things, our service providers may provide web hosting, data analysis, payment processing, order fulfillment, information technology and related infrastructure, customer service, email delivery, security and other auditing, and similar services." }
    ]
  },
  {
    id: "law-enforcement",
    title: "Legal Requirements",
    content: [
      { type: "paragraph", text: "We may disclose information about you to law enforcement, government officials, or other third parties if we believe in our sole discretion that it is absolutely necessary or appropriate in order to (i) respond to a subpoena, court order, or other binding legal process; (ii) comply with laws, statutes, rules, or regulations; (iii) prevent physical or other harm; or (iv) report suspected illegal activity." },
      { type: "paragraph", text: "In addition, we may disclose personal information as necessary in the event of a contemplated or actual merger, acquisition, reorganization, bankruptcy, or similar event." }
    ]
  },
  {
    id: "business-partners",
    title: "Business Partners",
    content: [
      { type: "paragraph", text: "We may disclose personal information to our business partners and affiliates to fulfill our contractual commitments, or to provide you with a product or service that you have requested. We also disclose this information for marketing or sales purposes." }
    ]
  },
  {
    id: "data-rights",
    title: "Your Data Rights",
    content: [
      { type: "paragraph", text: "You have certain choices about your personal information. If you have questions or concerns regarding Intentsly's collection, use or disclosure of your personal information, or if you wish to exercise your rights, including the right to be removed from our Database, please contact us at privacy@intentsly.com." },
      { type: "list", items: [
        "Opt Out of Cookies and Other Similar Technologies. Your browser or device can allow you to opt out of data collection through cookies or similar technologies.",
        "Opt Out of Marketing Communications. If you wish to opt out of our use of your contact information for our email marketing purposes, you can click the \"Unsubscribe\" button in any marketing email from us.",
        "Additional Rights. Depending on where you are located, you may have additional rights regarding your personal information."
      ]}
    ]
  },
  {
    id: "data-privacy-framework",
    title: "Data Privacy Framework",
    content: [
      { type: "paragraph", text: "Intentsly complies with the EU-U.S. Data Privacy Framework (EU-U.S. DPF), the UK Extension to the EU-U.S. DPF, and the Swiss-U.S. Data Privacy Framework (Swiss-U.S. DPF) as set forth by the U.S. Department of Commerce." },
      { type: "paragraph", text: "In compliance with the Data Privacy Framework, Intentsly commits to resolving complaints about privacy and its collection or use of your personal information within forty-five (45) days of receipt." }
    ]
  },
  {
    id: "international-transfers",
    title: "International Transfers",
    content: [
      { type: "paragraph", text: "Intentsly is based in the United States. Your personal information may be collected, transferred to, stored and otherwise processed in any country where we have facilities or in which we engage service providers." },
      { type: "paragraph", text: "When we transfer personal information outside the EEA, UK, or Switzerland, we use a variety of legal mechanisms to safeguard the transfer, including the European Commission-approved Data Privacy Framework and the EU Standard Contractual Clauses." }
    ]
  },
  {
    id: "jurisdictions",
    title: "Jurisdiction-Specific Notices",
    content: [
      { type: "paragraph", text: "You may be entitled to additional privacy notices depending on where you are located. Applicable state law may give you certain rights to: confirm processing, correct inaccuracies, delete your personal information, receive a portable copy, and opt out of targeted advertising or sale of your personal information." }
    ]
  },
  {
    id: "security",
    title: "Security & Data Retention",
    content: [
      { type: "paragraph", text: "Intentsly considers the security of all the information and data within our control to be a top priority. We implement technical and organizational safeguards to protect from accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, such information or data." },
      { type: "paragraph", text: "Intentsly retains the information described in this Privacy Policy for as long as is necessary to comply with legal obligations, enforce our agreements, maintain existing relationships with our customers, and otherwise as might be necessary for our legitimate business interests." }
    ]
  },
  {
    id: "children",
    title: "Children's Privacy",
    content: [
      { type: "paragraph", text: "Intentsly provides business services, and as such we do not direct our services towards individuals under the age of 18. We do not knowingly collect personal information from individuals under the age of 18. If you become aware that Intentsly has improperly collected information from individuals under the age of 18, please contact us immediately at privacy@intentsly.com." }
    ]
  },
  {
    id: "updates",
    title: "Policy Updates",
    content: [
      { type: "paragraph", text: "We may update this Privacy Policy from time to time. If we make material changes to this policy, we will notify you, as appropriate, depending on the substance of the change, by email or by means of a notice on our website's homepage." }
    ]
  },
  {
    id: "contact",
    title: "Contact Us",
    content: [
      { type: "paragraph", text: "If you wish to ask us any questions about this Privacy Policy, or to exercise any of your rights described in this Privacy Policy, we can be reached in the following ways:" },
      { type: "list", items: [
        "To exercise your rights, please email our privacy team using the contact details below.",
        "Our toll-free phone number for privacy inquiries is (866) 241-4820.",
        "You can also email us at privacy@intentsly.com."
      ]},
      { type: "address", lines: ["Intentsly", "ATTN: Privacy Team", "2 Canal Park", "Cambridge, MA 02141"] }
    ]
  }
];

type SectionItem =
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] }
  | { type: "address"; lines: string[] };

const tocItems = sections
  .filter((s) => s.title !== null)
  .map((s) => ({ id: s.id, title: s.title as string }));

export default function PrivacyPolicy() {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        });
      },
      { rootMargin: "-20% 0% -70% 0%" }
    );
    tocItems.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background">

      {/* ── Sticky nav ── */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
            <span className="font-semibold text-sm text-foreground">intentsly</span>
          </Link>
          <Link
            to="/register"
            className="btn-cta text-sm py-2 px-4"
            style={{ borderRadius: "500px" }}
          >
            Get started free
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden py-24 px-6">
        {/* Video bg */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
          src="/videos/hero-gradient.webm"
          autoPlay
          loop
          muted
          playsInline
        />
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(180deg, transparent 50%, hsl(var(--background)) 100%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-background/80 border border-border rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6 backdrop-blur-sm">
            <Shield className="w-3.5 h-3.5 text-goji-coral" />
            Legal
          </div>
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-foreground leading-tight">
            Privacy Policy
          </h1>
          <p className="mt-5 text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            We believe privacy is a right, not a privilege. Here's exactly how we collect, use, and protect your information.
          </p>
          <p className="mt-4 text-sm text-muted-foreground">Last updated: May 30, 2025</p>
        </div>
      </div>

      {/* ── Layout: TOC + Content ── */}
      <div className="max-w-6xl mx-auto px-6 pb-24 flex gap-12 items-start">

        {/* Table of contents – sticky sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 sticky top-24 self-start">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">Contents</p>
          <nav className="flex flex-col gap-0.5">
            {tocItems.map(({ id, title }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`group flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg transition-all duration-150 ${
                  activeId === id
                    ? "text-foreground font-medium bg-secondary"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                }`}
              >
                <ChevronRight
                  className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                    activeId === id ? "text-goji-coral translate-x-0.5" : "opacity-0 group-hover:opacity-60"
                  }`}
                />
                <span className="leading-snug">{title}</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">

          {/* Intro card */}
          <div
            className="rounded-3xl p-6 mb-10 border border-border"
            style={{ background: "hsl(var(--goji-bg-hero))" }}
          >
            {(sections[0].content as SectionItem[]).map((block, i) =>
              block.type === "paragraph" ? (
                <p key={i} className="text-[15px] leading-7 text-foreground/80 mb-3 last:mb-0">
                  {block.text}
                </p>
              ) : null
            )}
          </div>

          {/* Sections */}
          {sections.slice(1).map((section) => (
            <div
              key={section.id}
              id={section.id}
              className="mb-2 scroll-mt-28"
            >
              {section.title && (
                <h2 className="text-xl font-semibold text-foreground mb-4 mt-10">
                  {section.title}
                </h2>
              )}

              {(section.content as SectionItem[]).map((block, i) => {
                if (block.type === "paragraph") {
                  return (
                    <p key={i} className="text-[15px] leading-7 text-muted-foreground mb-4">
                      {block.text}
                    </p>
                  );
                }
                if (block.type === "list") {
                  return (
                    <ul key={i} className="space-y-2.5 mb-4">
                      {block.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-3 text-[15px] leading-7 text-muted-foreground">
                          <span
                            className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ background: "hsl(var(--goji-coral))" }}
                          />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  );
                }
                if (block.type === "address") {
                  return (
                    <div
                      key={i}
                      className="mt-4 rounded-2xl border border-border p-5 flex gap-3"
                      style={{ background: "hsl(0 0% 98%)" }}
                    >
                      <MapPin className="w-4 h-4 text-goji-coral shrink-0 mt-0.5" />
                      <address className="not-italic text-[15px] leading-7 text-muted-foreground">
                        {block.lines.map((line, j) => (
                          <span key={j} className="block">{line}</span>
                        ))}
                      </address>
                    </div>
                  );
                }
                return null;
              })}

              <div className="border-b border-border mt-8" />
            </div>
          ))}

          {/* Contact cards */}
          <div className="mt-12 grid sm:grid-cols-2 gap-4">
            <a
              href="mailto:privacy@intentsly.com"
              className="rounded-2xl border border-border p-5 flex items-start gap-4 hover:border-goji-coral/40 transition-colors group"
              style={{ background: "hsl(0 0% 99%)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--goji-bg-hero))" }}
              >
                <Mail className="w-4 h-4 text-goji-coral" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">Email us</p>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  privacy@intentsly.com
                </p>
              </div>
            </a>
            <div
              className="rounded-2xl border border-border p-5 flex items-start gap-4"
              style={{ background: "hsl(0 0% 99%)" }}
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--goji-bg-hero))" }}
              >
                <Phone className="w-4 h-4 text-goji-coral" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">Call us</p>
                <p className="text-sm text-muted-foreground">(866) 241-4820</p>
              </div>
            </div>
          </div>

          {/* Back link */}
          <div className="mt-10 flex items-center gap-2">
            <Link
              to="/register"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to registration
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
