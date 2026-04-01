import { useCallback } from "react";
import { useGoogleDrive } from "@/hooks/use-google-drive";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const MAX_DIMENSION = 2048;
const QUALITY = 0.82;

/**
 * Compress an image file using canvas.
 * Returns the original file unchanged for non-image or very small files.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  // Skip if already small (< 200KB)
  if (file.size < 200 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;

      // Scale down if exceeds max dimension
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert PNGs without transparency to JPEG for better compression
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file); // Keep original if compression didn't help
            return;
          }
          const ext = outputType === "image/jpeg" ? ".jpg" : ".png";
          const name = file.name.replace(/\.[^.]+$/, ext);
          resolve(new File([blob], name, { type: outputType, lastModified: Date.now() }));
        },
        outputType,
        QUALITY
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

/**
 * Unified media upload hook.
 * Compresses images, then uploads to Google Drive if linked, otherwise Supabase storage.
 */
export function useMediaUpload() {
  const { user } = useAuth();
  const { linked, uploadFile } = useGoogleDrive();

  const upload = useCallback(
    async (file: File, prefix: string = "media"): Promise<string | null> => {
      if (!user) return null;

      // Compress before upload
      const compressed = await compressImage(file);
      const ext = compressed.name.split(".").pop() || "jpg";
      const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      // Google Drive is mandatory — no platform storage fallback
      if (!linked) {
        throw new Error("Google Drive is not linked. Please connect your Google Drive from the dashboard to upload media.");
      }

      const result = await uploadFile(compressed, fileName);
      if (result?.url) return result.url;
      throw new Error("Upload to Google Drive failed. Please check your Drive connection and try again.");
    },
    [user, linked, uploadFile]
  );

  return { upload, isDriveLinked: linked };
}
