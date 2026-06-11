import { useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload`;

export function useR2Upload() {
  const { session } = useAuth();

  const uploadToR2 = useCallback(
    async (file: File, fileName?: string): Promise<{ url: string; key: string; deduplicated?: boolean } | null> => {
      if (!session?.access_token) throw new Error("Not authenticated");

      const formData = new FormData();
      formData.append("file", file);
      if (fileName) formData.append("fileName", fileName);

      const res = await fetch(`${FUNCTION_URL}?action=upload`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "R2 upload failed");
      return { url: data.url, key: data.key, deduplicated: !!data.deduplicated };
    },
    [session]
  );

  const deleteFromR2 = useCallback(
    async (key: string): Promise<boolean> => {
      if (!session?.access_token) return false;
      const res = await fetch(`${FUNCTION_URL}?action=delete`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key }),
      });
      const data = await res.json();
      return !!data.success;
    },
    [session]
  );

  return { uploadToR2, deleteFromR2 };
}
