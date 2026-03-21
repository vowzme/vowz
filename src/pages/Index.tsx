import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import TemplatesSection from "@/components/TemplatesSection";
import TestimonialsSection from "@/components/TestimonialsSection";
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
        title="Vowz — Where Vows Come Alive | Create Beautiful Wedding Websites"
        description="Create stunning, personalized wedding websites in minutes. RSVP management, photo gallery, event schedules — celebrate every moment beautifully."
        ogTitle="Vowz – Digital Wedding Invitations & Websites"
        ogDescription="Create stunning Indian wedding invites and websites in minutes. WhatsApp sharing, RSVP, custom domains – free & Premium at ₹599/year."
        ogImage="https://vowz.me/og-home.jpg"
        ogUrl="https://vowz.me"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Vowz – Wedding Invitations & Websites"
        twitterDescription="Free digital wedding cards & websites for Indian couples."
        twitterImage="https://vowz.me/og-home.jpg"
        canonical="https://vowz.me"
        robots="index, follow"
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <TemplatesSection />
      <TestimonialsSection />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </div>
  );
};

export default Index;
