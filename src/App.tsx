import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Onboarding from "./pages/Onboarding.tsx";
import Login from "./pages/Login.tsx";
import Register from "./pages/Register.tsx";
import ForgotPassword from "./pages/ForgotPassword.tsx";
import CampaignsPage from "./pages/Campaigns.tsx";
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
import DashboardLayout from "./components/DashboardLayout.tsx";
import AuthGuard, { AuthOnlyGuard } from "./components/AuthGuard.tsx";
import { Navigate } from "react-router-dom";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
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
