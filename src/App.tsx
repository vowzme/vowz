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
import PlatformAnalytics from "@/components/PlatformAnalytics";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import { IosInstallPrompt } from "./components/IosInstallPrompt";
import MobileBottomNav from "@/components/MobileBottomNav";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import { useAdmin } from "@/hooks/use-admin";
import ErrorBoundary from "@/components/ErrorBoundary";
import RealtimeRecovery from "@/components/RealtimeRecovery";

const Auth = lazy(() => import("./pages/Auth"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const AlbumModeration = lazy(() => import("./pages/AlbumModeration"));
const OnboardingWizard = lazy(() => import("./pages/OnboardingWizard"));
const Editor = lazy(() => import("./pages/Editor"));
const PublicSite = lazy(() => import("./pages/PublicSite"));
const Templates = lazy(() => import("./pages/Templates"));
const Themes = lazy(() => import("./pages/Themes"));
const ToolsHub = lazy(() => import("./pages/ToolsHub"));
const FreeToolPage = lazy(() => import("./pages/FreeToolPage"));
const WeddingReport = lazy(() => import("./pages/WeddingReport"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Affiliate = lazy(() => import("./pages/Affiliate"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const Contact = lazy(() => import("./pages/Contact"));
const AboutUs = lazy(() => import("./pages/AboutUs"));
const RefundPolicy = lazy(() => import("./pages/RefundPolicy"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminSites = lazy(() => import("./pages/admin/AdminSites"));
const AdminPayments = lazy(() => import("./pages/admin/AdminPayments"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminCoupons = lazy(() => import("./pages/admin/AdminCoupons"));
const AdminFeatureRequests = lazy(() => import("./pages/admin/AdminFeatureRequests"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminCardTemplates = lazy(() => import("./pages/admin/AdminCardTemplates"));
const AdminCardAnalytics = lazy(() => import("./pages/admin/AdminCardAnalytics"));
const AdminStorageCleanup = lazy(() => import("./pages/admin/AdminStorageCleanup"));
const AdminEmails = lazy(() => import("./pages/admin/AdminEmails"));
const AdminEmailAbTests = lazy(() => import("./pages/admin/AdminEmailAbTests"));
const AdminReminderRuns = lazy(() => import("./pages/admin/AdminReminderRuns"));
const AdminEmailBranding = lazy(() => import("./pages/admin/AdminEmailBranding"));
const AdminGuestModeration = lazy(() => import("./pages/admin/AdminGuestModeration"));
const AdminRsvps = lazy(() => import("./pages/admin/AdminRsvps"));
const AdminVisitors = lazy(() => import("./pages/admin/AdminVisitors"));
const InvitationCard = lazy(() => import("./pages/InvitationCard"));
const CardGallery = lazy(() => import("./pages/CardGallery"));
const CardTemplatesPreview = lazy(() => import("./pages/CardTemplatesPreview"));
const FranchiseDashboard = lazy(() => import("./pages/FranchiseDashboard"));
const FranchiseLanding = lazy(() => import("./pages/FranchiseLanding"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const Showcase = lazy(() => import("./pages/Showcase"));
const SharePreview = lazy(() => import("./pages/SharePreview"));
const Share = lazy(() => import("./pages/Share"));
const SharedCard = lazy(() => import("./pages/SharedCard"));
const IconsDebug = lazy(() => import("./pages/IconsDebug"));
const PwaDiagnostics = lazy(() => import("./pages/PwaDiagnostics"));
const TwaVerify = lazy(() => import("./pages/TwaVerify"));
const WidgetSettings = lazy(() => import("./pages/WidgetSettings"));
const GuestList = lazy(() => import("./pages/GuestList"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const ReminderSettings = lazy(() => import("./pages/ReminderSettings"));
const Payments = lazy(() => import("./pages/Payments"));
const OnlineWeddingCardMaker = lazy(() => import("./pages/OnlineWeddingCardMaker"));

const RouteFallback = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
  </div>
);

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

function AdminOnlyRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();
  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!isAdmin) return <Navigate to="/" replace />;
  return <>{children}</>;
}

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Layout><Index /></Layout>} />
    <Route path="/auth" element={<Layout><Auth /></Layout>} />
    <Route path="/forgot-password" element={<Layout><ForgotPassword /></Layout>} />
    <Route path="/reset-password" element={<Layout><ResetPassword /></Layout>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/dashboard/widgets" element={<ProtectedRoute><WidgetSettings /></ProtectedRoute>} />
    <Route path="/dashboard/guests/:siteId" element={<ProtectedRoute><GuestList /></ProtectedRoute>} />
    <Route path="/dashboard/album/:siteId" element={<ProtectedRoute><AlbumModeration /></ProtectedRoute>} />
    <Route path="/dashboard/reminders" element={<ProtectedRoute><ReminderSettings /></ProtectedRoute>} />
    <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} /></ProtectedRoute>} />
    <Route path="/wizard" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
    <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
    <Route path="/editor/:siteId" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
    <Route path="/invitation-card/:siteId" element={<ProtectedRoute><InvitationCard /></ProtectedRoute>} />
    <Route path="/site/:slug" element={<PublicSite />} />
    <Route path="/card/:token" element={<SharedCard />} />
    <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
    <Route path="/templates" element={<Layout><Templates /></Layout>} />
    <Route path="/themes" element={<Layout><Themes /></Layout>} />
    <Route path="/tools" element={<ToolsHub />} />
    <Route path="/tools/:slug" element={<FreeToolPage />} />
    <Route path="/wedding-report" element={<WeddingReport />} />
    <Route path="/online-wedding-card-maker" element={<Layout><OnlineWeddingCardMaker /></Layout>} />
    <Route path="/showcase" element={<Showcase />} />
    <Route path="/share-preview" element={<Layout><SharePreview /></Layout>} />
    <Route path="/share" element={<Share />} />
    <Route path="/debug/icons" element={<AdminOnlyRoute><IconsDebug /></AdminOnlyRoute>} />
    <Route path="/debug/pwa" element={<AdminOnlyRoute><PwaDiagnostics /></AdminOnlyRoute>} />
    <Route path="/debug/twa" element={<AdminOnlyRoute><TwaVerify /></AdminOnlyRoute>} />
    <Route path="/card-gallery" element={<CardGallery />} />
    <Route path="/card-templates-preview" element={<CardTemplatesPreview />} />
    <Route path="/affiliate" element={<Layout><Affiliate /></Layout>} />
    <Route path="/franchise" element={<Layout><FranchiseLanding /></Layout>} />
    <Route path="/franchise/dashboard" element={<FranchiseDashboard />} />
    <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
    <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
    <Route path="/contact" element={<Layout><Contact /></Layout>} />
    <Route path="/about" element={<Layout><AboutUs /></Layout>} />
    <Route path="/refund-policy" element={<Layout><RefundPolicy /></Layout>} />
    <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
    <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path="/admin/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
    <Route path="/admin/sites" element={<AdminLayout><AdminSites /></AdminLayout>} />
    <Route path="/admin/payments" element={<AdminLayout><AdminPayments /></AdminLayout>} /></AdminLayout>} />
    <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
      <Route path="/admin/coupons" element={<AdminLayout><AdminCoupons /></AdminLayout>} />
      <Route path="/admin/blog" element={<AdminLayout><AdminBlog /></AdminLayout>} />
      <Route path="/admin/feature-requests" element={<AdminLayout><AdminFeatureRequests /></AdminLayout>} />
      <Route path="/admin/partners" element={<AdminLayout><AdminPartners /></AdminLayout>} />
      <Route path="/admin/card-templates" element={<AdminLayout><AdminCardTemplates /></AdminLayout>} />
    <Route path="/admin/card-analytics" element={<AdminLayout><AdminCardAnalytics /></AdminLayout>} />
    <Route path="/admin/storage-cleanup" element={<AdminLayout><AdminStorageCleanup /></AdminLayout>} />
    <Route path="/admin/emails" element={<AdminLayout><AdminEmails /></AdminLayout>} />
    <Route path="/admin/email-ab" element={<AdminLayout><AdminEmailAbTests /></AdminLayout>} />
    <Route path="/admin/reminder-runs" element={<AdminLayout><AdminReminderRuns /></AdminLayout>} />
    <Route path="/admin/email-branding" element={<AdminLayout><AdminEmailBranding /></AdminLayout>} />
    <Route path="/admin/guest-moderation" element={<AdminLayout><AdminGuestModeration /></AdminLayout>} />
    <Route path="/admin/rsvps" element={<AdminLayout><AdminRsvps /></AdminLayout>} />
    <Route path="/admin/visitors" element={<AdminLayout><AdminVisitors /></AdminLayout>} />
    <Route path="/blog" element={<Layout><Blog /></Layout>} />
    <Route path="/blog/:slug" element={<Layout><BlogPost /></Layout>} />
    <Route path="/delete-account" element={<Layout><DeleteAccount /></Layout>} />
    <Route path="*" element={<Layout><NotFound /></Layout>} />
  </Routes>
);

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <PricingRegionProvider>
          <AuthProvider>
            <RealtimeRecovery />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <PlatformAnalytics />
              <ErrorBoundary>
                <Suspense fallback={<RouteFallback />}>
                  <AppRoutes />
                </Suspense>
              </ErrorBoundary>
              <WhatsAppSupport />
              <MobileBottomNav />
              <IosInstallPrompt />
            </BrowserRouter>
          </AuthProvider>
        </PricingRegionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
