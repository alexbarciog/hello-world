import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LogoMarquee from "@/components/LogoMarquee";
import Features from "@/components/Features";
import HowItWorks from "@/components/HowItWorks";
import Pricing from "@/components/Pricing";

import FAQ from "@/components/FAQ";
import { CTASection, Footer } from "@/components/CTAFooter";
import { isOnboardingComplete } from "@/components/OnboardingGuard";

const Index = () => {
  const [searchParams] = useSearchParams();
  const campaignId = searchParams.get("campaign_id");
  const showCampaigns = isOnboardingComplete();

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar showCampaigns={showCampaigns} />
      <Hero />
      <LogoMarquee />
      <Features />
      <HowItWorks />
      
      
      <FAQ />
      <Pricing />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
