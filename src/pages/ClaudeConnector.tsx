import { useState } from "react";
import { Check, Copy, ShieldCheck } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";

// Setup and reference page for the Intentsly connector for Claude (the remote
// MCP server at /mcp). Linked from the server's protected-resource metadata.

const CONNECTOR_URL = "https://intentsly.com/mcp";

const steps = [
  { title: "Open connector settings in Claude", body: "In Claude, go to Settings → Connectors and choose Add custom connector." },
  { title: "Paste the Intentsly URL", body: "Name it Intentsly and paste the connector URL below, then select Add." },
  { title: "Sign in and allow access", body: "Select Connect, sign in to Intentsly and choose Allow. Claude now works with your Intentsly workspace." },
];

const examples = [
  "Show me this week's hot leads and the buying signal behind each one.",
  "Which leads replied to my campaigns, and what did they say?",
  "Approve the pending leads that are founders of B2B SaaS companies and add them to my main campaign.",
  "Read my last LinkedIn conversation with this lead and draft a reply. Send it once I approve.",
  "Pause the signal agent that finds the fewest hot leads.",
];

const tools: { name: string; does: string; kind: "Reads" | "Changes" | "Sends" }[] = [
  { name: "get_account_overview", does: "Plan, connected LinkedIn account, today's remaining LinkedIn limits and key counts", kind: "Reads" },
  { name: "search_leads", does: "Find leads by text, intent tier, review status, list or date", kind: "Reads" },
  { name: "get_lead", does: "A lead's buying signal, profile, insights, campaigns and meetings", kind: "Reads" },
  { name: "list_lead_lists", does: "Lead lists and their size", kind: "Reads" },
  { name: "list_signal_agents", does: "Signal agents, what they watch and the leads they found", kind: "Reads" },
  { name: "list_campaigns / get_campaign", does: "Campaigns, their funnel and the latest replies", kind: "Reads" },
  { name: "list_meetings", does: "Meetings booked with leads", kind: "Reads" },
  { name: "list_linkedin_conversations / get_linkedin_conversation", does: "Your LinkedIn inbox and message history", kind: "Reads" },
  { name: "review_leads", does: "Approve or reject leads waiting for review", kind: "Changes" },
  { name: "add_leads_to_campaign", does: "Queue leads for a campaign", kind: "Changes" },
  { name: "set_signal_agent_status", does: "Pause or resume a signal agent", kind: "Changes" },
  { name: "set_campaign_status", does: "Start or pause a campaign", kind: "Sends" },
  { name: "send_linkedin_message", does: "Send a LinkedIn message from your connected account", kind: "Sends" },
];

const dark = { color: "hsl(var(--aeline-dark))" };

export default function ClaudeConnector() {
  const [copied, setCopied] = useState(false);

  async function copyUrl() {
    try {
      await navigator.clipboard.writeText(CONNECTOR_URL);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable: the URL is visible to copy by hand */ }
  }

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar />

      <main className="px-4 sm:px-6 pt-32 pb-24">
        <div className="max-w-3xl mx-auto">
          <span className="section-label mb-6 block w-fit">Claude connector</span>
          <h1 className="text-4xl md:text-6xl font-medium tracking-tight leading-[1.05] mb-6" style={dark}>
            Use Intentsly in Claude
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-10">
            Ask Claude about your buying-intent leads, campaigns and LinkedIn conversations, and let it act on them:
            review leads, add them to campaigns, start or pause campaigns and send LinkedIn messages. Claude works
            with the same data and the same LinkedIn safety limits as the Intentsly app.
          </p>

          <div className="rounded-2xl border border-border p-5 mb-16">
            <p className="text-sm font-medium mb-2" style={dark}>Connector URL</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 min-w-0 break-all rounded-lg bg-muted px-3 py-2.5 text-sm">{CONNECTOR_URL}</code>
              <button
                type="button"
                onClick={copyUrl}
                className="shrink-0 inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors"
                aria-label="Copy connector URL"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>

          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-6" style={dark}>Set it up</h2>
          <ol className="space-y-5 mb-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-4">
                <span className="shrink-0 w-8 h-8 rounded-full bg-[#C8FF00] text-[#1a1a2e] text-sm font-semibold flex items-center justify-center">{i + 1}</span>
                <div>
                  <p className="font-medium" style={dark}>{s.title}</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="text-sm text-muted-foreground mb-16">
            You need an Intentsly account with an active plan or free trial. The LinkedIn tools also need a LinkedIn
            account connected in Intentsly. No account yet?{" "}
            <a href="/register" className="font-medium text-foreground underline underline-offset-2">Start a free trial</a>.
          </p>

          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-6" style={dark}>Things to ask</h2>
          <ul className="space-y-3 mb-16">
            {examples.map((e) => (
              <li key={e} className="rounded-xl bg-muted/60 px-4 py-3 text-sm leading-relaxed" style={dark}>“{e}”</li>
            ))}
          </ul>

          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-6" style={dark}>What Claude can do</h2>
          <div className="rounded-2xl border border-border divide-y divide-border mb-16">
            {tools.map((t) => (
              <div key={t.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-4 py-3">
                <code className="text-xs sm:w-64 shrink-0 break-words">{t.name}</code>
                <span className="text-sm text-muted-foreground flex-1">{t.does}</span>
                <span className={`text-xs font-medium w-fit rounded-full px-2 py-0.5 ${t.kind === "Reads" ? "bg-muted text-muted-foreground" : t.kind === "Changes" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-800"}`}>
                  {t.kind}
                </span>
              </div>
            ))}
          </div>

          <h2 className="text-2xl md:text-3xl font-medium tracking-tight mb-6" style={dark}>Safety and privacy</h2>
          <ul className="space-y-4 mb-16">
            {[
              "Claude only sees the workspace you approve, signed in as you. It can't reach other Intentsly accounts.",
              "LinkedIn messages and campaign invitations count against your account's daily LinkedIn safety limits. When a limit is reached, nothing more is sent that day.",
              "The connector tells Claude to show you the exact message and get your OK before it sends anything or starts a campaign.",
              "Disconnect any time in Claude under Settings → Connectors.",
            ].map((line) => (
              <li key={line} className="flex gap-3 text-sm text-muted-foreground leading-relaxed">
                <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-foreground" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Read our <a href="/privacy" className="font-medium text-foreground underline underline-offset-2">Privacy Policy</a> and{" "}
            <a href="/terms" className="font-medium text-foreground underline underline-offset-2">Terms</a>. Questions or problems:{" "}
            <a href="mailto:alex@intentsly.com" className="font-medium text-foreground underline underline-offset-2">alex@intentsly.com</a>.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
