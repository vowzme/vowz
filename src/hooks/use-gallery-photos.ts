import { useState, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMediaUpload } from "@/hooks/use-media-upload";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface GalleryPhoto {
  id: string;
  url: string;
  name: string;
}

export function useGalleryPhotos() {
  const { user } = useAuth();
  const { upload } = useMediaUpload();
  const [uploading, setUploading] = useState(false);

  const uploadPhotos = useCallback(
    async (files: File[]): Promise<GalleryPhoto[]> => {
      if (!user) return [];
      setUploading(true);
      const uploaded: GalleryPhoto[] = [];

      try {
        for (const file of files) {
          if (!file.type.startsWith("image/")) continue;
          if (file.size > 10 * 1024 * 1024) {
            toast({ title: `${file.name} is too large (max 10MB)`, variant: "destructive" });
            continue;
          }

          try {
            const url = await upload(file, "gallery");
            if (url) {
              uploaded.push({
                id: `gallery-${Date.now()}-${Math.random().toString(36).slice(2)}`,
                url,
                name: file.name,
              });
            }
          } catch (err: any) {
            console.error("Upload error:", err);
            toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
          }
        }

        if (uploaded.length > 0) {
          toast({ title: `${uploaded.length} photo${uploaded.length > 1 ? "s" : ""} uploaded! 📸` });
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        toast({ title: "Upload failed", description: err.message, variant: "destructive" });
      } finally {
        setUploading(false);
      }

      return uploaded;
    },
    [user, upload]
  );

  const deletePhoto = useCallback(
    async (path: string) => {
      // R2 deletion handled by r2-upload edge function; only legacy Supabase Storage paths handled here
      if (path.includes("supabase")) {
        const { error } = await supabase.storage.from("wedding-photos").remove([path]);
        if (error) {
          toast({ title: "Failed to delete photo", variant: "destructive" });
          return false;
        }
      }
      return true;
    },
    []
  );

  return { uploadPhotos, deletePhoto, uploading };
}
