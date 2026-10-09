import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

/** Printed affiliate QR codes point here: /q/:code → home with the owner's referral code. */
export default function QrRedirect() {
  const { code = "" } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;
    (async () => {
      const { data } = await supabase.rpc("resolve_affiliate_qr", { _code: code });
      if (done) return;
      if (data) {
        localStorage.setItem("shaadi_affiliate_ref", String(data).trim().toLowerCase());
        navigate(`/?ref=${encodeURIComponent(String(data))}`, { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    })();
    return () => { done = true; };
  }, [code, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-primary" aria-label="Opening Vowz" />
    </div>
  );
}
