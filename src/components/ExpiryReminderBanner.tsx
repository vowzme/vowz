import { useEffect, useState } from "react";
import { AlertTriangle, Clock, HardDrive, Crown } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";
import BuyStorageAddonButton from "@/components/BuyStorageAddonButton";

/**
 * Shows expiry reminders for the user's active Premium subscription and
 * storage add-ons. Warns starting 30 days before expiry, and shows a
 * post-expiry banner for 14 days. Prompts renewal via the same purchase flow.
 */
const ExpiryReminderBanner = () => {
  const { user } = useAuth();
  const [premiumExpiry, setPremiumExpiry] = useState<Date | null>(null);
  const [addonExpiry, setAddonExpiry] = useState<Date | null>(null);
  const [premiumExpired, setPremiumExpired] = useState(false);
  const [addonExpired, setAddonExpired] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [subRes, addonRes] = await Promise.all([
        (supabase as any)
          .from("user_subscriptions")
          .select("expires_at,status")
          .eq("user_id", user.id)
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
        (supabase as any)
          .from("user_storage_addons")
          .select("expires_at,status")
          .eq("user_id", user.id)
          .eq("status", "active")
          .order("expires_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);

      const now = Date.now();
      const grace = 14 * 24 * 60 * 60 * 1000;

      if (subRes.data?.expires_at) {
        const d = new Date(subRes.data.expires_at);
        setPremiumExpiry(d);
        setPremiumExpired(d.getTime() < now && now - d.getTime() < grace);
      }
      if (addonRes.data?.expires_at) {
        const d = new Date(addonRes.data.expires_at);
        setAddonExpiry(d);
        setAddonExpired(d.getTime() < now && now - d.getTime() < grace);
      }
    })();
  }, [user]);

  const daysUntil = (d: Date | null) => {
    if (!d) return null;
    return Math.ceil((d.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  };

  const premiumDays = daysUntil(premiumExpiry);
  const addonDays = daysUntil(addonExpiry);

  const showPremium =
    premiumExpired || (premiumDays !== null && premiumDays <= 30 && premiumDays > 0);
  const showAddon =
    addonExpired || (addonDays !== null && addonDays <= 30 && addonDays > 0);

  if (!showPremium && !showAddon) return null;

  return (
    <div className="mb-4 space-y-3">
      {showPremium && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
            premiumExpired
              ? "border-destructive/40 bg-destructive/5"
              : premiumDays! <= 7
              ? "border-amber-400/50 bg-amber-50/60 dark:bg-amber-950/20"
              : "border-gold/30 bg-gold/5"
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`rounded-full p-2 shrink-0 ${premiumExpired ? "bg-destructive/15" : "bg-gold/15"}`}>
              {premiumExpired ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <Crown className="w-4 h-4 text-gold" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-foreground">
                {premiumExpired
                  ? "Premium expired — renew to keep your site live"
                  : premiumDays === 1
                  ? "Premium expires tomorrow"
                  : `Premium expires in ${premiumDays} days`}
              </p>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                {premiumExpired
                  ? "Your Premium ended. Purchase again for another 6 months of full access."
                  : `Renew now for another 6 months. Expires ${premiumExpiry?.toLocaleDateString()}.`}
              </p>
            </div>
          </div>
          <PremiumUpgradeButton
            variant="gold"
            size="sm"
            className="shrink-0 w-full sm:w-auto"
            label={premiumExpired ? "Renew Premium" : "Extend 6 Months"}
            showIcon
          />
        </motion.div>
      )}

      {showAddon && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={`rounded-xl border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${
            addonExpired
              ? "border-destructive/40 bg-destructive/5"
              : addonDays! <= 7
              ? "border-amber-400/50 bg-amber-50/60 dark:bg-amber-950/20"
              : "border-border/60 bg-card"
          }`}
          role="alert"
        >
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`rounded-full p-2 shrink-0 ${addonExpired ? "bg-destructive/15" : "bg-muted"}`}>
              {addonExpired ? (
                <AlertTriangle className="w-4 h-4 text-destructive" />
              ) : (
                <HardDrive className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-foreground">
                {addonExpired
                  ? "Storage add-on expired"
                  : addonDays === 1
                  ? "Storage add-on expires tomorrow"
                  : `Storage add-on expires in ${addonDays} days`}
              </p>
              <p className="text-xs font-body text-muted-foreground mt-0.5">
                {addonExpired
                  ? "Add-on storage ended. Purchase +2 GB again to restore capacity."
                  : `Purchase again to extend for another 6 months. Expires ${addonExpiry?.toLocaleDateString()}.`}
              </p>
            </div>
          </div>
          <BuyStorageAddonButton />
        </motion.div>
      )}
    </div>
  );
};

export default ExpiryReminderBanner;