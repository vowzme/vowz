import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";

const RefundPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Refund & Cancellation Policy – Vowz by AXPIR TECH"
      description="Read the Vowz Refund & Cancellation Policy. Refunds are issued only if we are unable to provide the services offered on our platform."
      ogTitle="Refund & Cancellation Policy – Vowz"
      ogDescription="Vowz refund policy by AXPIR TECH. Refunds apply only when offered services cannot be delivered."
      ogImage="https://vowz.me/og-home.jpg"
      ogUrl="https://vowz.me/refund-policy"
      ogType="website"
      twitterCard="summary"
      canonical="https://vowz.me/refund-policy"
      robots="index, follow"
    />
    <Navbar />
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">Refund &amp; Cancellation Policy</h1>
      <p className="text-muted-foreground font-body text-sm mb-10">Last updated: March 12, 2026</p>

      {[
        {
          title: "1. Overview",
          body: "This Refund & Cancellation Policy applies to all paid subscriptions and services purchased on VowZ (vowz.me), a product of AXPIR TECH, proprietorship of Anooj Xavier.",
        },
        {
          title: "2. Refund Eligibility",
          body: "Refunds are issued only in the event that AXPIR TECH is unable to provide the services offered and described on the VowZ platform. If the subscribed features and services are delivered as described, no refund will be applicable.",
        },
        {
          title: "3. Non-Refundable Scenarios",
          body: "Refunds will not be provided for: change of mind after purchase, failure to use the service within the subscription period, issues caused by user error or third-party services outside our control, or dissatisfaction with features that are functioning as described on the platform.",
        },
        {
          title: "4. Cancellation",
          body: "You may cancel your premium subscription at any time from your dashboard. Upon cancellation, you will continue to have access to premium features until the end of your current billing period. No partial refunds are provided for unused portions of a billing cycle.",
        },
        {
          title: "5. How to Request a Refund",
          body: "To request a refund, please contact us at hi@vowz.me or call +91 8111852030 with your registered email address, order details, and a description of the issue. We will review your request and respond within 7 business days.",
        },
        {
          title: "6. Refund Processing",
          body: "Approved refunds will be processed to the original payment method within 7–14 business days. The exact timeline may vary depending on your bank or payment provider.",
        },
        {
          title: "7. Contact",
          body: "For any questions regarding this policy, please contact AXPIR TECH at hi@vowz.me or call +91 8111852030. Address: 1st Floor, CC 54, 2593-5, Door No G-307, Bose Nagar Road, Elamkulam, Kochi - 682020.",
        },
      ].map((s) => (
        <div key={s.title} className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">{s.title}</h2>
          <p className="font-body text-muted-foreground leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  </div>
);

export default RefundPolicy;
