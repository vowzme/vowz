import { useEffect, useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCaptureAffiliate } from "@/hooks/use-affiliate";
import SEOHead from "@/components/SEOHead";
import VowzLogo from "@/components/VowzLogo";

const Auth = () => {
  useCaptureAffiliate();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn, user } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [pendingVerificationEmail, setPendingVerificationEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const redirectParam = searchParams.get("redirect");
  const redirectTarget = redirectParam && redirectParam.startsWith("/") ? redirectParam : "/dashboard";

  // A wizard draft is auto-saved to localStorage under this key while the user
  // fills out the onboarding flow. If it exists on login, we surface a
  // "Resume your draft" prompt so they can continue where they left off.
  const WIZARD_STORAGE_KEY = "vowz_wizard_draft";
  const hasWizardDraft = () => {
    try {
      const raw =
        (typeof localStorage !== "undefined" && localStorage.getItem(WIZARD_STORAGE_KEY)) ||
        (typeof sessionStorage !== "undefined" && sessionStorage.getItem(WIZARD_STORAGE_KEY));
      if (!raw) return false;
      const parsed = JSON.parse(raw);
      return !!parsed && (parsed.data || parsed.step !== undefined);
    } catch {
      return false;
    }
  };
  const routeAfterAuth = () => {
    const pending = sessionStorage.getItem("pendingTemplate");
    if (pending) return "/wizard";
    if (hasWizardDraft()) {
      toast({
        title: "Welcome back — resume your draft?",
        description: "We saved your wedding wizard progress. Tap to continue where you left off.",
        action: undefined,
      });
      return "/wizard?resume=1";
    }
    return redirectTarget;
  };

  useEffect(() => {
    if (user) {
      navigate(routeAfterAuth(), { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) throw error;
        toast({ title: "Welcome back! 💍" });
        navigate(routeAfterAuth());
      } else {
        if (form.password.length < 6) {
          toast({ title: "Password must be at least 6 characters", variant: "destructive" });
          return;
        }
        const { error, needsVerification } = await signUp(form.email, form.password, form.name);
        if (error) throw error;
        if (needsVerification) {
          setPendingVerificationEmail(form.email);
          toast({
            title: "Check your email 📬",
            description: `We sent a verification link to ${form.email}. Click it to activate your account.`,
          });
          return;
        }
        toast({ title: "Welcome to Vowz! 💍" });
        navigate(routeAfterAuth());
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resendVerification = async () => {
    if (!pendingVerificationEmail) return;
    setResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: pendingVerificationEmail,
      options: { emailRedirectTo: `${window.location.origin}/auth` },
    });
    setResending(false);
    toast({
      title: error ? "Couldn't resend" : "Verification email resent",
      description: error ? error.message : `New link sent to ${pendingVerificationEmail}.`,
      variant: error ? "destructive" : "default",
    });
  };

  return (
    <>
      <SEOHead
        title="Sign In / Sign Up – Vowz Wedding Website Builder"
        description="Create your free account on Vowz and start building your beautiful wedding website. Sign up in seconds — no credit card required."
        ogTitle="Sign In / Sign Up – Vowz"
        ogDescription="Create your free Vowz account and start building your wedding website today. Free forever plan available."
        ogImage="https://vowz.me/og-auth.jpg"
        ogUrl="https://vowz.me/auth"
        ogType="website"
        twitterCard="summary_large_image"
        twitterTitle="Sign In / Sign Up – Vowz"
        twitterDescription="Create your free wedding website account. No credit card required."
        twitterImage="https://vowz.me/og-auth.jpg"
        canonical="https://vowz.me/auth"
        robots="noindex, nofollow"
      />
      <div className="min-h-screen bg-background flex">
        {/* Left decorative panel */}
        <div className="hidden lg:flex lg:w-5/12 bg-gradient-hero relative items-center justify-center overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-primary-foreground/20"
                style={{
                  width: `${200 + i * 120}px`,
                  height: `${200 + i * 120}px`,
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                }}
              />
            ))}
          </div>
          <div className="relative z-10 text-center px-12">
            <VowzLogo iconSize="h-10" textSize="text-2xl" light className="justify-center mb-6" />
            <h2 className="font-display text-4xl font-bold text-primary-foreground mb-4">
              Your Love Story <span className="text-gradient-gold italic">Awaits</span>
            </h2>
            <p className="font-body text-primary-foreground/70 leading-relaxed">
              Create a beautiful wedding website that captures your unique love story — in just minutes.
            </p>
          </div>
        </div>

        {/* Form panel */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="lg:hidden flex mb-8">
              <VowzLogo iconSize="h-7" textSize="text-xl" />
            </div>

            <motion.div key={isLogin ? "login" : "signup"} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
              {pendingVerificationEmail ? (
                <div className="space-y-6">
                  <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-accent" />
                  </div>
                  <div>
                    <h1 className="font-display text-3xl font-bold text-foreground mb-2">
                      Verify your email
                    </h1>
                    <p className="text-muted-foreground font-body">
                      We sent a verification link to{" "}
                      <span className="font-medium text-foreground">
                        {pendingVerificationEmail}
                      </span>
                      . Click it to activate your VowZ account and sign in.
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground font-body space-y-2">
                    <p>Didn't get it? Check your spam folder, or resend below.</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="outline"
                      size="lg"
                      onClick={resendVerification}
                      disabled={resending}
                      className="font-body"
                    >
                      {resending ? "Resending…" : "Resend verification email"}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setPendingVerificationEmail(null);
                        setIsLogin(true);
                      }}
                      className="text-sm text-accent font-medium hover:underline font-body mt-2"
                    >
                      Back to sign in
                    </button>
                  </div>
                </div>
              ) : (
              <>
              <h1 className="font-display text-3xl font-bold text-foreground mb-1">
                {isLogin ? "Welcome back" : "Create your account"}
              </h1>
              <p className="text-muted-foreground font-body mb-8">
                {isLogin ? "Sign in to continue editing your site" : "Start building your wedding website"}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {!isLogin && (
                  <div>
                    <label className="font-body text-sm font-medium mb-1 block">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter your full name"
                        className="pl-10 h-12 font-body"
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="font-body text-sm font-medium mb-1 block">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className="pl-10 h-12 font-body"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="font-body text-sm font-medium mb-1 block">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      className="pl-10 pr-10 h-12 font-body"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {isLogin && (
                  <div className="text-right -mt-2">
                    <Link to="/forgot-password" className="text-xs text-accent hover:underline font-body">
                      Forgot password?
                    </Link>
                  </div>
                )}

                <Button type="submit" variant="gold" size="lg" className="w-full font-body" disabled={loading}>
                  {loading ? "Please wait..." : isLogin ? "Sign In" : "Create Account"}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </form>

              <p className="mt-8 text-center text-sm text-muted-foreground font-body">
                {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="text-accent font-medium hover:underline"
                >
                  {isLogin ? "Sign up" : "Log in"}
                </button>
              </p>
              </>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Auth;
