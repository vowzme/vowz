import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Mail, Lock, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { useCaptureAffiliate } from "@/hooks/use-affiliate";

const Auth = () => {
  useCaptureAffiliate();
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await signIn(form.email, form.password);
        if (error) throw error;
        toast({ title: "Welcome back! 💍" });
        const pending = sessionStorage.getItem("pendingTemplate");
        navigate(pending ? "/wizard" : "/dashboard");
      } else {
        if (form.password.length < 6) {
          toast({ title: "Password must be at least 6 characters", variant: "destructive" });
          return;
        }
        const { error } = await signUp(form.email, form.password, form.name);
        if (error) throw error;
        // Check if user is auto-confirmed (session exists immediately)
        const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
        if (session) {
          toast({ title: "Welcome! 💍" });
          const pending = sessionStorage.getItem("pendingTemplate");
          navigate(pending ? "/wizard" : "/dashboard");
        } else {
          toast({
            title: "Check your email! 📧",
            description: "We've sent a confirmation link to verify your account.",
          });
        }
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
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
          <Heart className="w-10 h-10 text-gold mx-auto mb-6" fill="currentColor" />
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
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <Heart className="w-5 h-5 text-gold" fill="currentColor" />
            <span className="font-display text-xl font-bold text-foreground">Bhalf</span>
          </div>

          <motion.div key={isLogin ? "login" : "signup"} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
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
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
