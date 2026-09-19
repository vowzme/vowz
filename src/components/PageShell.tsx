import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

/**
 * Standard public page frame: top menu bar (same as the home page),
 * content offset for the fixed navbar, footer and back-to-top control.
 */
const PageShell = ({ children }: { children: React.ReactNode }) => (
  <>
    <Navbar />
    <div className="pt-16">{children}</div>
    <Footer />
    <BackToTop />
  </>
);

export default PageShell;
