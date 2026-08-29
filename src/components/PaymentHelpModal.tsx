import { useState } from "react";
import { HelpCircle, Wallet, Globe, RefreshCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PaymentHelpModal = () => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground underline"
        >
          <HelpCircle className="w-3 h-3" />
          Which option should I pick?
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-primary" />
            Payment options explained
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm pt-2">
          <section className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Wallet className="w-4 h-4 text-emerald-600" />
              <span>🇮🇳 Paying from India — use Razorpay</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              Razorpay is built for Indian payments. It works smoothly with UPI
              (Google Pay, PhonePe, Paytm), NetBanking, debit/credit cards, and
              wallets. We recommend it for India because it has lower fees and
              faster refunds if something goes wrong.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <Globe className="w-4 h-4 text-primary" />
              <span>🌍 Paying from outside India — use PayPal or Dodo</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              If your card or bank account is outside India, choose PayPal or
              Dodo. PayPal is great if you already have an account and want buyer
              protection. Dodo lets you pay directly with most international
              credit or debit cards without creating a new account.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <RefreshCw className="w-4 h-4 text-primary" />
              <span>What happens after I click?</span>
            </div>
            <p className="text-muted-foreground leading-relaxed">
              You will be taken to the payment provider's secure checkout in a
              popup or new tab. After you complete the payment, you will be
              returned to Vowz and your upgrade will be activated automatically.
            </p>
          </section>

          <section className="space-y-2">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Payment failed or the page didn't open?</span>
            </div>
            <ul className="text-muted-foreground leading-relaxed list-disc pl-4 space-y-1">
              <li>Check that your browser isn't blocking popups.</li>
              <li>Try a different card, wallet, or payment method.</li>
              <li>If Razorpay fails, try PayPal/Dodo, or vice versa.</li>
              <li>
                If you were charged but not upgraded, contact support with your
                payment ID or screenshot and we will fix it quickly.
              </li>
            </ul>
          </section>

          <div className="pt-2">
            <Button className="w-full" onClick={() => setOpen(false)}>
              Got it
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentHelpModal;
