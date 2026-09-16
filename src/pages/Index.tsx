import { lazy, Suspense } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import SEOHead from "@/components/SEOHead";
import { useCaptureAffiliate } from "@/hooks/use-affiliate";
import { usePricingRegion, formatPrice } from "@/hooks/use-pricing-region";

// Below-the-fold sections load after the hero so first paint stays fast.
const TemplatesSection = lazy(() => import("@/components/TemplatesSection"));
const LuxeHomeSection = lazy(() => import("@/components/LuxeHomeSection"));
const TestimonialsSection = lazy(() => import("@/components/TestimonialsSection"));
const PricingSection = lazy(() => import("@/components/PricingSection"));
const FAQSection = lazy(() => import("@/components/FAQSection"));
const CTASection = lazy(() => import("@/components/CTASection"));

const SectionFallback = () => <div className="h-64" aria-hidden="true" />;

const Index = () => {
  useCaptureAffiliate();
  const { pricing } = usePricingRegion();

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Vowz",
    url: "https://vowz.me",
    description: "Create stunning, personalized wedding websites in minutes. RSVP management, photo gallery, event schedules — celebrate every moment beautifully.",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Free Trial",
        price: "0",
        priceCurrency: "USD",
        description: "7-day free trial with full access to all features",
      },
      {
        "@type": "Offer",
        name: "Premium",
        price: pricing.premiumPrice,
        priceCurrency: pricing.symbol === "₹" ? "INR" : "USD",
        description: "Annual premium plan with all features",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.9",
      reviewCount: "120",
      bestRating: "5",
    },
  };

  // FAQ structured data
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Is Vowz really free?",
        acceptedAnswer: { "@type": "Answer", text: "Yes! Start with a 7-day free trial that includes all features — no credit card required. Upgrade to Premium to keep your site live forever." },
      },
      {
        "@type": "Question",
        name: "Is my wedding site mobile-friendly?",
        acceptedAnswer: { "@type": "Answer", text: "100%. Every Vowz site is fully responsive and optimized for phones, tablets, and desktops." },
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Vowz — Create Beautiful Wedding Websites & Invites"
        description="Create stunning, personalized wedding websites in minutes. RSVP management, photo gallery, event schedules — celebrate every moment beautifully."
        ogTitle="Vowz – Digital Wedding Invitations & Websites"
        ogDescription={`Create stunning wedding websites in minutes. Free 7-day trial, Premium from ${formatPrice(pricing, "premium")}/year. WhatsApp sharing, RSVP, and more.`}
        ogImage="https://vowz.me/og-home.jpg"
        ogUrl="https://vowz.me"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Vowz – Wedding Invitations & Websites"
        twitterDescription="Free digital wedding cards & websites. RSVP, photo gallery, multilingual & more."
        twitterImage="https://vowz.me/og-home.jpg"
        canonical="https://vowz.me"
        robots="index, follow"
      />
      <script type="application/ld+json">{JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
      <script type="application/ld+json">{JSON.stringify(faqJsonLd).replace(/</g, "\\u003c")}</script>
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <Suspense fallback={<SectionFallback />}>
          <TemplatesSection />
          <TestimonialsSection />
          <PricingSection />
          <FAQSection />
          <CTASection />
        </Suspense>
      </main>
    </div>
  );
};

export default Index;
