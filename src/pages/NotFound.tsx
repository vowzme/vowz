import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import Navbar from "@/components/Navbar";
import SEOHead from "@/components/SEOHead";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Page Not Found – Vowz"
        description="The page you're looking for doesn't exist. Explore our wedding website templates and start creating your free invitation."
        ogTitle="Page Not Found – Vowz"
        ogDescription="Sorry, we couldn't find that page. Browse our wedding website templates instead."
        ogImage="https://vowz.me/og-home.jpg"
        robots="noindex, follow"
      />
      <Navbar />
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)] px-4">
        <motion.div
          className="text-center max-w-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          >
            <Heart className="w-12 h-12 text-gold mx-auto mb-6" fill="currentColor" />
          </motion.div>

          <h1 className="font-display text-7xl md:text-9xl font-bold text-gradient-gold mb-2">404</h1>

          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-4">
            This Page Wandered Off
          </h2>

          <p className="font-body text-muted-foreground mb-10 leading-relaxed">
            Looks like this page didn't make it to the ceremony.
            <br className="hidden sm:block" />
            Let's get you back to where the celebration is.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="gold" size="xl" asChild>
              <Link to="/">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Home
              </Link>
            </Button>
            <Button variant="outline" size="xl" asChild>
              <Link to="/templates">View Templates</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;