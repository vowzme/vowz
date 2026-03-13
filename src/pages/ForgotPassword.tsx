import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Mail, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SEOHead from "@/components/SEOHead";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "https://vowz.me/reset-password",
    });
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
      toast({ title: "Check your email! 📧", description: "We've sent a password reset link." });
    }
  };

  return (
    <>
      <SEOHead
        title="Reset Password – Vowz"
        description="Reset your Vowz account password. Enter your email and we'll send you a reset link."
        ogTitle="Reset Password – Vowz"
        ogDescription="Reset your Vowz account password. Quick and secure."
        ogImage="https://vowz.me/og-auth.jpg"
        ogUrl="https://vowz.me/forgot-password"
        robots="noindex, nofollow"
        canonical="https://vowz.me/forgot-password"
      />
      <div className="min-h-screen bg-background flex items-center justify-center px-6 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="flex items-center gap-2 mb-8">
          <Heart className="w-5 h-5 text-gold" fill="currentColor" />
          <span className="font-display text-xl font-bold text-foreground">Vowz</span>
        </div>

        <h1 className="font-display text-3xl font-bold text-foreground mb-1">Reset password</h1>
        <p className="text-muted-foreground font-body mb-8">
          {sent ? "Check your inbox for the reset link." : "Enter your email and we'll send a reset link."}
        </p>

        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="font-body text-sm font-medium mb-1 block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  className="pl-10 h-12 font-body"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" variant="gold" size="lg" className="w-full font-body" disabled={loading}>
              {loading ? "Sending..." : "Send Reset Link"}
            </Button>
          </form>
        ) : (
          <p className="font-body text-foreground">
            Didn't receive the email? Check your spam folder or{" "}
            <button onClick={() => setSent(false)} className="text-accent hover:underline">try again</button>.
          </p>
        )}

        <Link to="/auth" className="mt-8 flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground font-body">
          <ArrowLeft className="w-4 h-4" /> Back to login
        </Link>
      </motion.div>
    </div>
    </>
  );
};

export default ForgotPassword;
