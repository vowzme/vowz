import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Terms of Service – Vowz Wedding Website Builder"
      description="Read the Vowz Terms of Service by AXPIR TECH. Learn about acceptable use, content ownership, payments, and your rights."
      ogTitle="Terms of Service – Vowz"
      ogDescription="Terms and conditions for using the Vowz wedding website platform."
      ogImage="https://vowz.me/og-home.jpg"
      ogUrl="https://vowz.me/terms"
      ogType="website"
      twitterCard="summary"
      canonical="https://vowz.me/terms"
      robots="index, follow"
    />
    <Navbar />
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">Terms of Service</h1>
      <p className="text-muted-foreground font-body text-sm mb-10">Last updated: March 12, 2026</p>

      {[
        { title: "1. Acceptance of Terms", body: "By accessing or using VowZ (vowz.me), a product of AXPIR Tech India LLP, you agree to be bound by these Terms of Service. If you do not agree, please do not use our service." },
        { title: "2. Service Description", body: "Vowz provides an AI-powered platform for creating personalized wedding websites. Our free plan includes basic features; premium features require a paid subscription." },
        { title: "3. User Accounts", body: "You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account. One account per person is permitted." },
        { title: "4. Acceptable Use", body: "You may not use Vowz for unlawful purposes, to upload harmful or offensive content, or to violate the rights of others. We reserve the right to remove content that violates these terms." },
        { title: "5. Content Ownership", body: "You retain ownership of all content you upload (photos, text, etc.). By using our service, you grant Vowz a limited license to host and display your content as part of your wedding website." },
        { title: "6. Payment & Refunds", body: "Premium subscriptions are billed as stated at the time of purchase. Refund requests are handled on a case-by-case basis within 14 days of purchase." },
        { title: "7. Service Availability", body: "We strive for 99.9% uptime but do not guarantee uninterrupted service. We are not liable for temporary outages or data loss beyond our reasonable control." },
        { title: "8. Termination", body: "We may suspend or terminate accounts that violate these terms. You may delete your account at any time. Upon termination, your data will be permanently removed within 30 days." },
        { title: "9. Governing Law", body: "These terms are governed by and construed in accordance with the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Kochi, Kerala." },
        { title: "10. Changes to Terms", body: "We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms." },
        { title: "11. Contact", body: "For questions about these terms, please contact AXPIR Tech India LLP at hi@vowz.me or call +91 8111852030. Address: 1st Floor, CC 54,2593-5, Door No G-307, Bose Nagar Road, Elamkulam, Kochi, Ernakulam, Kerala - 682020." },
      ].map((s) => (
        <div key={s.title} className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">{s.title}</h2>
          <p className="font-body text-muted-foreground leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  </div>
);

export default TermsOfService;
