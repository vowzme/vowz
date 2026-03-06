import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

export interface GalleryPhoto {
  id: string;
  url: string;
  name: string;
}

export function useGalleryPhotos() {
  const { user } = useAuth();
  const [uploading, setUploading] = useState(false);

  const getPublicUrl = (path: string) => {
    const { data } = supabase.storage.from("wedding-photos").getPublicUrl(path);
    return data.publicUrl;
  };

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

          const ext = file.name.split(".").pop() || "jpg";
          const fileName = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

          const { error } = await supabase.storage
            .from("wedding-photos")
            .upload(fileName, file, { upsert: false });

          if (error) {
            console.error("Upload error:", error);
            toast({ title: `Failed to upload ${file.name}`, variant: "destructive" });
            continue;
          }

          uploaded.push({
            id: fileName,
            url: getPublicUrl(fileName),
            name: file.name,
          });
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
    [user]
  );

  const deletePhoto = useCallback(
    async (path: string) => {
      const { error } = await supabase.storage.from("wedding-photos").remove([path]);
      if (error) {
        toast({ title: "Failed to delete photo", variant: "destructive" });
        return false;
      }
      return true;
    },
    []
  );

  return { uploadPhotos, deletePhoto, uploading };
}
