import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TemplateGallery } from "@/components/templates/TemplateGallery";
import { usePublicTemplates } from "@/lib/agentTemplates";

/** /agents/templates: browsable gallery of ready-made signal agents. */
export default function AgentTemplates() {
  const navigate = useNavigate();
  const { data: templates, isLoading } = usePublicTemplates();

  return (
    <div className="relative min-h-full bg-card rounded-2xl m-3 md:m-4 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">
        <Link to="/signals" className="inline-flex items-center gap-1 text-[12.5px] text-neutral-500 hover:text-neutral-900">
          <ArrowLeft className="w-3.5 h-3.5" /> Signals Agents
        </Link>
        <h1 className="mt-3 text-[26px] md:text-[30px] leading-[1.1] font-semibold tracking-[-0.015em] text-neutral-900">Agent templates</h1>
        <p className="mt-2 max-w-2xl text-[14px] md:text-[15px] leading-relaxed text-neutral-500">
          Ready-made signal agents for your kind of business. Each one comes with the signals to watch, the people to target and a
          LinkedIn sequence. Nothing goes out until you turn it on.
        </p>

        <div className="mt-6">
          <TemplateGallery
            templates={templates ?? []}
            loading={isLoading}
            hrefFor={(t) => `/agents/templates/${t.slug}`}
            onBuildOwn={() => navigate("/signals?create=1")}
          />
        </div>
      </div>
    </div>
  );
}
