import { useState } from "react";
import { Search, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import gojiIcon from "@/assets/gojiberry-icon.png";

const categories = [
  {
    icon: FolderIcon,
    title: "Getting Started",
    description: "Anything you need to know about how to start on Gojiberry AI",
    articles: 5,
  },
  {
    icon: FolderIcon,
    title: "Connecting LinkedIn",
    description: "How to connect LinkedIn accounts",
    articles: 8,
  },
  {
    icon: FolderIcon,
    title: "Finding & Adding Leads",
    description: "How to find & add leads",
    articles: 4,
  },
  {
    icon: FolderIcon,
    title: "Campaigns & Outreach",
    description: "How to use campaigns",
    articles: 10,
  },
  {
    icon: FolderIcon,
    title: "Troubleshooting & FAQ",
    description: "Need help ?",
    articles: 11,
  },
  {
    icon: FolderIcon,
    title: "Billing & plans",
    description: "More information on our plans",
    articles: 9,
  },
  {
    icon: WrenchIcon,
    title: "Technical & API",
    description: "Developer resources and API documentation",
    articles: 6,
  },
];

function FolderIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      stroke="hsl(var(--goji-coral))"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* folder back */}
      <rect x="4" y="14" width="40" height="28" rx="3" fill="hsl(var(--goji-coral) / 0.1)" stroke="hsl(var(--goji-coral))" strokeWidth="2" />
      {/* folder tab */}
      <path d="M4 14 C4 12 5 10 7 10 L18 10 C20 10 21 11 22 13 L22 14" fill="hsl(var(--goji-coral) / 0.15)" stroke="hsl(var(--goji-coral))" strokeWidth="2" />
      {/* inner lines */}
      <line x1="12" y1="24" x2="36" y2="24" stroke="hsl(var(--goji-coral))" strokeWidth="1.5" />
      <line x1="12" y1="30" x2="30" y2="30" stroke="hsl(var(--goji-coral))" strokeWidth="1.5" />
    </svg>
  );
}

function WrenchIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path
        d="M33 6C28.5 6 25 9.5 25 14C25 15.2 25.3 16.3 25.8 17.3L10 33C9 34 9 35.7 10 36.7L13.3 40C14.3 41 16 41 17 40L33 24.2C34 24.7 35.1 25 36.3 25C40.7 25 44.2 21.5 44.2 17C44.2 16 44 15.1 43.6 14.2L38.5 19.3L34.7 18L33.4 14.2L38.5 9.1C37 7.1 35.1 6 33 6Z"
        fill="hsl(var(--goji-coral) / 0.1)"
        stroke="hsl(var(--goji-coral))"
        strokeWidth="2"
      />
    </svg>
  );
}

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = categories.filter(
    (c) =>
      search === "" ||
      c.title.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen font-sans" style={{ background: "hsl(var(--background))" }}>
      {/* Hero header */}
      <div
        className="relative pb-16"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% -10%, hsl(5 85% 70%) 0%, hsl(15 90% 80%) 30%, hsl(20 80% 90%) 55%, hsl(0 0% 100%) 80%)",
        }}
      >
        {/* Top nav */}
        <div className="flex items-center justify-between px-8 py-5 max-w-6xl mx-auto">
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-2"
          >
            <img src={gojiIcon} alt="Gojiberry" className="w-7 h-7 object-contain" />
            <span className="font-bold text-lg tracking-tight" style={{ color: "hsl(var(--goji-dark))" }}>
              gojiberry
            </span>
          </button>
          <button
            onClick={() => navigate("/home")}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-all hover:opacity-80"
            style={{
              color: "hsl(var(--goji-dark))",
              background: "hsl(0 0% 100% / 0.7)",
              boxShadow: "0 1px 6px hsl(0 0% 0% / 0.08)",
            }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>
        </div>

        {/* Title + Search */}
        <div className="flex flex-col items-center text-center pt-8 pb-4 px-4">
          <h1
            className="text-3xl md:text-4xl font-bold mb-8 max-w-xl leading-tight"
            style={{ color: "hsl(var(--goji-dark))" }}
          >
            Advice and answers from the GojiberryAI Team
          </h1>

          {/* Search bar */}
          <div className="relative w-full max-w-lg">
            <Search
              className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
              style={{ color: "hsl(var(--goji-text-muted))" }}
            />
            <input
              type="text"
              placeholder="Search for articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-full text-sm outline-none focus:ring-2 focus:ring-[hsl(var(--goji-coral))] border-0"
              style={{
                background: "hsl(0 0% 100% / 0.9)",
                color: "hsl(var(--goji-dark))",
                boxShadow: "0 2px 12px hsl(0 0% 0% / 0.08)",
              }}
            />
          </div>
        </div>
      </div>

      {/* Category cards grid */}
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {filtered.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.title}
                className="flex flex-col items-center text-center p-8 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 group"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="mb-5">
                  <Icon className="w-12 h-12" />
                </div>
                <h3
                  className="font-bold text-sm mb-2"
                  style={{ color: "hsl(var(--goji-dark))" }}
                >
                  {cat.title}
                </h3>
                <p
                  className="text-xs leading-relaxed mb-5"
                  style={{ color: "hsl(var(--goji-text-muted))" }}
                >
                  {cat.description}
                </p>
                <p
                  className="text-xs mt-auto pt-3 border-t border-border w-full"
                  style={{ color: "hsl(var(--goji-text-muted))" }}
                >
                  {cat.articles} articles
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
