import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { ToolCta, useToolHead } from "@/components/FreeTool";
import { ALL_TOOLS, TOOLS_INDEX } from "@/data/freeTools";

export default function ToolsIndex() {
  useToolHead(TOOLS_INDEX.title, TOOLS_INDEX.description, TOOLS_INDEX.path);
  return (
    <div className="min-h-screen bg-white font-sans text-[#0a0a0a]">
      <Navbar variant="light" />
      <main>
        <section className="px-5 md:px-8 pt-12 md:pt-20 pb-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="font-medium tracking-[-0.03em] leading-[1.05]" style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>Free LinkedIn and outbound tools</h1>
            <p className="mt-4 text-[17px] text-neutral-600 leading-relaxed">Small tools for finding buyers and writing messages they answer.</p>
          </div>
        </section>
        <section className="px-5 md:px-8 pb-16">
          <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-4">
            {ALL_TOOLS.map((t) => (
              <Link key={t.id} to={t.path} className="group rounded-2xl border border-neutral-200 p-5 hover:border-neutral-400 transition-colors">
                <h2 className="text-lg font-semibold inline-flex items-center gap-1.5">
                  {t.name}
                  <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900" />
                </h2>
                <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{t.blurb}</p>
              </Link>
            ))}
          </div>
        </section>
        <div className="pb-20"><ToolCta /></div>
      </main>
      <Footer />
    </div>
  );
}
