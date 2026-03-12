import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TemplatesSection from "@/components/TemplatesSection";
import PricingSection from "@/components/PricingSection";
import FAQSection from "@/components/FAQSection";
import CTASection from "@/components/CTASection";
import SEOHead from "@/components/SEOHead";
import { useCaptureAffiliate } from "@/hooks/use-affiliate";

const Index = () => {
  useCaptureAffiliate();
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Vowz – Create Free Indian Wedding Invitations & Websites Online"
        description="Design beautiful digital wedding invitations and personalized wedding websites for Indian weddings. Free to start. Easy WhatsApp sharing. Made for couples in India & abroad."
        ogTitle="Vowz – Digital Wedding Invitations & Websites"
        ogDescription="Create stunning Indian wedding invites and websites in minutes. WhatsApp sharing, RSVP, custom domains – free & paid plans starting at ₹499."
        ogImage="https://vowz.me/og-home.jpg"
        ogUrl="https://vowz.me"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Vowz – Wedding Invitations & Websites"
        twitterDescription="Free digital wedding cards & websites for Indian couples."
        twitterImage="https://vowz.me/og-home.jpg"
        canonical="https://vowz.me"
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TemplatesSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default Index;
