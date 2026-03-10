import Navbar from "@/components/Navbar";

const TermsOfService = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">Terms of Service</h1>
      <p className="text-muted-foreground font-body text-sm mb-10">Last updated: March 10, 2026</p>

      {[
        { title: "1. Acceptance of Terms", body: "By accessing or using VowZ (vowz.me), you agree to be bound by these Terms of Service. If you do not agree, please do not use our service." },
        { title: "2. Service Description", body: "Vowz provides an AI-powered platform for creating personalized wedding websites. Our free plan includes basic features; premium features require a paid subscription." },
        { title: "3. User Accounts", body: "You are responsible for maintaining the security of your account credentials. You must provide accurate information when creating an account. One account per person is permitted." },
        { title: "4. Acceptable Use", body: "You may not use Vowz for unlawful purposes, to upload harmful or offensive content, or to violate the rights of others. We reserve the right to remove content that violates these terms." },
        { title: "5. Content Ownership", body: "You retain ownership of all content you upload (photos, text, etc.). By using our service, you grant Vowz a limited license to host and display your content as part of your wedding website." },
        { title: "6. Payment & Refunds", body: "Premium subscriptions are billed as stated at the time of purchase. Refund requests are handled on a case-by-case basis within 14 days of purchase." },
        { title: "7. Service Availability", body: "We strive for 99.9% uptime but do not guarantee uninterrupted service. We are not liable for temporary outages or data loss beyond our reasonable control." },
        { title: "8. Termination", body: "We may suspend or terminate accounts that violate these terms. You may delete your account at any time. Upon termination, your data will be permanently removed within 30 days." },
        { title: "9. Changes to Terms", body: "We may update these terms from time to time. Continued use of the service after changes constitutes acceptance of the updated terms." },
        { title: "10. Contact", body: "For questions about these terms, please contact us at legal@vowz.co." },
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