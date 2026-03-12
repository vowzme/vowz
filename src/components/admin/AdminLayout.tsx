import { Navigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AdminSidebar } from "./AdminSidebar";
import { useAdmin } from "@/hooks/use-admin";
import VowzLogo from "@/components/VowzLogo";
import SEOHead from "@/components/SEOHead";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, loading } = useAdmin();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <SidebarProvider>
      <SEOHead title="Admin – Vowz" description="Admin panel for managing Vowz." robots="noindex, nofollow" />
      <div className="min-h-screen flex w-full bg-background">
        <AdminSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center border-b border-border/50 bg-card px-4 gap-3">
            <SidebarTrigger />
            <VowzLogo iconSize="h-5" textSize="text-base" />
            <span className="text-xs font-body text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-1">
              Admin
            </span>
          </header>
          <main className="flex-1 p-4 sm:p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
