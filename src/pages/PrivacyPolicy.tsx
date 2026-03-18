import { Link } from "react-router-dom";
import intentslyIcon from "@/assets/intentsly-icon.png";
import intentslyLogo from "@/assets/intentsly-logo.png";

const sections = [
{
  id: "intro",
  title: null,
  content: [
  {
    type: "paragraph",
    text: "This Privacy Policy describes how we process, handle, or otherwise maintain data we collect, including in connection with your use of our products, services, APIs, apps, and websites that link to this policy (we refer to these collectively as our \"Services\")."
  },
  {
    type: "paragraph",
    text: "Intentsly is committed to protecting and processing your personal information responsibly. We value the data you share with us and treat it with respect."
  }]

},
{
  id: "who-we-are",
  title: "Welcome to Intentsly! So, Who Are We?",
  content: [
  {
    type: "paragraph",
    text: "Intentsly provides a B2B Marketing Intelligence tool that gives go-to-market teams a comprehensive B2B dataset across company, contact, and IP address intelligence. By using our full dataset, customers are able to enrich key systems, build products, and power personalization."
  },
  {
    type: "paragraph",
    text: "Our Services are designed to help our customers and partners in a wide variety of ways, including by helping them determine which companies might make the best customers, identify the contacts within those organizations by department, role, or seniority to improve or expedite their interactions with those companies, and enabling them to personalize their interactions with those companies."
  }]

},
{
  id: "applies-to",
  title: "What does this Privacy Policy apply to?",
  content: [
  {
    type: "paragraph",
    text: "This Privacy Policy applies to information Intentsly collects or maintains, including through our websites that link to this policy (\"Site\"), software (including APIs, browser extensions, and integrations with third-party software) and other Services."
  },
  {
    type: "paragraph",
    text: "This Privacy Policy includes additional notices that may apply to you if you live in certain jurisdictions, such as residents of the European Economic Area, United Kingdom, Brazil, or California. These notices may include information on how to exercise certain rights you may have with respect to personal information. Please see the section below titled \"Additional Notices for Specific Jurisdictions\" for more details."
  },
  {
    type: "paragraph",
    text: "This Privacy Policy does not apply to the privacy practices of any companies we don't control, including the privacy practices of our customers. For example, our customers may obtain information from Intentsly about business contacts or prospects. We do not control their use and disclosure of this information. In certain circumstances, we act as a processor or service provider on behalf of our customers, and in those circumstances, it is the customer that is responsible for the processing of your personal information."
  }]

},
{
  id: "information-collected",
  title: "The Information We Collect",
  content: [
  {
    type: "paragraph",
    text: "We collect information in the following ways: (1) information you provide directly to us, (2) information we collect through our Services, (3) information we collect through the use of technologies such as cookies, and (4) information we collect from third parties, including through Intentsly Indexers."
  }]

},
{
  id: "info-direct",
  title: "Information you provide directly to us",
  content: [
  {
    type: "paragraph",
    text: "When you browse or visit our Site, contact us, install our free products or set up a user account with us, we might collect information that you voluntarily provide to us. The information we or our vendors collect directly from you may include:"
  },
  {
    type: "list",
    items: [
    "Identifiers, such as your name, business address, email address, and similar identifiers;",
    "Transaction Information, such as the Services you've purchased or considered purchasing, and similar commercial information;",
    "Professional or Employment-Related Information, such as your job title and/or roles within your employer;",
    "Financial Information, such as credit card or other banking information, billing name, and billing address, if you purchase Services from us;",
    "Support Service Information, such as messages submitted to us through email or customer support, and summaries or voice recordings of interactions with our customer service personnel;",
    "Other Information You Provide, such as if you provide feedback, comments, or other information through communications with us."]

  },
  {
    type: "paragraph",
    text: "In accordance with applicable laws, we may record any calls, training sessions, webinars, or similar events that you participate in with us."
  }]

},
{
  id: "info-customers",
  title: "Information We Obtain When Customers Use Our Services",
  content: [
  {
    type: "paragraph",
    text: "We may collect information when our customers use our analytics-based, data-driven solutions in their business-to-business marketing and sales efforts. We may receive personal information about your online activity and commercial information based on your interactions with our customers. This could include sales data, website activity data, and business contact and lead information."
  },
  {
    type: "paragraph",
    text: "When our customers use certain Services, Intentsly may receive data from the website visitors of those customers. Some of the data we receive may be considered personal information, such as IP address, cookie identifiers, and other identifiers that are automatically assigned to your computer or devices when you access the Internet."
  }]

},
{
  id: "cookies",
  title: "Information from cookies, web server logs, and other technologies",
  content: [
  {
    type: "paragraph",
    text: "Like many other commercial websites, we may also automatically gather information in connection with your use of the Site or Services through the use of \"cookies\" and other similar technologies such as web server logs, pixels, and end-user website activity (collectively, \"Tracking Technologies\"). Information gathered through Tracking Technologies may include internet or other electronic network activity information, such as IP addresses, identifiers derived from email addresses for the purposes of cross-device tracking for targeted advertising, the date and time of visits, the pages viewed, links to/from any page, and time spent at a site."
  },
  {
    type: "paragraph",
    text: "We use third-party analytics services, such as Google Analytics, a web analytics service provided by Google, Inc. (\"Google\"). Google Analytics uses cookies to help us analyze how users use the Site and enhance your experience when you use the Services."
  }]

},
{
  id: "third-party-info",
  title: "Information from Third Parties",
  content: [
  {
    type: "paragraph",
    text: "We or our service providers may collect publicly available information about businesses and the personnel who work or were previously employed with them. Such information could include identifiers, such as name, title, company or business, business contact information, email address, employment history, social media data, and similar information."
  },
  {
    type: "paragraph",
    text: "Third parties, including certain data vendors and our customers, may provide us with information through licensing, sponsorship, or other agreements. We also obtain information from third-party providers, partners and integrators who gather data from a variety of sources including data co-ops or publicly available sources."
  }]

},
{
  id: "indexers",
  title: "Intentsly Indexers",
  content: [
  {
    type: "paragraph",
    text: "Our proprietary indexing systems (\"Intentsly Indexers\") collect information from a variety of sources in order to compile \"Attribute Data\" about corporations, non-profits, and similar entities (\"Companies\") and the professionals that work for them (\"Professionals\")."
  },
  {
    type: "paragraph",
    text: "Our Intentsly Indexers collect a variety of information and data for purposes of creating our database of Attribute Data and for providing, improving, and maintaining the Services. We collect personal information as Attribute Data in the following ways: (1) from publicly accessible sources, both online and offline; (2) through licensing agreements directly with data brokers or other Companies; and (3) directly contributed by individuals about both Professionals and Companies."
  }]

},
{
  id: "how-we-use",
  title: "How We Use the Information We Collect",
  content: [
  {
    type: "paragraph",
    text: "We may use the information we collect in the following ways:"
  },
  {
    type: "list",
    items: [
    "We may use Business Profile Information to provide enriched data to our customers and partners for their business-to-business marketing and sales purposes.",
    "For our operational purposes, such as responding to your inquiries, maintaining and servicing your account, providing customer service, processing payments, and similar purposes.",
    "For auditing, security, debugging, internal research and development, maintaining the quality and safety of our Services.",
    "To maintain, improve, and enhance the functionality and quality of our Site and other Services.",
    "To communicate with you about your accounts and activities involving us and our services.",
    "To enforce the legal terms that govern use of our Services, including to identify, prevent, and stop possible fraudulent activity.",
    "To comply with regulatory requirements.",
    "To provide the services you have requested.",
    "To better understand the sources of traffic and transactions on our Site.",
    "To personalize your experience and customize the Services.",
    "For internal research and development purposes."]

  }]

},
{
  id: "disclosures",
  title: "Disclosures and Transfers",
  content: [
  {
    type: "paragraph",
    text: "We may disclose information in the following situations."
  }]

},
{
  id: "with-customers",
  title: "With Customers",
  content: [
  {
    type: "paragraph",
    text: "We disclose information, such as Attribute Data, to our customers who may use this data for their internal sales and marketing operations, or in certain cases and with our permission, use it as part of their in-product offering."
  }]

},
{
  id: "service-providers",
  title: "Service Providers and Similar Third Parties",
  content: [
  {
    type: "paragraph",
    text: "We also disclose information with service providers and third parties for our operational purposes and other business purposes. Among other things, our service providers may provide web hosting, data analysis, payment processing, order fulfillment, information technology and related infrastructure, customer service, email delivery, security and other auditing, and similar services."
  }]

},
{
  id: "third-party-advertising",
  title: "Third-Party Advertising",
  content: [
  {
    type: "paragraph",
    text: "We also participate in some digital advertising networks (\"Ad Networks\") with which we disclose certain information collected through cookies and other Tracking Technologies. Ad Networks place or recognize a unique cookie on your browser. They also use these technologies, along with information they collect about your online use, to recognize you across the devices you use."
  }]

},
{
  id: "law-enforcement",
  title: "Governments, Law Enforcement, and Other Legal Requirements",
  content: [
  {
    type: "paragraph",
    text: "We may disclose information about you to law enforcement, government officials, or other third parties if we believe in our sole discretion that it is absolutely necessary or appropriate in order to (i) respond to a subpoena, court order, or other binding legal process; (ii) comply with laws, statutes, rules, or regulations; (iii) prevent physical or other harm, financial loss, or infringement of your rights; or (iv) report suspected illegal activity."
  },
  {
    type: "paragraph",
    text: "In addition, we may disclose personal information as necessary in the event of a contemplated or actual merger, acquisition, reorganization, bankruptcy, or similar event for purposes consistent with that transaction."
  }]

},
{
  id: "business-partners",
  title: "Business Partners",
  content: [
  {
    type: "paragraph",
    text: "We may disclose personal information to our business partners and affiliates to fulfill our contractual commitments, or to provide you with a product or service that you have requested. We also disclose this information for marketing or sales purposes."
  }]

},
{
  id: "affiliates",
  title: "Related Companies and Affiliates",
  content: [
  {
    type: "paragraph",
    text: "We may disclose your information to affiliates within the corporate group for our operational purposes and other business purposes. Our affiliates include our parent company and any other affiliates, subsidiaries, joint venture partners, or other companies that we control or that are under common control with us either now or in the future."
  }]

},
{
  id: "data-rights",
  title: "Your Data Rights",
  content: [
  {
    type: "paragraph",
    text: "You have certain choices about your personal information. If you have questions or concerns regarding Intentsly's collection, use or disclosure of your personal information, or if you wish to exercise your rights, including the right to be removed from our Database, please contact us at privacy@intentsly.com."
  },
  {
    type: "paragraph",
    text: "Please note also that we may process information about you in some instances where we are acting as a data processor or service provider on behalf of other businesses. In such cases, we recommend that you contact the businesses to which you originally provided your personal information."
  },
  {
    type: "list",
    items: [
    "Opt Out of Cookies and Other Similar Technologies. Your browser or device can allow you to opt out of data collection through cookies or similar technologies.",
    "Opt Out of Marketing Communications. If you wish to opt out of our use of your contact information for our email marketing purposes, you can click the \"Unsubscribe\" button in any marketing email from us.",
    "Additional Rights. Depending on where you are located, you may have additional rights regarding your personal information."]

  }]

},
{
  id: "data-privacy-framework",
  title: "Data Privacy Framework Notice",
  content: [
  {
    type: "paragraph",
    text: "Intentsly complies with the EU-U.S. Data Privacy Framework (EU-U.S. DPF), the UK Extension to the EU-U.S. DPF, and the Swiss-U.S. Data Privacy Framework (Swiss-U.S. DPF) as set forth by the U.S. Department of Commerce. Intentsly has certified to the U.S. Department of Commerce that it adheres to the EU-U.S. Data Privacy Framework Principles with regard to the processing of personal information received from the European Union and the United Kingdom."
  },
  {
    type: "paragraph",
    text: "In compliance with the Data Privacy Framework, Intentsly commits to resolving complaints about privacy and its collection or use of your personal information. EU, UK, or Swiss individuals with inquiries or complaints regarding this Privacy Policy should first contact Intentsly at privacy@intentsly.com. We will attempt to resolve any DPF-related complaints within forty-five (45) days of receipt."
  }]

},
{
  id: "international-transfers",
  title: "International Transfers",
  content: [
  {
    type: "paragraph",
    text: "Intentsly is based in the United States. Your personal information may be collected, transferred to, stored and otherwise processed in any country where we have facilities or in which we engage service providers. By using the Site and/or Services you acknowledge that your personal information may be transferred to countries outside of your country of residence, including the United States."
  },
  {
    type: "paragraph",
    text: "When we transfer personal information outside the EEA, UK, or Switzerland to a country that does not provide an adequate level of protection, we use a variety of legal mechanisms to safeguard the transfer, including the European Commission-approved Data Privacy Framework, the EU Standard Contractual Clauses, as well as additional safeguards where appropriate."
  }]

},
{
  id: "jurisdictions",
  title: "Additional Notices for Certain Jurisdictions",
  content: [
  {
    type: "paragraph",
    text: "You may be entitled to additional privacy notices depending on where you are located."
  }]

},
{
  id: "california",
  title: "California",
  content: [
  {
    type: "paragraph",
    text: "Intentsly has prepared additional disclosures and notices for California consumers. Applicable state law (such as the Virginia Consumer Data Protection Act, Colorado Privacy Act, and the Connecticut Data Privacy Act) may give you certain rights to: confirm processing, correct inaccuracies, delete your personal information, receive a portable copy, and opt out of targeted advertising or sale of your personal information."
  }]

},
{
  id: "nevada",
  title: "Nevada",
  content: [
  {
    type: "paragraph",
    text: "If you would like to request that we refrain from selling your Covered Information (as defined under Nevada law), please submit your request to privacy@intentsly.com."
  }]

},
{
  id: "eu-uk",
  title: "Additional Disclosures for Individuals Outside the United States",
  content: [
  {
    type: "paragraph",
    text: "For EU, UK, and Swiss individuals, Intentsly is the controller of your personal information. Our legal grounds for processing your information include: Consent (where you have given consent), Contractual Obligation (where processing is necessary for a contract with you), Legal Obligation (where required by law), and Legitimate Interest (where processing is necessary for our legitimate interests)."
  },
  {
    type: "paragraph",
    text: "The laws of your jurisdiction may give you the right to: be informed, access, rectify, or erase any personal information we have collected about you. You also have the right to data portability and the right to restrict or object to our processing."
  }]

},
{
  id: "security",
  title: "Protection and Retention of Information",
  content: [
  {
    type: "paragraph",
    text: "Intentsly considers the security of all the information and data within our control to be a top priority. We implement technical and organizational safeguards to protect from accidental or unlawful destruction, loss, alteration, unauthorized disclosure of, or access to, such information or data. However, no security system is impenetrable, and we cannot guarantee that the information within our control is absolutely secure."
  },
  {
    type: "paragraph",
    text: "Intentsly retains the information described in this Privacy Policy for as long as is necessary to comply with legal obligations, enforce our agreements, maintain existing relationships with our customers, and otherwise as might be necessary for our legitimate business interests."
  }]

},
{
  id: "do-not-track",
  title: "How We Respond to Do Not Track Signals",
  content: [
  {
    type: "paragraph",
    text: "Your browser settings may allow you to automatically transmit a Do Not Track signal to websites and other online services you visit. We do not currently recognize or respond to browser-initiated Do Not Track signals."
  }]

},
{
  id: "children",
  title: "Our Policy Towards Children",
  content: [
  {
    type: "paragraph",
    text: "Intentsly provides business services, and as such we do not direct our services towards individuals under the age of 18. We do not knowingly collect personal information from individuals under the age of 18. If we become aware that we have collected personal information from individuals under the age of 18, we take steps to delete that information in accordance with applicable law. If you become aware that Intentsly has improperly collected information from individuals under the age of 18, please contact us immediately at privacy@intentsly.com."
  }]

},
{
  id: "updates",
  title: "Updates",
  content: [
  {
    type: "paragraph",
    text: "We may update this Privacy Policy from time to time. If we make material changes to this policy, we will notify you, as appropriate, depending on the substance of the change, by email or by means of a notice on our website's homepage."
  }]

},
{
  id: "contact",
  title: "Contact us!",
  content: [
  {
    type: "paragraph",
    text: "If you wish to ask us any questions about this Privacy Policy, or to exercise any of your rights described in this Privacy Policy, we can be reached in the following ways:"
  },
  {
    type: "list",
    items: [
    "To exercise your rights, please email our privacy team using the contact details below.",
    "Our toll-free phone number for privacy inquiries is (866) 241-4820.",
    "You can also email us at privacy@intentsly.com."]

  },
  {
    type: "address",
    lines: ["Intentsly", "ATTN: Privacy Team", "2 Canal Park", "Cambridge, MA 02141"]
  }]

}];


type SectionItem =
{type: "paragraph";text: string;} |
{type: "list";items: string[];} |
{type: "address";lines: string[];};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-background">
      {/* Minimal nav */}
      <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <img src={intentslyIcon} alt="Intentsly" className="w-7 h-7 object-contain" />
            
          </Link>
          <Link
            to="/register"
            className="text-sm font-medium text-foreground border border-border rounded-lg px-4 py-2 hover:bg-secondary transition-colors">
            
            Get started
          </Link>
        </div>
      </header>

      {/* Hero */}
      <div
        className="relative overflow-hidden py-20 px-6"
        style={{
          background:
          "linear-gradient(135deg, hsl(5 85% 96%) 0%, hsl(20 90% 94%) 40%, hsl(220 60% 96%) 100%)"
        }}>
        
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-foreground">
            Privacy Policy
          </h1>
          <p className="mt-4 text-muted-foreground text-base">
            Last updated: May 30, 2025
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-6 py-16">
        {sections.map((section) =>
        <div key={section.id} className="mb-10">
            {section.title &&
          <h2 className="text-lg font-semibold text-foreground mb-3 mt-2">
                {section.title}
              </h2>
          }
            {(section.content as SectionItem[]).map((block, i) => {
            if (block.type === "paragraph") {
              return (
                <p
                  key={i}
                  className="text-[15px] leading-7 text-muted-foreground mb-4">
                  
                    {block.text}
                  </p>);

            }
            if (block.type === "list") {
              return (
                <ul key={i} className="space-y-2 mb-4 pl-1">
                    {block.items.map((item, j) =>
                  <li key={j} className="flex items-start gap-3 text-[15px] leading-7 text-muted-foreground">
                        <span className="mt-2 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
                        <span>{item}</span>
                      </li>
                  )}
                  </ul>);

            }
            if (block.type === "address") {
              return (
                <address
                  key={i}
                  className="not-italic mt-3 pl-4 border-l-2 border-border text-[15px] leading-7 text-muted-foreground">
                  
                    {block.lines.map((line, j) =>
                  <span key={j} className="block">
                        {line}
                      </span>
                  )}
                  </address>);

            }
            return null;
          })}
            <div className="border-b border-border mt-8" />
          </div>
        )}

        {/* Footer note */}
        <div className="mt-12 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            Questions about this policy?{" "}
            <a
              href="mailto:privacy@intentsly.com"
              className="font-medium text-foreground hover:underline">
              
              privacy@intentsly.com
            </a>
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            <Link to="/register" className="font-medium text-foreground hover:underline">
              ← Back to registration
            </Link>
          </p>
        </div>
      </div>
    </div>);

}