import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";

const PrivacyPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead
      title="Privacy Policy – Vowz Wedding Website Builder"
      description="Read the Vowz Privacy Policy by AXPIR TECH. Learn how we collect, use, and protect your personal information."
      ogTitle="Privacy Policy – Vowz"
      ogDescription="How Vowz collects, uses, and protects your personal data."
      ogImage="https://vowz.me/og-home.jpg"
      ogUrl="https://vowz.me/privacy"
      ogType="website"
      twitterCard="summary"
      canonical="https://vowz.me/privacy"
      robots="index, follow"
    />
    <Navbar />
    <div className="max-w-3xl mx-auto px-4 pt-28 pb-16">
      <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">Privacy Policy</h1>
      <p className="text-muted-foreground font-body text-sm mb-10">Last updated: July 9, 2026</p>

      {[
        { title: "1. About Us", body: "VowZ (vowz.me) is a product of AXPIR Tech India LLP, owned by Anooj Xavier, registered at 1st Floor, CC 54,2593-5, Door No G-307, Bose Nagar Road, Elamkulam, Kochi, Ernakulam, Kerala - 682020, India." },
        { title: "2. Information We Collect", body: "We collect information you provide directly — such as your name, email address, phone number, wedding details, and photos — when you create an account or build your wedding website. We also collect usage data such as page views, device type, and browser information to improve our service." },
        { title: "3. How We Use Your Information", body: "Your information is used to create and host your wedding website, manage RSVPs, send notifications, and provide customer support. We do not sell your personal data to third parties." },
        { title: "4. Data Storage & Security", body: "Your data is stored securely using industry-standard encryption. Wedding photos and site content are hosted on secure cloud infrastructure. You can delete your account and all associated data at any time from your dashboard." },
        { title: "5. Cookies", body: "We use essential cookies for authentication and session management. Analytics cookies help us understand how our service is used. You can disable non-essential cookies in your browser settings." },
        { title: "6. Third-Party Services", body: "We may use third-party services for payment processing, email delivery, and analytics. These services have their own privacy policies and handle your data according to their terms." },
        { title: "7. Your Rights", body: "You have the right to access, update, or delete your personal information at any time. You can export your wedding site data or request complete account deletion by contacting us." },
        { title: "8. Contact", body: "For privacy-related questions, please reach out to us at hi@vowz.me or WhatsApp us at +91 79944 10111. AXPIR Tech India LLP, 1st Floor, CC 54,2593-5, Door No G-307, Bose Nagar Road, Elamkulam, Kochi, Ernakulam, Kerala - 682020." },
      ].map((s) => (
        <div key={s.title} className="mb-8">
          <h2 className="font-display text-xl font-semibold text-foreground mb-2">{s.title}</h2>
          <p className="font-body text-muted-foreground leading-relaxed">{s.body}</p>
        </div>
      ))}
    </div>
  </div>
);

export default PrivacyPolicy;
