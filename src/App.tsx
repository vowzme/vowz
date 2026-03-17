import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { HelmetProvider } from "react-helmet-async";
import { PricingRegionProvider } from "@/hooks/use-pricing-region";
import Layout from "@/components/Layout";
import ScrollToTop from "@/components/ScrollToTop";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Dashboard from "./pages/Dashboard";
import OnboardingWizard from "./pages/OnboardingWizard";
import Editor from "./pages/Editor";
import PublicSite from "./pages/PublicSite";
import Templates from "./pages/Templates";
import NotFound from "./pages/NotFound";
import DomainWizardDemo from "./pages/DomainWizardDemo";
import Pricing from "./pages/Pricing";
import Affiliate from "./pages/Affiliate";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import Contact from "./pages/Contact";
import AboutUs from "./pages/AboutUs";
import RefundPolicy from "./pages/RefundPolicy";
import AdminLayout from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSites from "./pages/admin/AdminSites";
import AdminPayments from "./pages/admin/AdminPayments";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminCoupons from "./pages/admin/AdminCoupons";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Layout><Index /></Layout>} />
    <Route path="/auth" element={<Layout><Auth /></Layout>} />
    <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
    <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/wizard" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
    <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
    <Route path="/editor/:siteId" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
    <Route path="/site/:slug" element={<PublicSite />} />
    <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
    <Route path="/templates" element={<Layout><Templates /></Layout>} />
    <Route path="/domain-demo" element={<Layout><DomainWizardDemo /></Layout>} />
    <Route path="/affiliate" element={<Layout><Affiliate /></Layout>} />
    <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
    <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
    <Route path="/contact" element={<Layout><Contact /></Layout>} />
    <Route path="/about" element={<Layout><AboutUs /></Layout>} />
    <Route path="/refund-policy" element={<Layout><RefundPolicy /></Layout>} />
    <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
    <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
    <Route path="/admin/sites" element={<AdminLayout><AdminSites /></AdminLayout>} />
    <Route path="/admin/payments" element={<AdminLayout><AdminPayments /></AdminLayout>} />
    <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
    <Route path="/admin/blog" element={<AdminLayout><AdminBlog /></AdminLayout>} />
    <Route path="/blog" element={<Layout><Blog /></Layout>} />
    <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />
    <Route path="*" element={<Layout><NotFound /></Layout>} />
  </Routes>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PricingRegionProvider>
          <AuthProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <AppRoutes />
            </BrowserRouter>
          </AuthProvider>
        </PricingRegionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
