import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Network } from "lucide-react";
import AdminAffiliatesTab from "@/components/admin/AdminAffiliatesTab";
import AdminFranchiseTab from "@/components/admin/AdminFranchiseTab";

export default function AdminPartners() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-foreground">Partners Management</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">
          Manage all affiliate and franchise partners, view activity, earnings, and payouts
        </p>
      </div>

      <Tabs defaultValue="affiliates" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="affiliates" className="font-body text-sm">
            <Users className="w-4 h-4 mr-1.5" /> Affiliates
          </TabsTrigger>
          <TabsTrigger value="franchise" className="font-body text-sm">
            <Network className="w-4 h-4 mr-1.5" /> Franchise
          </TabsTrigger>
        </TabsList>

        <TabsContent value="affiliates" className="mt-6">
          <AdminAffiliatesTab />
        </TabsContent>
        <TabsContent value="franchise" className="mt-6">
          <AdminFranchiseTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
