import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-drive`;

interface GoogleDriveState {
  linked: boolean;
  email: string | null;
  loading: boolean;
}

export function useGoogleDrive() {
  const { user, session } = useAuth();
  const [state, setState] = useState<GoogleDriveState>({ linked: false, email: null, loading: true });

  const getHeaders = useCallback(() => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${session?.access_token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  }), [session]);

  // Check link status
  const checkStatus = useCallback(async () => {
    if (!session) { setState({ linked: false, email: null, loading: false }); return; }
    try {
      const res = await fetch(`${FUNCTION_URL}?action=status`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({}),
      });
      const data = await res.json();
      setState({ linked: data.linked || false, email: data.email || null, loading: false });
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, [session, getHeaders]);

  useEffect(() => { checkStatus(); }, [checkStatus]);

  // Start OAuth flow
  const startLinking = useCallback(async () => {
    const redirectUri = `${window.location.origin}/dashboard?gdrive=callback`;
    const res = await fetch(`${FUNCTION_URL}?action=auth-url`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      body: JSON.stringify({ redirectUri }),
    });
    const { authUrl } = await res.json();
    window.location.href = authUrl;
  }, []);

  // Handle OAuth callback
  const handleCallback = useCallback(async (code: string) => {
    const redirectUri = `${window.location.origin}/dashboard?gdrive=callback`;
    const res = await fetch(`${FUNCTION_URL}?action=callback`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ code, redirectUri }),
    });
    const data = await res.json();
    if (data.success) {
      setState({ linked: true, email: data.email, loading: false });
    }
    return data;
  }, [getHeaders]);

  // Upload file to Drive
  const uploadFile = useCallback(async (file: File, fileName?: string): Promise<{ url: string; fileId: string } | null> => {
    const formData = new FormData();
    formData.append("file", file);
    if (fileName) formData.append("fileName", fileName);

    const res = await fetch(`${FUNCTION_URL}?action=upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session?.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      },
      body: formData,
    });
    const data = await res.json();
    if (data.success) return { url: data.url, fileId: data.fileId };
    return null;
  }, [session]);

  // Unlink
  const unlinkDrive = useCallback(async () => {
    await fetch(`${FUNCTION_URL}?action=unlink`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    setState({ linked: false, email: null, loading: false });
  }, [getHeaders]);

  // List files
  const listFiles = useCallback(async () => {
    const res = await fetch(`${FUNCTION_URL}?action=list`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({}),
    });
    const data = await res.json();
    return data.files || [];
  }, [getHeaders]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string) => {
    const res = await fetch(`${FUNCTION_URL}?action=delete`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ fileId }),
    });
    return res.json();
  }, [getHeaders]);

  return { ...state, startLinking, handleCallback, uploadFile, unlinkDrive, checkStatus, listFiles, deleteFile };
}
