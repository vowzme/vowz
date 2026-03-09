import Footer from "@/components/Footer";

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    {children}
    <Footer />
  </>
);

export default Layout;
