import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import LogoMarquee from "@/components/LogoMarquee";
import AboutStats from "@/components/AboutStats";
import ServicesSection from "@/components/ServicesSection";
import ExpertiseSection from "@/components/ExpertiseSection";
import Pricing from "@/components/Pricing";
import Testimonials from "@/components/Testimonials";
import { CTASection, Footer } from "@/components/CTAFooter";
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
      <AboutStats />
      <ServicesSection />
      <ExpertiseSection />
      <Pricing />
      <Testimonials />
      <CTASection />
      <Footer />
    </div>
  );
};

export default Index;
