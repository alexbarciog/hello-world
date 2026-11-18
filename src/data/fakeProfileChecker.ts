// Fake LinkedIn Profile Checker: route, SEO copy and JSON-LD. Used by the page
// and by the build-time prerender (scripts/prerender.mjs), so they can't drift.
import { faqJsonLd } from "@/data/freeTools";
import { FAKE_PROFILE_FAQS } from "@/data/fakeProfileFaqs";

export { FAKE_PROFILE_FAQS };

export const FAKE_PROFILE_CHECKER = {
  id: "fake_profile_checker" as const,
  path: "/fake-linkedin-profile-checker",
  name: "Fake LinkedIn Profile Checker",
  blurb: "Paste a profile link and see its risk signals in about 20 seconds.",
  // 50 characters: the brand is dropped to stay under ~60 in results.
  title: "Fake LinkedIn Profile Checker (Free) – Is It Real?",
  description:
    "Check if a LinkedIn profile is fake in 20 seconds. Paste the URL, get a risk score and the red flags behind it. Free fake LinkedIn profile checker.",
  ogImage: "/og/tools/fake-linkedin-profile-checker.png",
};

export const FAKE_PROFILE_REPORT_PATH = (id: string) => `/fake-profile-report/${id}`;

/** SoftwareApplication + FAQPage + BreadcrumbList, for the static HTML. */
export function fakeProfileJsonLd(site: string) {
  const url = `${site}${FAKE_PROFILE_CHECKER.path}`;
  return [
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: FAKE_PROFILE_CHECKER.name,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      url,
      description: FAKE_PROFILE_CHECKER.description,
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
    faqJsonLd(FAKE_PROFILE_FAQS),
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Tools", item: `${site}/tools` },
        { "@type": "ListItem", position: 2, name: FAKE_PROFILE_CHECKER.name, item: url },
      ],
    },
  ];
}

/** For scripts/prerender.mjs. */
export const fakeProfileRoute = (site: string) => ({
  path: FAKE_PROFILE_CHECKER.path,
  title: FAKE_PROFILE_CHECKER.title,
  description: FAKE_PROFILE_CHECKER.description,
  image: `${site}${FAKE_PROFILE_CHECKER.ogImage}`,
  jsonLd: fakeProfileJsonLd(site),
  priority: "0.9",
  changefreq: "weekly",
});
