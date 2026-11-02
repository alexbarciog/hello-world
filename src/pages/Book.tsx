import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/CTAFooter";
import { CONTACT_EMAIL } from "@/lib/billing";

// Hidden page (not linked or in the sitemap) for people who insist on talking
// before they try. Everyone else goes straight to the self-serve trial.
export default function Book() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar forceDark />
      <main className="pt-32 pb-24 px-6">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-3xl md:text-4xl font-medium tracking-tight mb-4" style={{ color: "hsl(var(--aeline-dark))" }}>
            Prefer to talk first?
          </h1>
          <p className="text-muted-foreground leading-relaxed mb-8">
            Email Alex with what you sell and who you sell to. You'll get a reply within a day, and a call if it helps.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}?subject=Intentsly%20question`} className="btn-cta inline-flex">
            <Mail className="w-4 h-4" />
            {CONTACT_EMAIL}
          </a>
          <p className="text-sm text-muted-foreground mt-8">
            Or skip the wait: <Link to="/register" className="underline underline-offset-2">start the 7-day free trial</Link>, setup takes about 5 minutes.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
