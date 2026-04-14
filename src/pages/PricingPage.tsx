import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import { Footer } from "@/components/CTAFooter";
import { isOnboardingComplete } from "@/components/OnboardingGuard";

const PricingPage = () => {
  const showCampaigns = isOnboardingComplete();

  return (
    <div className="min-h-screen bg-background font-sans">
      <Navbar showCampaigns={showCampaigns} forceDark />
      <div className="pt-20">
        <Pricing />
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;
