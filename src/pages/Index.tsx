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
import { usePricingRegion, formatPrice } from "@/hooks/use-pricing-region";

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
        name: "Can I use my own domain?",
        acceptedAnswer: { "@type": "Answer", text: "Yes! Premium users can connect a custom domain like yournames.com with guided DNS setup and automatic SSL." },
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
        title="Vowz — Where Vows Come Alive | Create Beautiful Wedding Websites"
        description="Create stunning, personalized wedding websites in minutes. RSVP management, photo gallery, event schedules — celebrate every moment beautifully."
        ogTitle="Vowz – Digital Wedding Invitations & Websites"
        ogDescription={`Create stunning wedding websites in minutes. Free 7-day trial, Premium from ${formatPrice(pricing, "premium")}/year. WhatsApp sharing, RSVP, custom domains.`}
        ogImage="https://vowz.me/og-home.jpg"
        ogUrl="https://vowz.me"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Vowz – Wedding Invitations & Websites"
        twitterDescription="Free digital wedding cards & websites. RSVP, photo gallery, custom domains & more."
        twitterImage="https://vowz.me/og-home.jpg"
        canonical="https://vowz.me"
        robots="index, follow"
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <TemplatesSection />
        <TestimonialsSection />
        <PricingSection />
        <FAQSection />
        <CTASection />
      </main>
    </div>
  );
};

export default Index;
