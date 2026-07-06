import { useEffect } from "react";
import { ttqViewContent } from "@/lib/tiktok-pixel";
import Navbar from "@/components/Navbar";
import {
  AnnouncementBar,
  MonteraHero,
  LimitlessAccess,
  FutureBento,
  AdReady,
  AllInOne,
  DarkSpace,
  BusinessEngine,
  TestimonialsRows,
  FinalMonteraCTA,
  MonteraFooter,
} from "@/components/landing/montera/MonteraLanding";
import { isOnboardingComplete } from "@/components/OnboardingGuard";

const Index = () => {
  const showCampaigns = isOnboardingComplete();
  useEffect(() => { ttqViewContent("Landing Page", "landing"); }, []);

  return (
    <div className="min-h-screen bg-white font-sans">
      <AnnouncementBar />
      <Navbar showCampaigns={showCampaigns} forceDark />
      <MonteraHero />
      <LimitlessAccess />
      <FutureBento />
      <AdReady />
      <AllInOne />
      <DarkSpace />
      <BusinessEngine />
      <TestimonialsRows />
      <FinalMonteraCTA />
      <MonteraFooter />
    </div>
  );
};

export default Index;
