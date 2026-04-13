import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import CampaignsPage from "./pages/Campaigns.tsx";
import CreateCampaign from "./pages/CreateCampaign.tsx";
import CampaignDetail from "./pages/CampaignDetail.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Settings from "./pages/Settings.tsx";
import HelpCenter from "./pages/HelpCenter.tsx";
import Signals from "./pages/Signals.tsx";
import Contacts from "./pages/Contacts.tsx";
import RedditSignals from "./pages/RedditSignals.tsx";
import XSignals from "./pages/XSignals.tsx";
import Unibox from "./pages/Unibox.tsx";
import NotFound from "./pages/NotFound.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";
import BillingPlans from "./pages/BillingPlans.tsx";
import Support from "./pages/Support.tsx";
import AdminDashboard from "./pages/AdminDashboard.tsx";
import VideoShowcase from "./pages/VideoShowcase.tsx";
import AiSdrOutreach from "./pages/features/AiSdrOutreach.tsx";
import ConversationalAi from "./pages/features/ConversationalAi.tsx";
import LinkedInSignals from "./pages/features/LinkedInSignals.tsx";
import RedditXMonitoring from "./pages/features/RedditXMonitoring.tsx";
import DashboardLayout from "./components/DashboardLayout.tsx";
import AuthGuard, { AuthOnlyGuard } from "./components/AuthGuard.tsx";
import { Navigate } from "react-router-dom";
import { useEffect } from "react";
import { ttqPage, ttqIdentify } from "@/lib/tiktok-pixel";
import { supabase } from "@/integrations/supabase/client";

const queryClient = new QueryClient();

// Fires ttq.page() on every SPA route change and identifies logged-in users
function TikTokPageTracker() {
  const location = useLocation();

  useEffect(() => {
    ttqPage();
  }, [location.pathname]);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        ttqIdentify({ email: user.email, external_id: user.id });
      }
    });
  }, []);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <TikTokPageTracker />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/features/ai-sdr" element={<AiSdrOutreach />} />
          <Route path="/features/conversational-ai" element={<ConversationalAi />} />
          <Route path="/features/linkedin-signals" element={<LinkedInSignals />} />
          <Route path="/features/reddit-x-signals" element={<RedditXMonitoring />} />
          <Route path="/onboarding" element={<AuthOnlyGuard><Onboarding /></AuthOnlyGuard>} />
          <Route
            path="/dashboard"
            element={<AuthGuard><DashboardLayout><Dashboard /></DashboardLayout></AuthGuard>}
          />
          <Route
            path="/campaigns"
            element={<AuthGuard><DashboardLayout><CampaignsPage /></DashboardLayout></AuthGuard>}
          />
          <Route
            path="/campaigns/:id"
            element={<AuthGuard><DashboardLayout><CampaignDetail /></DashboardLayout></AuthGuard>}
          />
          <Route
            path="/settings"
            element={<AuthGuard><DashboardLayout><Settings /></DashboardLayout></AuthGuard>}
          />
          <Route
            path="/signals"
            element={<AuthGuard><DashboardLayout><Signals /></DashboardLayout></AuthGuard>}
          />
          <Route
            path="/contacts"
            element={<AuthGuard><DashboardLayout><Contacts /></DashboardLayout></AuthGuard>}
          />
          <Route
            path="/reddit-signals"
            element={<AuthGuard><DashboardLayout><RedditSignals /></DashboardLayout></AuthGuard>}
          />
          <Route
            path="/x-signals"
            element={<AuthGuard><DashboardLayout><XSignals /></DashboardLayout></AuthGuard>}
          />
          <Route
            path="/unibox"
            element={<AuthGuard><DashboardLayout><Unibox /></DashboardLayout></AuthGuard>}
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/billing" element={<AuthGuard><DashboardLayout><BillingPlans /></DashboardLayout></AuthGuard>} />
          <Route path="/support" element={<AuthGuard><DashboardLayout><Support /></DashboardLayout></AuthGuard>} />
          <Route path="/admin" element={<AuthGuard><DashboardLayout><AdminDashboard /></DashboardLayout></AuthGuard>} />
          <Route path="/video" element={<VideoShowcase />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
