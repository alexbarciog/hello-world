import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Bot, Eye, Heart, Loader2, Mail, MessageSquare, MessageSquareText, PenLine, UserPlus } from "lucide-react";
import { toast } from "sonner";
import intentslyIcon from "@/assets/intentsly-icon.png";
import { TemplateIconTile } from "@/components/templates/TemplateCard";
import { SIGNAL_ICONS } from "@/components/templates/signalIcons";
import { TemplateGalleryCard } from "@/components/templates/TemplateGalleryCard";
import { applyTemplate, startAppliedAgent, usePublicTemplates, useTemplateBySlug, type AgentTemplate } from "@/lib/agentTemplates";
import {
  CATEGORY_LABELS, SIGNAL_INFO, categoryOf, liveSignals, pluralize, sequenceSteps, similarTemplates, splitPlaceholders,
} from "@/lib/templateMarketplace";
import type { TemplateStep } from "../../supabase/functions/_shared/agent-template-schema";

const KEYWORDS_SHOWN = 12;

/** /agents/templates/:slug: everything a template sets up, and the buttons to use it. */
export default function AgentTemplateDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: template, isLoading } = useTemplateBySlug(slug);
  const { data: all } = usePublicTemplates();
  const [busy, setBusy] = useState(false);

  if (isLoading) {
    return (
      <Shell>
        <div className="flex justify-center py-24"><Loader2 className="w-5 h-5 animate-spin text-neutral-400" /></div>
      </Shell>
    );
  }
  if (!template) {
    return (
      <Shell>
        <BackLink />
        <div className="mt-10 rounded-2xl border border-dashed border-[#E7E7EA] p-8 text-center">
          <p className="text-[15px] font-semibold text-neutral-900">This template isn't available.</p>
          <Link to="/agents/templates" className="mt-2 inline-block text-[14px] font-medium text-[#1A8FE3] hover:underline">See all templates</Link>
        </div>
      </Shell>
    );
  }

  const t = template;
  const cat = categoryOf(t);
  const signals = liveSignals(t);
  const steps = sequenceSteps(t);
  const similar = similarTemplates(all ?? [], t);

  const use = async () => {
    setBusy(true);
    try {
      const result = await applyTemplate(t.id, "create");
      startAppliedAgent(result);
      qc.invalidateQueries({ queryKey: ["agent-templates"] });
      toast.success(`${t.business_type} agent created. Its campaign stays paused until you turn it on.`, {
        action: result.campaign_id
          ? { label: "Open campaign", onClick: () => navigate(`/campaigns/${result.campaign_id}`) }
          : undefined,
      });
      navigate("/signals");
    } catch (e) {
      toast.error((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Shell>
      <BackLink />

      <div className="mt-5 max-w-3xl">
        <div className="flex items-start gap-4">
          <TemplateIconTile template={t} size="lg" />
          <div className="min-w-0">
            {cat && <p className="text-[12px] font-medium text-neutral-500">{CATEGORY_LABELS[cat]}</p>}
            <h1 className="text-[24px] md:text-[28px] leading-tight font-semibold tracking-[-0.015em] text-neutral-900">{t.name}</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-[12px] text-neutral-500">
              <img src={intentslyIcon} alt="" className="w-4 h-4 rounded-[4px]" /> Made by Intentsly
            </p>
          </div>
        </div>
        {(t.description || t.tagline) && (
          <p className="mt-4 text-[15px] leading-relaxed text-neutral-600">{t.description || t.tagline}</p>
        )}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-6 lg:gap-10 items-start">
        {/* Right: actions (above the details on phones) */}
        <aside className="lg:order-2 lg:sticky lg:top-6 rounded-2xl border border-[#E7E7EA] bg-white p-5 shadow-[0_8px_30px_-16px_rgba(10,10,10,0.18)]">
          {!t.is_public && (
            <p className="mb-4 rounded-lg bg-amber-50 text-amber-800 text-[12px] px-3 py-2">Private template: only admins can see it.</p>
          )}
          <button
            type="button"
            onClick={use}
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#C8FF00] text-[#0a0a0a] px-4 py-3 text-[15px] font-semibold hover:brightness-95 transition disabled:opacity-60"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />} Use this template
          </button>
          <button
            type="button"
            onClick={() => navigate(`/signals?create=1&template=${encodeURIComponent(t.slug)}`)}
            disabled={busy}
            className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[#E7E7EA] bg-white text-neutral-900 px-4 py-2.5 text-[14px] font-medium hover:border-neutral-300 hover:bg-neutral-50 transition-colors"
          >
            <PenLine className="w-4 h-4" /> Customise first
          </button>
          <p className="mt-3 text-[12.5px] leading-relaxed text-neutral-500">Nothing is sent until you turn the campaign on.</p>

          <ul className="mt-4 pt-4 border-t border-[#F0F0F2] space-y-2 text-[13px] text-neutral-600">
            <li>{pluralize(signals.length, "signal")} to watch</li>
            <li>{steps.length}-step LinkedIn sequence</li>
            <li>Up to {t.config.campaign.daily_connect_limit} connection requests a day</li>
          </ul>
          <p className="mt-4 text-[12px] leading-relaxed text-neutral-400">
            Customise first opens the agent builder with this targeting and these signals. You set up the sequence when you create the campaign.
          </p>
        </aside>

        {/* Left: what the template sets up */}
        <div className="lg:order-1 min-w-0">
          <Section title="Who it's for" first>
            <p className="text-[14px] font-medium text-neutral-900">{t.business_type}</p>
            {t.config.agent.ideal_lead_description && (
              <p className="mt-1.5 text-[14px] leading-relaxed text-neutral-600">{t.config.agent.ideal_lead_description}</p>
            )}
          </Section>

          <Section title="What it watches">
            <ul className="space-y-3">
              {t.config.agent.signals_config.enabled.map((id) => {
                const info = SIGNAL_INFO[id];
                if (!info) return null;
                const Icon = SIGNAL_ICONS[id] ?? MessageSquareText;
                const keywords = t.config.agent.signals_config.keywords?.[id] ?? [];
                return (
                  <li key={id} className="rounded-xl border border-[#F0F0F2] bg-[#FCFCFD] p-3.5">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-lg bg-white ring-1 ring-[#EDEDF0] text-neutral-600 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4" strokeWidth={1.9} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-[14px] font-medium text-neutral-900">
                          {info.label}
                          {!info.live && <span className="ml-2 text-[11px] font-medium text-neutral-400">Not running yet</span>}
                        </p>
                        <p className="text-[13px] text-neutral-500 leading-snug">{info.explain}</p>
                        {info.needsUrls && keywords.length === 0 && (
                          <p className="mt-1 text-[12.5px] text-neutral-400">You add the pages after applying the template.</p>
                        )}
                        {keywords.length > 0 && !info.needsUrls && <ChipList items={keywords} limit={KEYWORDS_SHOWN} />}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Section>

          <Section title="Who it targets">
            <div className="space-y-4">
              <ChipGroup label="Job titles" items={t.config.agent.icp_job_titles} />
              <ChipGroup label="Company sizes" items={t.config.agent.icp_company_sizes.map((s) => `${s} employees`)} />
              <ChipGroup label="Company types" items={t.config.agent.icp_company_types} />
              <ChipGroup label="Industries" items={t.config.agent.icp_industries} empty="Any industry" />
              <ChipGroup label="Countries" items={t.config.agent.icp_locations.filter((l) => l !== "Any Country")} empty="Any country" />
              {t.config.agent.icp_restricted_countries.length > 0 && (
                <ChipGroup label="Leaves out leads in" items={t.config.agent.icp_restricted_countries} />
              )}
            </div>
          </Section>

          <Section title="The LinkedIn sequence">
            <Timeline steps={steps} />
          </Section>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-12 pt-8 border-t border-[#F0F0F2]">
          <h2 className="text-[16px] font-semibold text-neutral-900">Similar templates</h2>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {similar.map((s: AgentTemplate) => (
              <TemplateGalleryCard key={s.id} template={s} to={`/agents/templates/${s.slug}`} />
            ))}
          </div>
        </section>
      )}
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-full bg-card rounded-2xl m-3 md:m-4 p-4 sm:p-6 md:p-8 font-sans">
      <div className="max-w-6xl mx-auto">{children}</div>
    </div>
  );
}

function BackLink() {
  return (
    <Link to="/agents/templates" className="inline-flex items-center gap-1 text-[12.5px] text-neutral-500 hover:text-neutral-900">
      <ArrowLeft className="w-3.5 h-3.5" /> All templates
    </Link>
  );
}

function Section({ title, children, first }: { title: string; children: React.ReactNode; first?: boolean }) {
  return (
    <section className={first ? "mt-6 lg:mt-0" : "mt-8"}>
      <h2 className="mb-3 text-[16px] font-semibold text-neutral-900">{title}</h2>
      {children}
    </section>
  );
}

function ChipList({ items, limit }: { items: string[]; limit?: number }) {
  const [open, setOpen] = useState(false);
  const shown = limit && !open ? items.slice(0, limit) : items;
  const hidden = items.length - shown.length;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {shown.map((k) => (
        <span key={k} className="max-w-full break-words rounded-full bg-white ring-1 ring-[#E7E7EA] px-2.5 py-1 text-[12.5px] text-neutral-700">
          {k}
        </span>
      ))}
      {hidden > 0 && (
        <button type="button" onClick={() => setOpen(true)} className="rounded-full px-2.5 py-1 text-[12.5px] font-medium text-[#1A8FE3] hover:bg-sky-50">
          +{hidden} more
        </button>
      )}
    </div>
  );
}

function ChipGroup({ label, items, empty }: { label: string; items: string[]; empty?: string }) {
  if (items.length === 0 && !empty) return null;
  return (
    <div>
      <p className="text-[12px] font-medium text-neutral-500">{label}</p>
      {items.length ? (
        <ChipList items={items} />
      ) : (
        <p className="mt-1 text-[13px] text-neutral-700">{empty}</p>
      )}
    </div>
  );
}

const STEP_META: Record<TemplateStep["type"], { label: string; icon: typeof Mail }> = {
  invitation: { label: "Connection request", icon: UserPlus },
  message: { label: "Message", icon: MessageSquare },
  email: { label: "Email", icon: Mail },
  comment: { label: "Comment on a post", icon: MessageSquareText },
  like: { label: "Like a post", icon: Heart },
  visit_profile: { label: "Visit their profile", icon: Eye },
};

function Timeline({ steps }: { steps: TemplateStep[] }) {
  let afterAccept = false;
  let day = 0;
  let messageNo = 0;
  return (
    <ol className="relative">
      {steps.map((s, i) => {
        const meta = STEP_META[s.type];
        const Icon = meta.icon;
        if (s.type === "invitation") afterAccept = true;
        else day += s.delay_days ?? 0;
        const n = s.type === "message" ? ++messageNo : 0;
        const when =
          s.type === "invitation" ? "Day 0" :
          afterAccept ? (day === 0 ? "Once they accept" : `Day ${day} after they accept`) :
          `Day ${day}`;
        const last = i === steps.length - 1;
        return (
          <li key={i} className="relative flex gap-3 pb-5 last:pb-0">
            {!last && <span className="absolute left-4 top-9 bottom-0 w-px bg-[#E7E7EA]" aria-hidden />}
            <span className="relative z-[1] w-8 h-8 rounded-full bg-white ring-1 ring-[#E7E7EA] text-neutral-600 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1 pt-1">
              <p className="text-[14px] font-medium text-neutral-900">
                {s.type === "message" ? `${meta.label} ${n}` : meta.label}
                <span className="ml-2 text-[12px] font-normal text-neutral-400">{when}</span>
              </p>
              {s.type === "invitation" && (
                <p className="text-[13px] text-neutral-500">{s.connect_note ? <Highlighted text={s.connect_note} /> : "Sent without a note."}</p>
              )}
              {(s.type === "message" || s.type === "email") && <StepText step={s} />}
            </div>
          </li>
        );
      })}
      {steps.length === 0 && <li className="text-[13px] text-neutral-500">No steps.</li>}
    </ol>
  );
}

function StepText({ step }: { step: TemplateStep }) {
  if (step.ai_icebreaker || step.ai_sdr) {
    return (
      <div className="mt-1.5 rounded-xl bg-[#F7F8FA] p-3 text-[13px] leading-relaxed text-neutral-600">
        <p className="inline-flex items-center gap-1.5 font-medium text-neutral-800"><Bot className="w-3.5 h-3.5" /> Written by AI for each lead</p>
        {step.step_instructions && <p className="mt-1"><span className="text-neutral-500">Instructions: </span>{step.step_instructions}</p>}
      </div>
    );
  }
  return (
    <div className="mt-1.5 rounded-xl bg-[#F7F8FA] p-3 text-[13px] leading-relaxed text-neutral-700 whitespace-pre-line break-words">
      {step.subject && <p className="font-medium mb-1"><Highlighted text={step.subject} /></p>}
      {step.message ? <Highlighted text={step.message} /> : <span className="text-neutral-400">No text yet.</span>}
    </div>
  );
}

function Highlighted({ text }: { text: string }) {
  return (
    <>
      {splitPlaceholders(text).map((p, i) =>
        p.variable ? (
          <span key={i} className="rounded-md bg-sky-50 px-1 py-px font-medium text-[#1A8FE3]">{p.text}</span>
        ) : (
          <span key={i}>{p.text}</span>
        ),
      )}
    </>
  );
}
