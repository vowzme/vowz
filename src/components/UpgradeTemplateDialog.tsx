import { Crown, Lock, Sparkles } from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import PremiumUpgradeButton from "@/components/PremiumUpgradeButton";

interface UpgradeTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  templateName?: string;
  /** Called after the user successfully upgrades — used to resume the template flow. */
  onUpgraded?: () => void;
}

export default function UpgradeTemplateDialog({
  open, onOpenChange, templateName, onUpgraded,
}: UpgradeTemplateDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="mx-auto mb-2 w-12 h-12 rounded-full bg-gold/15 text-gold grid place-items-center">
            <Lock className="w-6 h-6" />
          </div>
          <DialogTitle className="font-display text-center text-xl">
            Premium template locked
          </DialogTitle>
          <DialogDescription className="text-center">
            {templateName ? <><strong>{templateName}</strong> is part of our premium gallery. </> : null}
            Upgrade to unlock all premium designs, exports, and printable PDFs.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-2 text-sm font-body py-2">
          {[
            "900+ premium, fully editable designs",
            "One-click PDF export with crop marks",
            "Mobile, print and digital share modes",
            "Unlimited template switches",
          ].map((line) => (
            <li key={line} className="flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-gold shrink-0 mt-0.5" />
              <span className="text-muted-foreground">{line}</span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-2">
          <PremiumUpgradeButton
            className="w-full"
            label="Upgrade & continue"
            onUpgraded={() => {
              onOpenChange(false);
              onUpgraded?.();
            }}
          />
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Keep browsing
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Shared key so the editor/gallery can resume the chosen template after upgrade.
 * Stored in localStorage so it survives page refreshes and tab restarts.
 */
export const PENDING_PREMIUM_TEMPLATE_KEY = "vowz.pendingPremiumTemplate";

export const readPendingPremiumTemplate = (): string | null => {
  try { return localStorage.getItem(PENDING_PREMIUM_TEMPLATE_KEY); } catch { return null; }
};
export const writePendingPremiumTemplate = (slug: string) => {
  try { localStorage.setItem(PENDING_PREMIUM_TEMPLATE_KEY, slug); } catch {}
};
export const clearPendingPremiumTemplate = () => {
  try { localStorage.removeItem(PENDING_PREMIUM_TEMPLATE_KEY); } catch {}
};