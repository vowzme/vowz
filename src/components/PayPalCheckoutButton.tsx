import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

declare global {
  interface Window {
    paypal?: any;
  }
}

interface Props {
  productType: "premium" | "storage_addon" | "luxe_cards";
  currency: "USD" | "EUR" | "GBP";
  onSuccess?: () => void;
  disabled?: boolean;
}

let sdkPromise: Promise<boolean> | null = null;
let sdkCurrency: string | null = null;
let sdkClientId: string | null = null;

const loadPaypalSdk = (clientId: string, currency: string) => {
  if (sdkPromise && sdkCurrency === currency && sdkClientId === clientId) return sdkPromise;
  // Reset if currency/client changed
  const existing = document.getElementById("paypal-sdk-script");
  if (existing) existing.remove();
  if (window.paypal) delete (window as any).paypal;
  sdkCurrency = currency;
  sdkClientId = clientId;
  sdkPromise = new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.id = "paypal-sdk-script";
    s.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=${currency}&intent=capture&components=buttons`;
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
  return sdkPromise;
};

const PayPalCheckoutButton = ({ productType, currency, onSuccess, disabled }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const renderButtons = () => {
    if (!containerRef.current || !window.paypal) return;
    containerRef.current.innerHTML = "";
    try {
      window.paypal
        .Buttons({
          style: { layout: "vertical", color: "gold", shape: "rect", label: "paypal", height: 44 },
          createOrder: async () => {
            setProcessing(true);
            const { data, error } = await supabase.functions.invoke("paypal-payment", {
              body: { action: "create_order", product_type: productType, currency },
            });
            if (error || !data?.success) {
              setProcessing(false);
              throw new Error(error?.message || data?.error || "Could not create order.");
            }
            if (data.already_premium || data.already_owned) {
              toast({
                title: productType === "luxe_cards" ? "LUXE already unlocked" : "Premium already active",
                description: productType === "luxe_cards" ? "Your LUXE designs are ready." : "Your account is already upgraded.",
              });
              onSuccess?.();
              setProcessing(false);
              throw new Error("already_premium");
            }
            return data.order_id;
          },
          onApprove: async (approve: any) => {
            try {
              const { data, error } = await supabase.functions.invoke("paypal-payment", {
                body: { action: "capture_order", order_id: approve.orderID, product_type: productType },
              });
              if (error || !data?.success) {
                throw new Error(error?.message || data?.error || "Payment capture failed.");
              }
              toast({
                title: "Payment successful 🎉",
                description: productType === "storage_addon"
                  ? "+2 GB storage add-on is active."
                  : productType === "luxe_cards"
                  ? "LUXE invitation cards are unlocked."
                  : "Premium activated.",
              });
              onSuccess?.();
            } catch (e: any) {
              toast({ title: "Capture failed", description: e?.message, variant: "destructive" });
            } finally {
              setProcessing(false);
            }
          },
          onCancel: () => setProcessing(false),
          onError: (err: any) => {
            setProcessing(false);
            const msg = err?.message || "PayPal error";
            if (msg !== "already_premium") {
              toast({ title: "PayPal error", description: msg, variant: "destructive" });
            }
          },
        })
        .render(containerRef.current);
    } catch (e: any) {
      setError(e?.message || "Failed to render PayPal buttons.");
    }
  };

  // Preflight: fetch client_id (returned by create_order) then load SDK. The order returned
  // here is discarded — PayPal Buttons will createOrder again on user click.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const { data } = await supabase.functions.invoke("paypal-payment", {
          body: { action: "create_order", product_type: productType, currency },
        });
        if (data?.already_premium || data?.already_owned) {
          toast({
            title: productType === "luxe_cards" ? "LUXE already unlocked" : "Premium already active",
            description: productType === "luxe_cards" ? "Your LUXE designs are ready." : "Your account is already upgraded.",
          });
          onSuccess?.();
          if (!cancelled) setLoading(false);
          return;
        }
        const clientId = data?.client_id;
        if (!clientId) throw new Error("PayPal is not configured.");
        const ok = await loadPaypalSdk(clientId, currency);
        if (cancelled) return;
        if (!ok || !window.paypal) throw new Error("Unable to load PayPal SDK.");
        renderButtons();
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Failed to initialize PayPal.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currency, productType]);

  if (error) {
    return <p className="text-xs text-destructive text-center">{error}</p>;
  }

  return (
    <div className={disabled ? "opacity-50 pointer-events-none" : ""}>
      {loading && (
        <div className="flex items-center justify-center py-3 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading PayPal…
        </div>
      )}
      <div ref={containerRef} />
      {processing && (
        <p className="text-xs text-muted-foreground text-center mt-2">Processing payment…</p>
      )}
    </div>
  );
};

export default PayPalCheckoutButton;