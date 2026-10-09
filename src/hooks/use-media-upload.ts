import { useCallback } from "react";
import { useR2Upload } from "@/hooks/use-r2-upload";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";

const MAX_DIMENSION = 2048;
const QUALITY = 0.86;
const MAX_IMAGE_BYTES = 25 * 1024 * 1024; // 25 MB pre-compression sanity cap

function toBlob(canvas: HTMLCanvasElement, type: string, q: number) {
  return new Promise<Blob | null>((r) => canvas.toBlob(r, type, q));
}

/**
 * Shrinks photos without visible quality loss: caps the long edge at 2048px
 * (sharp on any phone or laptop screen), then saves as WebP (or JPEG where WebP
 * isn't supported) at high quality. Keeps the original if it's already smaller.
 */
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size < 200 * 1024) return file;
  let bitmap: HTMLImageElement;
  try {
    bitmap = await new Promise<HTMLImageElement>((res, rej) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => { URL.revokeObjectURL(url); res(img); };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error("decode")); };
      img.src = url;
    });
  } catch { return file; }
  let { width, height } = bitmap;
  if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height);
    width = Math.round(width * ratio); height = Math.round(height * ratio);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width; canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  let blob = await toBlob(canvas, "image/webp", QUALITY);
  let ext = ".webp";
  if (!blob || blob.type !== "image/webp") { blob = await toBlob(canvas, "image/jpeg", QUALITY); ext = ".jpg"; }
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], file.name.replace(/\.[^.]+$/, "") + ext, { type: blob.type, lastModified: Date.now() });
}

/** Uploads a wedding guest's photo (no sign-in needed) to R2 for a live site. */
export async function uploadGuestPhoto(file: File, siteId: string): Promise<string> {
  if (!file.type.startsWith("image/")) throw new Error("Please choose a photo.");
  if (file.size > MAX_IMAGE_BYTES) throw new Error("Photo must be under 25 MB.");
  const small = await compressImage(file);
  if (small.size > 10 * 1024 * 1024) throw new Error("Photo is too large even after shrinking. Please pick a smaller one.");
  const fd = new FormData();
  fd.append("file", small);
  fd.append("siteId", siteId);
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload?action=guest_upload`, {
    method: "POST", headers: { Authorization: `Bearer ${key}`, apikey: key }, body: fd,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.success) throw new Error(data.error || "Upload failed");
  return data.url as string;
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
