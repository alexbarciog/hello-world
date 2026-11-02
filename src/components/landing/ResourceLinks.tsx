import { ArrowUpRight } from "lucide-react";
import { TRIGIFY_PILLAR } from "@/lib/seoPolicy";

const RESOURCES = [
  { href: "/linkedin-profile-analyzer", title: "Free LinkedIn Profile Analyzer", desc: "An AI review of your profile, with a score and specific fixes." },
  { href: TRIGIFY_PILLAR, title: "Trigify alternatives", desc: "What to use now that Trigify has closed, sorted by the job you need done." },
  { href: "/compare", title: "Compare Intentsly", desc: "Side-by-side comparisons, including where each tool is the better choice." },
  { href: "/guides", title: "Guides", desc: "Step-by-step guides to finding B2B customers on LinkedIn." },
  { href: "/signal-playbook", title: "The Buying Signal Playbook", desc: "12 buying signals worth chasing and 8 to ignore." },
];

const SOLUTIONS = [
  { href: "/solutions/find-clients-for-a-marketing-agency", title: "Marketing agencies" },
  { href: "/solutions/get-clients-for-a-recruitment-agency", title: "Recruitment agencies" },
  { href: "/solutions/find-clients-for-a-web-design-agency", title: "Web design agencies" },
  { href: "/solutions/find-customers-for-b2b-saas", title: "B2B SaaS" },
];

const ResourceLinks = () => (
  <section id="resources" className="py-14 md:py-24 px-5 md:px-10 bg-background">
    <div className="max-w-6xl mx-auto">
      <h2 className="font-medium tracking-[-0.03em] leading-[1.05] text-[#0a0a0a] mb-4" style={{ fontSize: "clamp(1.75rem, 3.6vw, 3rem)" }}>
        Free tools &amp; guides
      </h2>
      <p className="text-base md:text-lg text-neutral-500 leading-relaxed max-w-2xl mb-10">
        Tools, comparisons and playbooks for finding buyers on LinkedIn.
      </p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-10">
        {RESOURCES.map((r) => (
          <a key={r.href} href={r.href} className="group rounded-3xl bg-neutral-50 border border-neutral-100 p-6 md:p-7 flex flex-col justify-between transition-colors hover:bg-neutral-100">
            <div>
              <h3 className="text-lg font-medium tracking-tight text-[#0a0a0a] mb-2">{r.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{r.desc}</p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-neutral-400 mt-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
          </a>
        ))}
      </div>

      <h3 className="text-lg font-medium tracking-tight text-[#0a0a0a] mb-4">Find customers for your kind of business</h3>
      <ul className="flex flex-wrap gap-2">
        {SOLUTIONS.map((s) => (
          <li key={s.href}>
            <a href={s.href} className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:text-[#0a0a0a] hover:border-neutral-300 transition-colors">
              {s.title}
              <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </li>
        ))}
        <li>
          <a href="/solutions" className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:text-[#0a0a0a] hover:border-neutral-300 transition-colors">
            All solutions
            <ArrowUpRight className="w-3.5 h-3.5" />
          </a>
        </li>
      </ul>
    </div>
  </section>
);

export default ResourceLinks;
