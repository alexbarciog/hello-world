// Every public page, grouped once for the navbar mega menu and the footer.
// Links are absolute ("/#how-it-works", not "#how-it-works") so they work
// from any page, not only the homepage.
import {
  BookOpen,
  Bot,
  Briefcase,
  CalendarDays,
  FileText,
  GraduationCap,
  Handshake,
  LifeBuoy,
  Linkedin,
  MessagesSquare,
  Newspaper,
  Radar,
  Scale,
  Sparkles,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { ALL_TOOLS, SIGNAL_SERVICES, TOOLS_INDEX } from "@/data/freeTools";
import { caseStudies } from "@/data/caseStudies";

export interface NavLink {
  label: string;
  href: string;
  description?: string;
  icon?: LucideIcon;
}

export interface NavGroup {
  title: string;
  links: NavLink[];
  /** Shown under the group, e.g. "All services →". */
  more?: NavLink;
}

export interface NavFeature {
  eyebrow: string;
  title: string;
  description: string;
  href: string;
  cta: string;
}

export interface NavMenu {
  label: string;
  groups: NavGroup[];
  feature: NavFeature;
}

const TOOL_ICONS: Record<string, LucideIcon> = {
  "/linkedin-profile-analyzer": Linkedin,
  "/linkedin-hook-analyzer": Sparkles,
  "/buying-signals": Radar,
  "/cold-message-grader": MessagesSquare,
};

const capitalise = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

// The services with their own buying-signal page; the rest are under "All services".
const MENU_SERVICES = ["web-design", "seo", "recruiting", "software-development", "paid-ads", "fractional-cfo"];

const ownCaseStudy = caseStudies[0];

export const NAV_MENUS: NavMenu[] = [
  {
    label: "Product",
    groups: [
      {
        title: "Find buyers",
        links: [
          {
            label: "LinkedIn buying signals",
            href: "/features/linkedin-signals",
            description: "Posts, comments and job changes that show intent",
            icon: Linkedin,
          },
          {
            label: "Reddit & X monitoring",
            href: "/features/reddit-x-signals",
            description: "People asking for what you sell",
            icon: Radar,
          },
        ],
      },
      {
        title: "Reach them",
        links: [
          {
            label: "AI SDR outreach",
            href: "/features/ai-sdr",
            description: "Personalised LinkedIn and email outreach",
            icon: Bot,
          },
          {
            label: "Conversational AI",
            href: "/features/conversational-ai",
            description: "Replies in your voice and books the meeting",
            icon: MessagesSquare,
          },
        ],
      },
      {
        title: "Get started",
        links: [
          { label: "How it works", href: "/#how-it-works" },
          { label: "Pricing", href: "/pricing" },
          { label: "Try Intentsly AI", href: "/try-ai" },
          { label: "Book a call", href: "/book" },
        ],
      },
    ],
    feature: {
      eyebrow: "No signup",
      title: "Try Intentsly AI",
      description: "Tell it who you sell to and see matching buyers in seconds.",
      href: "/try-ai",
      cta: "Try it now",
    },
  },
  {
    label: "Solutions",
    groups: [
      {
        title: "Who it's for",
        links: [
          {
            label: "B2B businesses",
            href: "/solutions",
            description: "Find customers for your B2B business",
            icon: Target,
          },
          {
            label: "Agencies & partners",
            href: "/partners",
            description: "Offer signal-based lead gen to your clients",
            icon: Handshake,
          },
          {
            label: "Use cases",
            href: "/#use-cases",
            description: "How teams use buying signals day to day",
            icon: Briefcase,
          },
        ],
      },
      {
        title: "Buyers by service",
        links: MENU_SERVICES.map((slug) => SIGNAL_SERVICES.find((s) => s.slug === slug))
          .filter((s): s is (typeof SIGNAL_SERVICES)[number] => Boolean(s))
          .map((s) => ({ label: capitalise(s.name), href: `/buying-signals/${s.slug}` })),
        more: { label: "All services", href: "/buying-signals" },
      },
      {
        title: "Customer stories",
        links: caseStudies.map((s) => ({ label: s.company, href: `/case-studies/${s.slug}` })),
        more: { label: "All case studies", href: "/case-studies" },
      },
    ],
    feature: {
      eyebrow: "Case study",
      title: ownCaseStudy.company,
      description: ownCaseStudy.headline,
      href: `/case-studies/${ownCaseStudy.slug}`,
      cta: "Read the story",
    },
  },
  {
    label: "Resources",
    groups: [
      {
        title: "Read",
        links: [
          { label: "Blog", href: "/blog", description: "Buying signals, outbound and AI SDRs", icon: Newspaper },
          { label: "Guides", href: "/guides", description: "Finding B2B customers, step by step", icon: BookOpen },
          { label: "Learn", href: "/learn", description: "Intent data and outbound basics", icon: GraduationCap },
          { label: "Compare", href: "/compare", description: "Intentsly vs other signal tools", icon: Scale },
        ],
      },
      {
        title: "Free guides",
        links: [
          { label: "The Buying Signal Playbook", href: "/signal-playbook", icon: FileText },
          { label: "0 to 100 customers in 90 days", href: "/playbook", icon: Trophy },
        ],
      },
      {
        title: "Help",
        links: [
          { label: "Help center", href: "/help", icon: LifeBuoy },
          { label: "Book a call", href: "/book", icon: CalendarDays },
        ],
      },
    ],
    feature: {
      eyebrow: "Free guide",
      title: "The Buying Signal Playbook",
      description: "The signals, queries and plays for finding warm leads on LinkedIn, Reddit and X.",
      href: "/signal-playbook",
      cta: "Get the playbook",
    },
  },
  {
    label: "Free tools",
    groups: [
      {
        title: "Free tools",
        links: ALL_TOOLS.map((t) => ({ label: t.name, href: t.path, description: t.blurb, icon: TOOL_ICONS[t.path] })),
        more: { label: "All free tools", href: TOOLS_INDEX.path },
      },
    ],
    feature: {
      eyebrow: "Free",
      title: "Free LinkedIn & outbound tools",
      description: "Four free tools for your profile, posts, cold messages and buying signals.",
      href: TOOLS_INDEX.path,
      cta: "See all tools",
    },
  },
];

/** Plain links after the menus. */
export const NAV_LINKS: NavLink[] = [{ label: "Pricing", href: "/pricing" }];

export const FOOTER_COLUMNS: NavGroup[] = [
  {
    title: "Product",
    links: [
      { label: "LinkedIn buying signals", href: "/features/linkedin-signals" },
      { label: "Reddit & X monitoring", href: "/features/reddit-x-signals" },
      { label: "AI SDR outreach", href: "/features/ai-sdr" },
      { label: "Conversational AI", href: "/features/conversational-ai" },
      { label: "How it works", href: "/#how-it-works" },
      { label: "Pricing", href: "/pricing" },
      { label: "Try Intentsly AI", href: "/try-ai" },
    ],
  },
  {
    title: "Solutions",
    links: [
      { label: "B2B businesses", href: "/solutions" },
      { label: "Agencies & partners", href: "/partners" },
      { label: "Buyers by service", href: "/buying-signals" },
      { label: "Case studies", href: "/case-studies" },
      { label: "Compare", href: "/compare" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Blog", href: "/blog" },
      { label: "Guides", href: "/guides" },
      { label: "Learn", href: "/learn" },
      { label: "Buying Signal Playbook", href: "/signal-playbook" },
      { label: "0 to 100 customers playbook", href: "/playbook" },
      { label: "Free guides", href: "/free/12-buying-signals" },
      { label: "FAQ", href: "/#faq" },
    ],
  },
  {
    title: "Free tools",
    links: [...ALL_TOOLS.map((t) => ({ label: t.name, href: t.path })), { label: "All free tools", href: TOOLS_INDEX.path }],
  },
  {
    title: "Company",
    links: [
      { label: "Help center", href: "/help" },
      { label: "Book a call", href: "/book" },
      { label: "Contact", href: "mailto:alex@intentsly.com" },
      { label: "Sign in", href: "/login" },
      { label: "Create account", href: "/register" },
    ],
  },
];

export const LEGAL_LINKS: NavLink[] = [
  { label: "Privacy Policy", href: "/privacy" },
  { label: "Terms of Service", href: "/terms" },
];
