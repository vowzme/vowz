import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

type Status = "loading" | "valid" | "already" | "invalid" | "success" | "error";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export default function Unsubscribe() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("loading");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/functions/v1/handle-email-unsubscribe?token=${encodeURIComponent(token)}`,
          { headers: { apikey: SUPABASE_KEY } },
        );
        const body = await res.json();
        if (!res.ok) {
          setStatus("invalid");
          return;
        }
        if (body?.reason === "already_unsubscribed") setStatus("already");
        else if (body?.valid) setStatus("valid");
        else setStatus("invalid");
      } catch {
        setStatus("error");
      }
    })();
  }, [token]);

  const confirm = async () => {
    if (!token) return;
    setSubmitting(true);
    const { data, error } = await supabase.functions.invoke("handle-email-unsubscribe", {
      body: { token },
    });
    setSubmitting(false);
    if (error) setStatus("error");
    else if ((data as any)?.reason === "already_unsubscribed") setStatus("already");
    else if ((data as any)?.success) setStatus("success");
    else setStatus("error");
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-background px-6 py-16">
      <div className="max-w-md w-full text-center bg-card border border-border rounded-2xl p-8 shadow-sm">
        <h1 className="font-serif text-2xl text-navy mb-4">Unsubscribe from VowZ emails</h1>

        {status === "loading" && <p className="text-muted-foreground">Verifying your link…</p>}

        {status === "valid" && (
          <>
            <p className="text-muted-foreground mb-6">
              Click below to confirm you'd like to stop receiving emails from VowZ.
            </p>
            <Button onClick={confirm} disabled={submitting} className="w-full">
              {submitting ? "Unsubscribing…" : "Confirm unsubscribe"}
            </Button>
          </>
        )}

        {status === "success" && (
          <p className="text-muted-foreground">
            You've been unsubscribed. You won't receive further emails from VowZ.
          </p>
        )}

        {status === "already" && (
          <p className="text-muted-foreground">This email is already unsubscribed.</p>
        )}

        {status === "invalid" && (
          <p className="text-muted-foreground">This unsubscribe link is invalid or expired.</p>
        )}

        {status === "error" && (
          <p className="text-destructive">Something went wrong. Please try again later.</p>
        )}
      </div>
    </main>
  );
}