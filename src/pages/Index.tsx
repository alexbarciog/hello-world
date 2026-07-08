import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import Navbar from "@/components/Navbar";
import AnnouncementBar from "@/components/AnnouncementBar";
import Hero from "@/components/Hero";
import LogoMarquee from "@/components/LogoMarquee";

import HowItWorks from "@/components/landing/HowItWorks";
import UseCases from "@/components/landing/UseCases";
import WhyIntentsly from "@/components/landing/WhyIntentsly";
import Comparison from "@/components/landing/Comparison";
import FAQ from "@/components/FAQ";
import FinalCTA from "@/components/landing/FinalCTA";
import { Footer } from "@/components/CTAFooter";
import StickyMobileCTA from "@/components/landing/StickyMobileCTA";
import SectionReveal from "@/components/landing/SectionReveal";
import { isOnboardingComplete } from "@/components/OnboardingGuard";

const Index = () => {
  const [searchParams] = useSearchParams();
  const showCampaigns = isOnboardingComplete();
  useEffect(() => { ttqViewContent("Landing Page", "landing"); }, []);

  return (
    <div className="min-h-screen bg-background font-sans">
      <AnnouncementBar />
      <Navbar showCampaigns={showCampaigns} variant="light" />
      <Hero />
      <SectionReveal><LogoMarquee /></SectionReveal>
      <SectionReveal><HowItWorks /></SectionReveal>
      <SectionReveal><UseCases /></SectionReveal>
      <SectionReveal><WhyIntentsly /></SectionReveal>
      <SectionReveal><Comparison /></SectionReveal>
      <SectionReveal><FAQ /></SectionReveal>
      <SectionReveal><FinalCTA /></SectionReveal>
      {/* Mobile spacer so sticky CTA doesn't cover footer content */}
      <div className="md:hidden h-16" aria-hidden />
      <Footer />
      <StickyMobileCTA />
    </div>
  );
};

export default Index;
