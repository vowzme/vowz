import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import GoogleAnalytics from "@/components/GoogleAnalytics";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { HelmetProvider } from "react-helmet-async";
import { PricingRegionProvider } from "@/hooks/use-pricing-region";
import Layout from "@/components/Layout";
import PageShell from "@/components/PageShell";
import ScrollToTop from "@/components/ScrollToTop";
import PlatformAnalytics from "@/components/PlatformAnalytics";
import { lazy, Suspense } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminLayout from "./components/admin/AdminLayout";
import MobileBottomNav from "@/components/MobileBottomNav";
import WhatsAppSupport from "@/components/WhatsAppSupport";
import { useAdmin } from "@/hooks/use-admin";
import ErrorBoundary from "@/components/ErrorBoundary";
import RealtimeRecovery from "@/components/RealtimeRecovery";
import InstallPrompt from "@/components/InstallPrompt";

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
const AdminQrCodes = lazy(() => import("./pages/admin/AdminQrCodes"));
const SeoLanding = lazy(() => import("./pages/SeoLanding"));
const InstallApp = lazy(() => import("./pages/InstallApp"));
const QrRedirect = lazy(() => import("./pages/QrRedirect"));
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
const GuestList = lazy(() => import("./pages/GuestList"));
const DeleteAccount = lazy(() => import("./pages/DeleteAccount"));
const ReminderSettings = lazy(() => import("./pages/ReminderSettings"));
const Payments = lazy(() => import("./pages/Payments"));
const OnlineWeddingCardMaker = lazy(() => import("./pages/OnlineWeddingCardMaker"));
const SeatingChart = lazy(() => import("./pages/SeatingChart"));
const PhotoWall = lazy(() => import("./pages/PhotoWall"));
const Vendors = lazy(() => import("./pages/Vendors"));
const VendorProfile = lazy(() => import("./pages/VendorProfile"));
const VendorSignup = lazy(() => import("./pages/VendorSignup"));
const VendorDashboard = lazy(() => import("./pages/VendorDashboard"));
const AdminVendors = lazy(() => import("./pages/admin/AdminVendors"));

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
    <Route path="/dashboard/guests/:siteId" element={<ProtectedRoute><GuestList /></ProtectedRoute>} />
    <Route path="/dashboard/album/:siteId" element={<ProtectedRoute><AlbumModeration /></ProtectedRoute>} />
    <Route path="/dashboard/reminders" element={<ProtectedRoute><ReminderSettings /></ProtectedRoute>} />
    <Route path="/dashboard/payments" element={<ProtectedRoute><Payments /></ProtectedRoute>} />
    <Route path="/dashboard/seating/:siteId" element={<ProtectedRoute><SeatingChart /></ProtectedRoute>} />
    <Route path="/photo-wall/:slug" element={<PhotoWall />} />
    <Route path="/vendors" element={<PageShell><Vendors /></PageShell>} />
    <Route path="/vendors/signup" element={<PageShell><VendorSignup /></PageShell>} />
    <Route path="/vendors/:category" element={<PageShell><Vendors /></PageShell>} />
    <Route path="/vendor/dashboard" element={<ProtectedRoute><PageShell><VendorDashboard /></PageShell></ProtectedRoute>} />
    <Route path="/vendor/:slug" element={<PageShell><VendorProfile /></PageShell>} />
    <Route path="/wizard" element={<ProtectedRoute><OnboardingWizard /></ProtectedRoute>} />
    <Route path="/editor" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
    <Route path="/editor/:siteId" element={<ProtectedRoute><Editor /></ProtectedRoute>} />
    <Route path="/invitation-card/:siteId" element={<ProtectedRoute><InvitationCard /></ProtectedRoute>} />
    <Route path="/site/:slug" element={<PublicSite />} />
    <Route path="/card/:token" element={<SharedCard />} />
    <Route path="/pricing" element={<Layout><Pricing /></Layout>} />
    <Route path="/templates" element={<Layout><Templates /></Layout>} />
    <Route path="/themes" element={<PageShell><Themes /></PageShell>} />
    <Route path="/tools" element={<ToolsHub />} />
    <Route path="/tools/:slug" element={<FreeToolPage />} />
    <Route path="/wedding-report" element={<WeddingReport />} />
    <Route path="/online-wedding-card-maker" element={<PageShell><OnlineWeddingCardMaker /></PageShell>} />
    <Route path="/showcase" element={<PageShell><Showcase /></PageShell>} />
    <Route path="/share-preview" element={<PageShell><SharePreview /></PageShell>} />
    <Route path="/share" element={<PageShell><Share /></PageShell>} />
    <Route path="/card-gallery" element={<CardGallery />} />
    <Route path="/card-templates-preview" element={<PageShell><CardTemplatesPreview /></PageShell>} />
    <Route path="/affiliate" element={<PageShell><Affiliate /></PageShell>} />
    <Route path="/affiliate/signup" element={<PageShell><Affiliate /></PageShell>} />
    <Route path="/whatsapp-wedding-invitation" element={<PageShell><SeoLanding page="whatsapp" /></PageShell>} />
    <Route path="/indian-wedding-website" element={<PageShell><SeoLanding page="indian" /></PageShell>} />
    <Route path="/install" element={<PageShell><InstallApp /></PageShell>} />
    <Route path="/franchise" element={<PageShell><FranchiseLanding /></PageShell>} />
    <Route path="/franchise/dashboard" element={<PageShell><FranchiseDashboard /></PageShell>} />
    <Route path="/privacy" element={<Layout><PrivacyPolicy /></Layout>} />
    <Route path="/terms" element={<Layout><TermsOfService /></Layout>} />
    <Route path="/contact" element={<Layout><Contact /></Layout>} />
    <Route path="/about" element={<Layout><AboutUs /></Layout>} />
    <Route path="/refund-policy" element={<Layout><RefundPolicy /></Layout>} />
    <Route path="/admin" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
    <Route path="/admin/users" element={<AdminLayout><AdminUsers /></AdminLayout>} />
      <Route path="/admin/analytics" element={<AdminLayout><AdminAnalytics /></AdminLayout>} />
    <Route path="/admin/sites" element={<AdminLayout><AdminSites /></AdminLayout>} />
    <Route path="/admin/payments" element={<AdminLayout><AdminPayments /></AdminLayout>} />
    <Route path="/admin/settings" element={<AdminLayout><AdminSettings /></AdminLayout>} />
      <Route path="/admin/coupons" element={<AdminLayout><AdminCoupons /></AdminLayout>} />
      <Route path="/admin/blog" element={<AdminLayout><AdminBlog /></AdminLayout>} />
      <Route path="/admin/feature-requests" element={<AdminLayout><AdminFeatureRequests /></AdminLayout>} />
      <Route path="/admin/qr-codes" element={<AdminLayout><AdminQrCodes /></AdminLayout>} />
      <Route path="/q/:code" element={<QrRedirect />} />
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
    <Route path="/admin/vendors" element={<AdminLayout><AdminVendors /></AdminLayout>} />
    <Route path="/blog" element={<PageShell><Blog /></PageShell>} />
    <Route path="/blog/:slug" element={<PageShell><BlogPost /></PageShell>} />
    <Route path="/delete-account" element={<PageShell><DeleteAccount /></PageShell>} />
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
              <GoogleAnalytics />
              <ErrorBoundary>
                <Suspense fallback={<RouteFallback />}>
                  <AppRoutes />
                </Suspense>
              </ErrorBoundary>
              <WhatsAppSupport />
              <MobileBottomNav />
              <InstallPrompt />
            </BrowserRouter>
          </AuthProvider>
        </PricingRegionProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
