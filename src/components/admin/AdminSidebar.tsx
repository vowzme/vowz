import {
  LayoutDashboard,
  Users,
  Globe,
  CreditCard,
  Settings,
  ArrowLeft,
  FileText,
  Ticket,
  Lightbulb,
  BarChart3,
  Network,
  Mail,
  HardDrive,
  Palette,
  Heart,
  TrendingUp,
  Crown,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Visitors & Funnel", url: "/admin/visitors", icon: TrendingUp },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Sites", url: "/admin/sites", icon: Globe },
  { title: "RSVPs", url: "/admin/rsvps", icon: Heart },
  { title: "Payments", url: "/admin/payments", icon: CreditCard },
  { title: "Coupons", url: "/admin/coupons", icon: Ticket },
  { title: "Feature Requests", url: "/admin/feature-requests", icon: Lightbulb },
  { title: "Partners", url: "/admin/partners", icon: Network },
  { title: "Card Templates", url: "/admin/card-templates", icon: Mail },
  { title: "Card Analytics", url: "/admin/card-analytics", icon: BarChart3 },
  { title: "LUXE Couples", url: "/admin/luxe", icon: Crown },
  { title: "Blog", url: "/admin/blog", icon: FileText },
  { title: "Storage Cleanup", url: "/admin/storage-cleanup", icon: HardDrive },
  { title: "Emails", url: "/admin/emails", icon: Mail },
  { title: "Email A/B Tests", url: "/admin/email-ab", icon: BarChart3 },
  { title: "Reminder Runs", url: "/admin/reminder-runs", icon: BarChart3 },
  { title: "Email Branding", url: "/admin/email-branding", icon: Palette },
  { title: "Guest Moderation", url: "/admin/guest-moderation", icon: BarChart3 },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) =>
    path === "/admin" ? currentPath === "/admin" : currentPath.startsWith(path);

  return (
    <Sidebar collapsible="icon" className="border-r border-border/50">
      <SidebarContent className="bg-card">
        <SidebarGroup>
          <SidebarGroupLabel className="font-display text-xs tracking-wider uppercase text-muted-foreground">
            {!collapsed && "Admin Panel"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/admin"}
                      className="hover:bg-muted/50 transition-colors"
                      activeClassName="bg-[hsl(var(--gold))/0.1] text-[hsl(var(--gold-dark))] font-semibold"
                    >
                      <item.icon className="mr-2 h-4 w-4" />
                      {!collapsed && <span className="font-body text-sm">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" className="hover:bg-muted/50 text-muted-foreground mt-4">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    {!collapsed && <span className="font-body text-sm">Back to Site</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
