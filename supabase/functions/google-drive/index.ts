import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID")!;
const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function getSupabaseAdmin() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
}

async function getAuthenticatedUser(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const supabase = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims) return null;
  return data.claims.sub as string;
}

// Exchange auth code for tokens
async function exchangeCode(code: string, redirectUri: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });
  return res.json();
}

// Refresh access token
async function refreshAccessToken(refreshToken: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      grant_type: "refresh_token",
    }),
  });
  return res.json();
}

// Create "Vowz Wedding Media" folder in Drive
async function createVowzFolder(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/drive/v3/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: "Vowz Wedding Media",
      mimeType: "application/vnd.google-apps.folder",
    }),
  });
  const data = await res.json();
  return data.id;
}

// Get valid access token, refreshing if needed
async function getValidToken(userId: string) {
  const admin = getSupabaseAdmin();
  const { data: driveData } = await admin
    .from("user_google_drive")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (!driveData) return null;

  const now = new Date();
  const expiresAt = new Date(driveData.token_expires_at);

  if (expiresAt > now) {
    return { accessToken: driveData.access_token, folderId: driveData.drive_folder_id };
  }

  // Refresh
  const tokens = await refreshAccessToken(driveData.refresh_token);
  if (tokens.error) return null;

  const newExpiry = new Date(Date.now() + tokens.expires_in * 1000).toISOString();
  await admin
    .from("user_google_drive")
    .update({ access_token: tokens.access_token, token_expires_at: newExpiry })
    .eq("user_id", userId);

  return { accessToken: tokens.access_token, folderId: driveData.drive_folder_id };
}

// Upload file to Google Drive
async function uploadToDrive(accessToken: string, folderId: string, fileName: string, fileData: Uint8Array, mimeType: string) {
  const metadata = {
    name: fileName,
    parents: [folderId],
  };

  const boundary = "vowz_boundary_" + Date.now();
  const metaJson = JSON.stringify(metadata);

  const body = new Uint8Array(
    await new Blob([
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metaJson}\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
      fileData,
      `\r\n--${boundary}--`,
    ]).arrayBuffer()
  );

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink,webContentLink",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body,
    }
  );
  return res.json();
}

// Make file publicly viewable
async function makePublic(accessToken: string, fileId: string) {
  await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}/permissions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ role: "reader", type: "anyone" }),
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    // Action: get OAuth URL (no auth needed)
    if (action === "auth-url") {
      const { redirectUri } = await req.json();
      const scopes = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`;
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = await getAuthenticatedUser(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    // Action: exchange code and store tokens
    if (action === "callback") {
      const { code, redirectUri } = await req.json();
      const tokens = await exchangeCode(code, redirectUri);

      if (tokens.error) {
        return new Response(JSON.stringify({ error: tokens.error_description || "Token exchange failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Get user email from Google
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      });
      const userInfo = await userInfoRes.json();

      // Create Vowz folder
      const folderId = await createVowzFolder(tokens.access_token);

      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

      // Upsert
      await admin.from("user_google_drive").upsert(
        {
          user_id: userId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          token_expires_at: expiresAt,
          drive_email: userInfo.email,
          drive_folder_id: folderId,
          is_linked: true,
        },
        { onConflict: "user_id" }
      );

      return new Response(JSON.stringify({ success: true, email: userInfo.email }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: check link status
    if (action === "status") {
      const { data } = await admin
        .from("user_google_drive")
        .select("drive_email, is_linked, created_at")
        .eq("user_id", userId)
        .single();

      return new Response(JSON.stringify({ linked: !!data?.is_linked, email: data?.drive_email || null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: upload file
    if (action === "upload") {
      const formData = await req.formData();
      const file = formData.get("file") as File;
      const fileName = formData.get("fileName") as string || file.name;

      const tokenData = await getValidToken(userId);
      if (!tokenData) {
        return new Response(JSON.stringify({ error: "Google Drive not linked" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const fileBytes = new Uint8Array(await file.arrayBuffer());
      const result = await uploadToDrive(tokenData.accessToken, tokenData.folderId!, fileName, fileBytes, file.type);

      if (result.id) {
        await makePublic(tokenData.accessToken, result.id);
        const publicUrl = `https://drive.google.com/uc?id=${result.id}&export=view`;
        return new Response(JSON.stringify({ success: true, fileId: result.id, url: publicUrl }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "Upload failed", details: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: unlink
    if (action === "unlink") {
      await admin.from("user_google_drive").update({ is_linked: false }).eq("user_id", userId);
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
