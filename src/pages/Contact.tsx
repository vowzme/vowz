import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, MessageSquare, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    // Placeholder — wire up to an edge function or email service later
    await new Promise((r) => setTimeout(r, 1000));
    toast({ title: "Message sent! 💌", description: "We'll get back to you within 24 hours." });
    setForm({ name: "", email: "", message: "" });
    setSending(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Contact Vowz – Get Help With Your Wedding Website"
        description="Need help with your wedding invitation or website? Contact the Vowz support team. We typically respond within 24 hours."
        ogTitle="Contact Vowz – Wedding Website Support"
        ogDescription="Get help with your wedding website. Contact our support team — we respond within 24 hours."
        ogImage="https://vowz.me/og-contact.jpg"
        ogUrl="https://vowz.me/contact"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Contact Vowz – Wedding Website Support"
        twitterDescription="Get help with your wedding invitation or website. Fast support within 24 hours."
        twitterImage="https://vowz.me/og-contact.jpg"
        canonical="https://vowz.me/contact"
        robots="index, follow"
      />
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">
        <motion.div
          className="text-center mb-14"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <p className="text-accent font-semibold font-body tracking-wider uppercase text-sm mb-3">Get In Touch</p>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4">
            We'd Love to <span className="text-gradient-gold italic">Hear From You</span>
          </h1>
          <p className="text-muted-foreground font-body max-w-xl mx-auto">
            Have a question, feedback, or need help with your wedding site? Drop us a message.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-5 gap-10">
          {/* Info cards */}
          <div className="md:col-span-2 space-y-6">
            {[
              { icon: Mail, label: "Email", value: "hello@vowz.me" },
              { icon: MessageSquare, label: "Response Time", value: "Within 24 hours" },
              { icon: MapPin, label: "Based In", value: "India 🇮🇳" },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-4 p-5 rounded-xl bg-card border border-border/50 shadow-card">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                  <item.icon className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <p className="font-body text-sm text-muted-foreground">{item.label}</p>
                  <p className="font-body font-medium text-foreground">{item.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Contact form */}
          <motion.form
            onSubmit={handleSubmit}
            className="md:col-span-3 bg-card rounded-2xl p-8 border border-border/50 shadow-card space-y-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div>
              <label className="font-body text-sm font-medium mb-1 block">Your Name</label>
              <Input
                placeholder="Enter your name"
                className="h-12 font-body"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-body text-sm font-medium mb-1 block">Email Address</label>
              <Input
                type="email"
                placeholder="you@example.com"
                className="h-12 font-body"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <label className="font-body text-sm font-medium mb-1 block">Message</label>
              <Textarea
                placeholder="How can we help?"
                className="min-h-[140px] font-body"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                required
              />
            </div>
            <Button type="submit" variant="gold" size="lg" className="w-full" disabled={sending}>
              {sending ? "Sending..." : "Send Message"}
              <Send className="w-4 h-4 ml-2" />
            </Button>
          </motion.form>
        </div>
      </div>
    </div>
  );
};

export default Contact;