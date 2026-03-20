import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, Mail, Phone, MapPin, FileText, ChevronRight } from "lucide-react";
import intentslyIcon from "@/assets/intentsly-icon.png";

const sections = [
{
  id: "intro",
  title: null,
  content: [
  { type: "paragraph", text: "These Intentsly Terms of Service (\"Terms\" or \"Customer Terms\") apply to Intentsly customers with services beginning on or after January 2, 2024. By accessing our site or otherwise using the Intentsly Services, you acknowledge that you have read, understood, and agree to be bound by these Terms." },
  { type: "paragraph", text: "If you are entering into these Terms on behalf of a business or other legal entity, you represent that you have the authority to bind the entity and its affiliates to these Terms, in which case the terms \"You\", \"Your,\" or \"Customer\" shall refer to the entity and its affiliates." }]

},
{
  id: "customer-terms",
  title: "Customer Terms",
  content: [
  { type: "paragraph", text: "APIHub, Inc. dba Intentsly has assigned these Terms to its Affiliate, HubSpot, Inc. (\"HubSpot\"). HubSpot, Inc., under its Intentsly brand, (\"Intentsly\" or \"We\"), provides Intentsly Services (defined below) subject to these Terms." },
  { type: "paragraph", text: "By clicking or tapping any button or box marked \"Accept,\" \"Agree,\" or \"OK\" (or a similar term) in connection with these Terms, or by accessing our site or otherwise using the Intentsly Services, you acknowledge that you have read, understood, and agree to be bound by these Terms and affirm that you are over the age of 18." },
  { type: "callout", text: "PAID SUBSCRIPTION PLANS PURCHASED THROUGH SELF-SERVICE ON THE SITE OR THROUGH OUR RESELLERS WILL AUTOMATICALLY RENEW UNTIL YOU CANCEL THEM PURSUANT TO SECTION 5 OF THESE TERMS. CANCELING WILL END THE AUTOMATIC RENEWALS OF YOUR PAID SERVICES, BUT WE WILL KEEP ANY FEES WE HAVE ALREADY COLLECTED FROM YOU (UNLESS WE ARE REQUIRED BY LAW TO REFUND THEM)." }]

},
{
  id: "definitions",
  title: "1. Definitions",
  content: [
  { type: "list", items: [
    "\"Authorized User\" means an employee, contractor, or agent of Customer who is authorized to use the Intentsly Services and who has access via a unique username and password under Your Account.",
    "\"Affiliate\" means any entity that directly or indirectly controls, is controlled by, or is under common control with the Customer. \"Control\" means direct or indirect ownership or control of more than 50% of the voting interests.",
    "\"Intentsly Services\" means any services provided by Intentsly, including the Intentsly online platform, APIs, Product Data, other services accessible via our website, including any successor products and services.",
    "\"Intentsly Tags\" means Intentsly's JavaScript, pixels, cookies or similar code or technology for implementing the Services.",
    "\"Competitor\" means any company that is selling products or services that are the same or substantially similar to the Intentsly Services.",
    "\"Customer Data\" means personal contact information regarding Authorized Users, and all personal data or other materials solely provided by you to Intentsly in connection with the Services.",
    "\"Documentation\" means Intentsly's then-current technical or user documentation or specifications.",
    "\"Order\" means any order form signed by the parties that references these Terms and describes the services to be provided by Intentsly and the fees paid by Customer.",
    "\"Product Data\" means any data, reports, text, images, sound, video, code, insights, any other content made available by Intentsly through the Services.",
    "\"Services\" means the services provided to You by Intentsly as indicated in your self-serve account, if applicable, in the applicable Order, including all or part of the Intentsly Services, Product Data, and Support.",
    "\"Service Fees\" means the fees Intentsly charges and You pay for the Services as specified in the applicable Order.",
    "\"Subscription\" means Services selected through the self-serve option on Intentsly's website or purchased through an Order."]
  }]

},
{
  id: "services",
  title: "2. Services",
  content: [
  { type: "paragraph", text: "2.1. Provision of Services: We will provide the Services to You and Your Affiliate(s) (so long as neither You nor such Affiliate(s) is a Competitor to Intentsly) in accordance with the applicable Order and these Terms. At the beginning of the Initial Term, You will receive access to a Intentsly Services account (\"Your Account\")." },
  { type: "paragraph", text: "2.2. Use of Services: You are solely responsible for the acts and omissions of Your Authorized Users, including their use of the Services. You and Your Authorized Users will maintain the security of their usernames and passwords." },
  { type: "paragraph", text: "2.3. Customer Restrictions: You and Your Authorized Users must not: (a) use the Intentsly Services to provide services or Product Data to third parties or otherwise reproduce, license, sell, rent, or sublicense the Intentsly Services or Product Data; (b) use the Intentsly Services in any manner that is defamatory, obscene, or violates rights of another; (c) decompile, disassemble, reverse engineer or otherwise attempt to access source code; or (d) submit malicious content or use the Services to spam others." },
  { type: "paragraph", text: "2.4. Customer Compliance: You and Your Authorized Users shall be permitted to access or use the Intentsly Services solely for the business-to-business sales, marketing, or business development activities of Customer (the \"Permitted Uses\")." },
  { type: "paragraph", text: "2.5. Services Limits: You and Your Authorized Users shall not override or circumvent any security feature, control, or use limits of the Intentsly Services." },
  { type: "paragraph", text: "2.6. Intentsly Tags: To the extent the Services include use of the Intentsly Tags on Customer's websites or digital properties, Customer acknowledges it shall implement the current version of Intentsly Tags in accordance with the Documentation." },
  { type: "paragraph", text: "2.7. Modifications & Updates: We may modify the Service and Limits from time to time, including changes that may materially reduce the functionality provided." },
  { type: "paragraph", text: "2.8. Enrichment: The Intentsly Services include enrichment features, which will transmit Customer Data to Intentsly and its Affiliates for purposes of matching, cleansing, or updating records with information from Intentsly's commercial database." },
  { type: "paragraph", text: "2.9. Third Party Applications: Customer may be able to use the Service through integrations, webhooks or other connections to one or more Third-Party Applications. Customer is responsible for complying with all applicable third-party terms, policies and licenses." },
  { type: "paragraph", text: "2.10. Suspension of Services: Intentsly may immediately suspend or limit Your access to the Services in the event of unauthorized or unlawful access or use in violation of these Terms or applicable law." },
  { type: "paragraph", text: "2.11. Free Plans: If You elect to use the Intentsly Services under the limited free-to-use option, We may terminate Your use of the Services for any reason without any required prior notice." },
  { type: "paragraph", text: "2.12. Beta Services: \"Beta Services\" means a Service designated as alpha, beta, experimental, pilot, or similar. Beta Services are offered solely for experimental purposes and without warranty of any kind." },
  { type: "paragraph", text: "2.13. Accuracy of Product Data: During the term of these Terms, Intentsly agrees to take commercially reasonable steps to correct errors and omissions in Product Data when discovered." },
  { type: "paragraph", text: "2.14. Customer Security: Customer affirms that all locations within Customer's environment where Product Data is stored have implemented industry-standard physical, technical, and administrative controls." }]

},
{
  id: "data-rights",
  title: "3. Data Rights, Privacy & Security",
  content: [
  { type: "paragraph", text: "3.1. Customer License to Customer Data: You hereby authorize and grant to Intentsly and its Affiliates a worldwide, limited, non-exclusive, perpetual license to use, store, process, transfer, reproduce, distribute, perform, display, and create derivative works of Customer Data for the purpose of providing the Intentsly Services." },
  { type: "paragraph", text: "3.2. Customer Data Obligations: You are responsible for Customer Data, including the content, accuracy, and integrity of Customer Data. You represent and warrant that you have provided and will continue to provide adequate notices and obtain necessary permissions and consents." },
  { type: "paragraph", text: "3.3. Personal Data Obligations: The Intentsly Data Processing Agreement (\"DPA\") is hereby incorporated by reference into these Terms. Each party shall comply with their respective obligations under the DPA." },
  { type: "paragraph", text: "3.4. Usage Data: Notwithstanding anything to the contrary, Intentsly and its Affiliates may collect, use, and analyze general information and data from its customers for purposes such as research, marketing, analysis, and benchmarking." },
  { type: "paragraph", text: "3.5. Privacy Policy: Customer acknowledges our Privacy Policy sets out how we process personal data in connection with the Intentsly Services." }]

},
{
  id: "payment",
  title: "4. Payment & Taxes",
  content: [
  { type: "paragraph", text: "4.1. Self-Service Subscriptions: All payment obligations are non-cancelable and all amounts paid are non-refundable, except as specifically provided for in these terms. Your Subscription will automatically renew each billing cycle on a recurring basis until you cancel." },
  { type: "paragraph", text: "4.2. Invoicing: If you purchase a Subscription through a separately executed Order, Intentsly or its Affiliates will invoice You for amounts due and You will pay all undisputed Service Fees within 30 days of receipt of invoice." },
  { type: "paragraph", text: "4.3. Credit Card Payments: If Customer provides credit or debit card details for the payment of fees, Customer represents that it is authorized to use such Payment Card and authorizes Intentsly to charge it on a periodic basis." },
  { type: "paragraph", text: "4.4. Taxes: All Service Fees are exclusive of taxes. You agree to pay any taxes applicable to your use of the Services." },
  { type: "paragraph", text: "4.5. Purchase Orders: Any purchase order issued by Customer is for Customer's internal purposes only, and any terms in such purchase order are rejected by Intentsly." },
  { type: "paragraph", text: "4.6. Usage Limits: You are responsible for complying with usage limits. Non-paying users of the Services are expressly forbidden from caching or otherwise storing the Product Data." },
  { type: "paragraph", text: "4.7. Records Retention: During the Term, you will take commercially reasonable efforts to maintain complete and accurate records of your use of the Service sufficient to verify compliance with these Terms." }]

},
{
  id: "term-termination",
  title: "5. Term & Termination",
  content: [
  { type: "paragraph", text: "5.1. Term: These Terms will commence on the date that you are first provided with use or access to the Service. Upon expiration of the applicable Initial Term, the term will automatically renew. Either party may opt-out by providing written notice at least thirty (30) days prior to expiration of the then-current Subscription Term." },
  { type: "paragraph", text: "5.2. Termination: Either party may terminate these Terms upon written notice if the other party is in material breach and fails to cure within thirty (30) days of notice; or if the other party becomes subject to bankruptcy or insolvency proceedings." },
  { type: "paragraph", text: "5.3. Effect of Termination: Upon termination, Intentsly will cease providing the Services and promptly invoice Customer for any unpaid amounts owed. Upon termination due to Intentsly's material breach, Intentsly will refund a pro-rata portion of prepaid fees." },
  { type: "paragraph", text: "5.4. Product Data & Termination: Upon expiration or termination, You and Your Authorized Users shall cease accessing the Services. You shall not be required to delete Product Data (unless required by law) as long as you have an independent legal basis to use such data." }]

},
{
  id: "nondisclosure",
  title: "6. Nondisclosure",
  content: [
  { type: "paragraph", text: "6.1. Obligations: During the Term and for three (3) years after termination (except for trade secrets), each Receiving Party will not use or disclose Confidential Information of the Disclosing Party other than in connection with the provision or receipt of the Intentsly Services." },
  { type: "paragraph", text: "6.2. Definition of Confidential Information: \"Confidential Information\" means all information, material and data of the Disclosing Party which is labeled or designated as confidential, or which the Receiving Party knows or reasonably should know is confidential." },
  { type: "paragraph", text: "6.3. Exceptions: Confidentiality obligations will not apply to information that is publicly known, was in Receiving Party's possession prior to disclosure, or is independently developed without reference to Confidential Information." },
  { type: "paragraph", text: "6.4. Injunctive Relief: Any unauthorized use or disclosure may cause irreparable damage, and both parties agree that injunctive or equitable relief may be sought." },
  { type: "paragraph", text: "6.5. Required Disclosures: If disclosure is required to comply with a judicial or governmental order, the Receiving Party will, unless prohibited by law, notify the Disclosing Party before making such disclosure." }]

},
{
  id: "warranties",
  title: "7. Warranties",
  content: [
  { type: "paragraph", text: "7.1. Intentsly Warranties: Intentsly warrants that it will provide the Services in a professional manner, consistent with recognized industry standards, and that it has the authority and right to enter into these Terms." },
  { type: "paragraph", text: "7.2. Customer Warranties: Customer warrants that it has the authority and right to enter into these Terms and that it will comply with all applicable laws in its use of the Services." },
  { type: "callout", text: "7.3. Disclaimer of Warranties: WITH THE EXCEPTION OF THOSE EXPRESS WARRANTIES MADE IN THIS SECTION 7, TO THE MAXIMUM EXTENT PERMITTED BY LAW, EACH PARTY DISCLAIMS ALL WARRANTIES WHETHER EXPRESS, IMPLIED OR STATUTORY." }]

},
{
  id: "intellectual-property",
  title: "8. Intellectual Property",
  content: [
  { type: "paragraph", text: "8.1. Intellectual Property Rights: You acknowledge that Intentsly and its Affiliates owns and retains all right, title and interest in the Intellectual Property Rights in the Services and Product Data, including any Product Data that You download, print, save or incorporate into other materials." },
  { type: "paragraph", text: "8.2. Feedback: You agree that Intentsly may freely use, disclose, reproduce, license, distribute, or otherwise exploit any feedback, comments, or suggestions You provide about our Services without any obligation to You." },
  { type: "paragraph", text: "8.3. Third Party Websites: The Intentsly Services may contain links to websites or resources of others. We do not endorse and are not responsible for the accuracy, availability, or content of any third party." }]

},
{
  id: "dpa",
  title: "9–10. Data Processing Addendum",
  content: [
  { type: "paragraph", text: "The Intentsly Data Processing Addendum (\"DPA\") amends and is incorporated into these Terms. The DPA applies to each party's Processing of Personal Data regulated by Data Protection Laws." },
  { type: "paragraph", text: "9.1. Indemnification by Intentsly: Intentsly will indemnify and defend Customer from Claims resulting from infringement or misappropriation of a third party's registered U.S. Intellectual Property Rights by the Services." },
  { type: "paragraph", text: "9.2. Indemnification by Customer: Customer will defend and indemnify Intentsly from Claims resulting from Customer Data infringing upon third-party Intellectual Property Rights, violations of Sections 2.1-2.6, or Customer-Controlled Matters." },
  { type: "callout", text: "10.1. LIMITATION ON INDIRECT LIABILITY: IN NO EVENT WILL EITHER PARTY BE LIABLE FOR ANY INCIDENTAL, INDIRECT, SPECIAL, CONSEQUENTIAL, PUNITIVE OR EXEMPLARY DAMAGES, LOST PROFITS, OR DAMAGES FOR LOSS OF GOODWILL." },
  { type: "callout", text: "10.2. LIABILITY CAP: THE AGGREGATE LIABILITY OF EITHER PARTY FOR ALL CLAIMS RELATING TO THE SERVICES WILL NOT EXCEED THE FEES PAID OR OWING TO INTENTSLY IN THE TWELVE (12) MONTHS PRECEDING THE DATE THE CLAIM AROSE." },
  { type: "paragraph", text: "The DPA covers the roles of the parties (Controller/Processor), data processing scope, customer responsibilities, international transfers including Standard Contractual Clauses, and compliance with Data Protection Laws including GDPR, CCPA, and the Data Privacy Framework." },
  { type: "paragraph", text: "Sub-Processors: Customer authorizes Intentsly to engage Sub-Processors to Process Processor Data. Intentsly will give Customer notice at least 30 calendar days in advance of providing a new Sub-Processor with access to Processor Data." },
  { type: "paragraph", text: "Return and Deletion: Processor Data shall not be kept longer than required to provide the Intentsly Services, unless a longer retention period is required by applicable laws." }]

},
{
  id: "general",
  title: "11. General Provisions",
  content: [
  { type: "paragraph", text: "11.1. Assignment: Customer will not assign these Terms without prior written consent, except in cases of merger, reorganization, sale of all or substantially all assets, or change of control." },
  { type: "paragraph", text: "11.3. Relationship of Parties: Intentsly and Customer are independent contractors. Neither party will have authority to bind the other." },
  { type: "paragraph", text: "11.4. Notices: All notices given under these Terms will be in writing via nationally recognized overnight courier, certified mail, facsimile, email with electronic confirmation, or personal delivery." },
  { type: "paragraph", text: "11.5. Governing Law: These Terms are governed by the laws of Delaware, with exclusive jurisdiction in Delaware courts." },
  { type: "paragraph", text: "11.7. Updates: Intentsly may make changes to these Terms from time to time. Material adverse changes will become effective with reasonable written notice." },
  { type: "paragraph", text: "11.8. Waiver & Severability: If any provision is held invalid, the remaining provisions remain in full force. Waiver of any provision is effective only if written and signed." },
  { type: "paragraph", text: "11.10. Survival: Rights and obligations that by their nature must survive termination will survive any termination of these Terms." },
  { type: "paragraph", text: "11.11. Export Compliance: The Services are subject to U.S. trade laws and regulations. You will not import, export, or transfer the Services in violation of these laws." },
  { type: "paragraph", text: "11.12. Force Majeure: Neither party will be liable for delays caused by act of God, acts of government, labor problems, war or civil disturbance, or causes beyond reasonable control." },
  { type: "paragraph", text: "11.14. Entire Agreement: These Terms, together with any written Orders and the DPA, constitute the complete and final agreement of the parties pertaining to the Services." }]

},
{
  id: "security-measures",
  title: "Schedule 1: Security Measures",
  content: [
  { type: "paragraph", text: "Intentsly maintains a formal information security program supported by written policies, approved by management, and based on a recognized security framework designed to protect the confidentiality and integrity of data." },
  { type: "list", items: [
    "Security Certification: Intentsly holds SOC 2 Type II certification from independent third-party auditors.",
    "Access Control: Formal processes for secure creation, amendment, and deletion of user accounts. Two-factor authentication enforced. All user account privileges allocated on a need-to-use basis.",
    "Data Center Security: Data centers comply with SOC 2, PCI DSS Level 1, ISO 27001, CSA and FIPS 140-2. Physical and environmental controls secure the facility and protect equipment.",
    "Network Security: Networks span multiple availability zones, physically separated and isolated, connected through redundant networking. Firewalls prevent unauthorized access from public networks.",
    "Encryption: Data encrypted in transit via TLS 1.2 or higher. Data at rest encrypted using AES-256-bit encryption.",
    "Availability & Continuity: Service clustering and network redundancies eliminate single points of failure. Data is backed up daily. Disaster recovery plan outlines roles and responsibilities for business continuity.",
    "Incident Management: Documented incident response plan including severity classification, containment, investigation, and notification of relevant authorities and impacted customers.",
    "Software Development: Appropriate governance processes (SDLC) to ensure information security requirements are included in new systems and enhancements.",
    "Security Testing: Quarterly vulnerability scanning against all public-facing applications. Annual third-party penetration testing. Critical and high-risk vulnerabilities promptly remediated.",
    "Personnel Security: Pre-employment background checks. Annual security training. Written confidentiality agreements."]
  },
  { type: "paragraph", text: "Intentsly reserves the right to update its security program from time to time; provided that any update will not materially reduce the overall protections set forth in this Schedule." }]

},
{
  id: "contact",
  title: "Contact Us",
  content: [
  { type: "paragraph", text: "If you wish to ask us any questions about these Terms, or to exercise any of your rights described herein, we can be reached in the following ways:" },
  { type: "list", items: [
    "To contact us regarding these Terms, please use the contact details below.",
    "Our toll-free phone number for inquiries is (866) 241-4820.",
    "You can also email us at legal@intentsly.com."]
  },
  { type: "address", lines: ["Intentsly (HubSpot, Inc.)", "ATTN: Legal Department", "Two Canal Park", "Cambridge, MA 02141, U.S.A."] }]

}];


type SectionItem =
{type: "paragraph";text: string;} |
{type: "list";items: string[];} |
{type: "address";lines: string[];} |
{type: "callout";text: string;};

const tocItems = sections.
filter((s) => s.title !== null).
map((s) => ({ id: s.id, title: s.title as string }));

export default function TermsOfService() {
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
            style={{ borderRadius: "500px" }}>
            
            Get started free
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <div className="relative overflow-hidden py-24 px-6">
        <video
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
          src="/videos/hero-gradient.webm"
          autoPlay
          loop
          muted
          playsInline />
        
        <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(180deg, transparent 50%, hsl(var(--background)) 100%)" }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-background/80 border border-border rounded-full px-4 py-1.5 text-xs font-medium text-muted-foreground mb-6 backdrop-blur-sm">
            <FileText className="w-3.5 h-3.5 text-goji-coral" />
            Legal
          </div>
          <h1 className="text-5xl md:text-6xl font-light tracking-tight text-foreground leading-tight">
            Terms of Service
          </h1>
          <p className="mt-5 text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Please read these terms carefully before using Intentsly. They govern your access to and use of our services, products, and platform.
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
            {tocItems.map(({ id, title }) =>
            <a
              key={id}
              href={`#${id}`}
              className={`group flex items-center gap-2 text-sm py-1.5 px-2 rounded-lg transition-all duration-150 ${
              activeId === id ?
              "text-foreground font-medium bg-secondary" :
              "text-muted-foreground hover:text-foreground hover:bg-secondary/60"}`
              }>
              
                <ChevronRight
                className={`w-3 h-3 shrink-0 transition-transform duration-150 ${
                activeId === id ? "text-goji-coral translate-x-0.5" : "opacity-0 group-hover:opacity-60"}`
                } />
              
                <span className="leading-snug">{title}</span>
              </a>
            )}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">

          {/* Intro card */}
          <div
            className="rounded-3xl p-6 mb-10 border border-border"
            style={{ background: "hsl(var(--goji-bg-hero))" }}>
            
            {(sections[0].content as SectionItem[]).map((block, i) =>
            block.type === "paragraph" ?
            <p key={i} className="text-[15px] leading-7 text-foreground/80 mb-3 last:mb-0">
                  {block.text}
                </p> :
            null
            )}
          </div>

          {/* Sections */}
          {sections.slice(1).map((section) =>
          <div
            key={section.id}
            id={section.id}
            className="mb-2 scroll-mt-28">
            
              {section.title &&
            <h2 className="text-xl font-semibold text-foreground mb-4 mt-10">
                  {section.title}
                </h2>
            }

              {(section.content as SectionItem[]).map((block, i) => {
              if (block.type === "paragraph") {
                return (
                  <p key={i} className="text-[15px] leading-7 text-muted-foreground mb-4">
                      {block.text}
                    </p>);

              }
              if (block.type === "callout") {
                return (
                  <div
                    key={i}
                    className="rounded-2xl border border-border p-5 mb-4 text-[13px] leading-6 text-muted-foreground font-medium"
                    style={{ background: "hsl(var(--goji-bg-hero))" }}>
                    
                      {block.text}
                    </div>);

              }
              if (block.type === "list") {
                return (
                  <ul key={i} className="space-y-2.5 mb-4">
                      {block.items.map((item, j) =>
                    <li key={j} className="flex items-start gap-3 text-[15px] leading-7 text-muted-foreground">
                          <span
                        className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: "hsl(var(--goji-coral))" }} />
                      
                          <span>{item}</span>
                        </li>
                    )}
                    </ul>);

              }
              if (block.type === "address") {
                return;













              }
              return null;
            })}

              <div className="border-b border-border mt-8" />
            </div>
          )}

          {/* Contact cards */}
          <div className="mt-12 grid sm:grid-cols-2 gap-4">
            <a
              href="mailto:legal@intentsly.com"
              className="rounded-2xl border border-border p-5 flex items-start gap-4 hover:border-goji-coral/40 transition-colors group"
              style={{ background: "hsl(0 0% 99%)" }}>
              
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--goji-bg-hero))" }}>
                
                <Mail className="w-4 h-4 text-goji-coral" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground mb-0.5">Email us</p>
                <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                  legal@intentsly.com
                </p>
              </div>
            </a>
            <div
              className="rounded-2xl border border-border p-5 flex items-start gap-4"
              style={{ background: "hsl(0 0% 99%)" }}>
              
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: "hsl(var(--goji-bg-hero))" }}>
                
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
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              
              <ArrowLeft className="w-4 h-4" />
              Back to registration
            </Link>
          </div>
        </main>
      </div>
    </div>);

}