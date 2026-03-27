import { useCallback } from "react";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

/**
 * Unified media upload hook.
 * Uploads to user's Google Drive if linked, otherwise falls back to Supabase storage.
 */
export function useMediaUpload() {
  const { user } = useAuth();
  const { linked, uploadFile } = useGoogleDrive();

  const upload = useCallback(
    async (file: File, prefix: string = "media"): Promise<string | null> => {
      if (!user) return null;
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Try Google Drive first
      if (linked) {
        const result = await uploadFile(file, fileName);
        if (result?.url) return result.url;
        // If Drive upload fails, fall through to Supabase
        console.warn("Google Drive upload failed, falling back to platform storage");
      }

      // Fallback: Supabase storage
      const path = `${user.id}/${fileName}`;
      const bucket = prefix === "logo" ? "wedding-logos" : "wedding-photos";
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
      return urlData.publicUrl;
    },
    [user, linked, uploadFile]
  );

  return { upload, isDriveLinked: linked };
}
