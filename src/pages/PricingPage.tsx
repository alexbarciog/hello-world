import { useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Pricing from "@/components/Pricing";
import FAQ from "@/components/FAQ";
import { Footer } from "@/components/CTAFooter";
import { isOnboardingComplete } from "@/components/OnboardingGuard";
import { DemoVideo } from "@/components/billing/DemoVideo";
import { PricingFaq } from "@/components/billing/PricingFaq";

const PricingPage = () => {
  const showCampaigns = isOnboardingComplete();
  const [params] = useSearchParams();

  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      <Navbar showCampaigns={showCampaigns} forceDark />
      <div className="pt-20">
        <Pricing selected={params.get("plan")} source="pricing_page" />

        <section className="px-4 sm:px-6 pb-16 md:pb-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-medium tracking-tight text-center mb-6" style={{ color: "hsl(var(--aeline-dark))" }}>
              See it in action
            </h2>
            <DemoVideo />
          </div>
        </section>

        <PricingFaq />
        <FAQ />
      </div>
      <Footer />
    </div>
  );
};

export default PricingPage;
