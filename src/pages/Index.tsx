import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LogoMarquee from "@/components/LogoMarquee";
import ProblemSection from "@/components/landing/ProblemSection";
import HowItWorks from "@/components/landing/HowItWorks";
import UseCases from "@/components/landing/UseCases";
import WhyIntentsly from "@/components/landing/WhyIntentsly";
import Comparison from "@/components/landing/Comparison";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import { Footer } from "@/components/CTAFooter";
import StickyMobileCTA from "@/components/landing/StickyMobileCTA";
import { isOnboardingComplete } from "@/components/OnboardingGuard";

const Index = () => {
  const [searchParams] = useSearchParams();
  const showCampaigns = isOnboardingComplete();
  useEffect(() => { ttqViewContent("Landing Page", "landing"); }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar showCampaigns={showCampaigns} />
      <Hero />
      <LogoMarquee />
      <ProblemSection />
      <HowItWorks />
      <UseCases />
      <WhyIntentsly />
      <Comparison />
      <Pricing />
      <FAQ />
      <FinalCTA />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
};

export default Index;
