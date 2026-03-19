import { useState } from "react";
import { Search, ExternalLink, UserPlus, Globe, X, Plus } from "lucide-react";

/* ── Types ──────────────────────────────────────────────────────────── */
type Platform = "reddit" | "linkedin" | "twitter";

interface Mention {
  id: string;
  username: string;
  platform: Platform;
  score: number;
  title: string;
  body: string;
  url: string;
}

/* ── Mock data ──────────────────────────────────────────────────────── */
const defaultCompetitors = ["Brandwatch", "Hootsuite", "Apollo"];

const mockMentions: Mention[] = [
  { id: "1", username: "knock_his_block_off", platform: "reddit", score: 95, title: "What should I do? I created a awesome product it went viral and people started selling...", body: "I created a genuinely innovative product that went viral shortly after launch and sold out within weeks. After recently restocking months later an...", url: "#" },
  { id: "2", username: "SeaTransition7090", platform: "reddit", score: 90, title: "I feel like I'm jumping between tasks every five minutes at my agency job. How do people...", body: "I work as a social media associate at an agency, and my days feel all over the place. I am constantly switching tasks and genuinely feel lik...", url: "#" },
  { id: "3", username: "In-Hell123", platform: "reddit", score: 90, title: "any good youtube channels on SaaS marketing?", body: "I have a SaaS idea I have 0 budget and I have 0 marketing background so I need to learn a lot but it looks like youtube is full of run-of-the-mill...", url: "#" },
  { id: "4", username: "StonedShadowe", platform: "reddit", score: 85, title: "What do you think SEO will look like in 2026?", body: "Genuine question. SEO already feels very different compared to even 2–3 years ago. With AI search, Google focusing more on intent, and...", url: "#" },
  { id: "5", username: "Chris_Munch", platform: "reddit", score: 85, title: "Social media buying journey shifts in 2026... how are you tracking this?", body: "Few things I keep reading about: * ChatGPT apparently driving 15-20% of referral traffic for some major retailers now like walmart through...", url: "#" },
  { id: "6", username: "kiyyang", platform: "reddit", score: 85, title: "0 to $186k per month. I will not promote.", body: "i am 34 years old asian man, and I've been trying to build businesses for the past 10 years. Along the way, I spent some time freelancing and also...", url: "#" },
];

const platformCounts: Record<Platform, number> = { reddit: 20, linkedin: 0, twitter: 0 };

/* ── Helpers ─────────────────────────────────────────────────────────── */
const RedditIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
  </svg>
);

const LinkedInIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
  </svg>
);

const XIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const ScoreBadge = ({ score }: { score: number }) => {
  const color = score >= 90 ? "text-emerald-600 border-emerald-200 bg-emerald-50" : "text-emerald-500 border-emerald-200 bg-emerald-50";
  return (
    <span className={`inline-flex items-center justify-center w-9 h-9 rounded-full border-2 text-sm font-bold ${color}`}>
      {score}
    </span>
  );
};

const competitorColors: Record<string, string> = {
  Brandwatch: "bg-orange-50 text-orange-600 border-orange-200",
  Hootsuite: "bg-red-50 text-red-600 border-red-200",
  Apollo: "bg-purple-50 text-purple-600 border-purple-200",
};

/* ── Page component ──────────────────────────────────────────────────── */
export default function RedditSignals() {
  const [competitors, setCompetitors] = useState(defaultCompetitors);
  const [editing, setEditing] = useState(false);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [searching, setSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(true);
  const [activeFilter, setActiveFilter] = useState<Platform | null>(null);

  const filtered = activeFilter ? mockMentions.filter((m) => m.platform === activeFilter) : mockMentions;

  const handleSearch = () => {
    setSearching(true);
    setTimeout(() => {
      setSearching(false);
      setHasSearched(true);
    }, 1200);
  };

  const addCompetitor = () => {
    const name = newCompetitor.trim();
    if (name && !competitors.includes(name)) {
      setCompetitors([...competitors, name]);
      setNewCompetitor("");
    }
  };

  const removeCompetitor = (name: string) => setCompetitors(competitors.filter((c) => c !== name));

  return (
    <div className="min-h-full rounded-2xl m-3 md:m-4 p-6 md:p-10 font-body bg-white">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Competitors</h1>
        <p className="text-sm text-muted-foreground mt-1">Monitor competitor mentions across social platforms</p>
      </div>

      {/* Competitors card */}
      <div className="glass-card rounded-2xl p-5 md:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-foreground/60" />
            <h2 className="text-lg font-semibold text-foreground">Your Competitors</h2>
          </div>
          <button
            onClick={() => setEditing(!editing)}
            className="text-sm font-medium text-foreground/60 hover:text-foreground border border-border rounded-lg px-3 py-1.5 transition-colors"
          >
            {editing ? "Done" : "Edit"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {competitors.map((c) => {
            const colorClass = competitorColors[c] || "bg-muted text-foreground/70 border-border";
            return (
              <span key={c} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium ${colorClass}`}>
                {c}
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                {editing && (
                  <button onClick={() => removeCompetitor(c)} className="ml-0.5 hover:opacity-80">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </span>
            );
          })}
          {editing && (
            <span className="inline-flex items-center gap-1">
              <input
                value={newCompetitor}
                onChange={(e) => setNewCompetitor(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCompetitor()}
                placeholder="Add competitor..."
                className="border border-border rounded-full px-3 py-1.5 text-sm bg-transparent outline-none w-36"
              />
              <button onClick={addCompetitor} className="p-1 rounded-full hover:bg-muted transition-colors">
                <Plus className="w-4 h-4 text-foreground/60" />
              </button>
            </span>
          )}
        </div>
      </div>

      {/* Search button */}
      <div className="flex justify-center mb-8">
        <button
          onClick={handleSearch}
          disabled={searching || competitors.length === 0}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: "hsl(var(--goji-dark))" }}
        >
          <Search className="w-4 h-4" />
          {searching ? "Searching..." : "Find Competitor Mentions"}
        </button>
      </div>

      {/* Results */}
      {hasSearched && (
        <>
          {/* Results header */}
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-foreground">Found {platformCounts.reddit + platformCounts.linkedin + platformCounts.twitter} competitor mentions</h2>
              <span className="text-foreground/40 cursor-help" title="Mentions discovered from Reddit, LinkedIn, and X based on your competitor list.">ⓘ</span>
            </div>

            {/* Platform filter tabs */}
            <div className="flex items-center gap-4">
              {([
                { key: "reddit" as Platform, icon: RedditIcon, color: "text-orange-500", count: platformCounts.reddit },
                { key: "linkedin" as Platform, icon: LinkedInIcon, color: "text-blue-600", count: platformCounts.linkedin },
                { key: "twitter" as Platform, icon: XIcon, color: "text-foreground", count: platformCounts.twitter },
              ]).map(({ key, icon: Icon, color, count }) => (
                <button
                  key={key}
                  onClick={() => setActiveFilter(activeFilter === key ? null : key)}
                  className={`flex flex-col items-center gap-0.5 transition-opacity ${activeFilter && activeFilter !== key ? "opacity-40" : ""}`}
                >
                  <Icon className={`w-5 h-5 ${color}`} />
                  <span className="text-xs font-medium text-foreground/60">{count}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mention cards grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((mention) => (
              <div key={mention.id} className="glass-card rounded-2xl p-5 flex flex-col">
                {/* Top row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <RedditIcon className="w-5 h-5 text-orange-500" />
                    <span className="text-sm font-semibold text-foreground">{mention.username}</span>
                  </div>
                  <ScoreBadge score={mention.score} />
                </div>

                {/* Content */}
                <h3 className="text-sm font-semibold text-foreground mb-1.5 line-clamp-2">{mention.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 flex-1 mb-4">{mention.body}</p>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-auto">
                  <a
                    href={mention.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground/70 hover:bg-muted transition-colors flex-1 justify-center"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    View
                  </a>
                  <button
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all flex-1 justify-center"
                    style={{ background: "hsl(var(--goji-dark))" }}
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    Add to Leads
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
