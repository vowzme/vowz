import { useCallback } from "react";
import { useR2Upload } from "@/hooks/use-r2-upload";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const MAX_DIMENSION = 2048;
const QUALITY = 0.82;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB pre-compression sanity cap

async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  if (file.size < 200 * 1024) return file;

  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      let { width, height } = img;
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
      const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob || blob.size >= file.size) {
            resolve(file);
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
 * Unified media upload hook backed by Cloudflare R2.
 * Automatically compresses client-side; server enforces quota and may further reduce.
 */
export function useMediaUpload() {
  const { user } = useAuth();
  const { uploadToR2 } = useR2Upload();

  const upload = useCallback(
    async (file: File, prefix: string = "media"): Promise<string | null> => {
      if (!user) return null;

      // Direct video upload is disabled platform-wide — videos must be embedded via URL
      // (YouTube, Vimeo, Instagram, TikTok, Facebook, etc.) for zero buffering & zero quota cost.
      if (file.type.startsWith("video/")) {
        const msg = "Videos can't be uploaded directly. Upload your video to YouTube, Vimeo, Instagram or another platform, then paste the link in the Video section of your editor.";
        toast({ title: "Use a video link instead", description: msg, variant: "destructive" });
        throw new Error(msg);
      }
      if (file.type.startsWith("image/") && file.size > MAX_IMAGE_BYTES) {
        const msg = `Images must be under 25 MB. This file is ${(file.size / 1048576).toFixed(1)} MB.`;
        toast({ title: "Image too large", description: msg, variant: "destructive" });
        throw new Error(msg);
      }

      const compressed = await compressImage(file);
      const ext = compressed.name.split(".").pop() || "jpg";
      const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      try {
        const result = await uploadToR2(compressed, fileName);
        if (result?.url) return result.url;
        throw new Error("Upload failed. Please try again.");
      } catch (err: any) {
        const msg = err?.message || "";
        if (msg.includes("Storage limit") || msg.includes("QUOTA")) {
          toast({
            title: "Storage limit reached",
            description: msg,
            variant: "destructive",
          });
        }
        throw err;
      }
    },
    [user, uploadToR2]
  );

  return { upload, storageBackend: "r2" as const };
}
