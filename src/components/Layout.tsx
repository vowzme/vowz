import Footer from "@/components/Footer";
import BackToTop from "@/components/BackToTop";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    {children}
    <Footer />
    <BackToTop />
  </>
);

export default Layout;
