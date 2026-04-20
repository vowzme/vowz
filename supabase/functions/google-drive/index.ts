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
const GOOGLE_DRIVE_CALLBACK_URL = `${SUPABASE_URL}/functions/v1/google-drive`;
const textEncoder = new TextEncoder();

type OAuthStatePayload = {
  userId: string;
  origin: string;
  returnTo: string;
  exp: number;
};

function encodeBase64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4 || 4)) % 4);
  const decoded = atob(padded);
  return Uint8Array.from(decoded, (char) => char.charCodeAt(0));
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    textEncoder.encode(SUPABASE_SERVICE_ROLE_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );

  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return encodeBase64Url(new Uint8Array(signature));
}

async function createOAuthState(payload: OAuthStatePayload) {
  const encodedPayload = encodeBase64Url(textEncoder.encode(JSON.stringify(payload)));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

async function verifyOAuthState(rawState: string | null) {
  if (!rawState) return null;

  const [encodedPayload, signature] = rawState.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signValue(encodedPayload);
  if (expectedSignature !== signature) return null;

  const payload = JSON.parse(new TextDecoder().decode(decodeBase64Url(encodedPayload))) as OAuthStatePayload;
  if (!payload.userId || !payload.origin || !payload.returnTo || !payload.exp) return null;
  if (payload.exp < Date.now()) return null;
  return payload;
}

function isValidOrigin(origin: string) {
  try {
    const parsed = new URL(origin);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

function normalizeReturnTo(returnTo?: string) {
  return returnTo && returnTo.startsWith("/") ? returnTo : "/dashboard";
}

function buildOAuthRedirectUri(origin: string) {
  return GOOGLE_DRIVE_CALLBACK_URL;
}

function buildFrontendRedirect(origin: string, returnTo: string, status: "linked" | "error", message?: string) {
  const redirectUrl = new URL(normalizeReturnTo(returnTo), origin);
  redirectUrl.searchParams.set("gdrive", status);
  if (message) {
    redirectUrl.searchParams.set("message", message);
  }
  return redirectUrl.toString();
}

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

async function completeDriveLink(userId: string, code: string, redirectUri: string) {
  const admin = getSupabaseAdmin();
  const tokens = await exchangeCode(code, redirectUri);

  if (tokens.error) {
    throw new Error(tokens.error_description || "Token exchange failed");
  }

  const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  const userInfo = await userInfoRes.json();

  if (!userInfoRes.ok || !userInfo.email) {
    throw new Error("Failed to read Google Drive account details.");
  }

  const { data: existingDrive } = await admin
    .from("user_google_drive")
    .select("refresh_token, drive_folder_id")
    .eq("user_id", userId)
    .maybeSingle();

  const refreshToken = tokens.refresh_token || existingDrive?.refresh_token;
  if (!refreshToken) {
    throw new Error("Google did not return a refresh token. Please try again.");
  }

  const folderId = existingDrive?.drive_folder_id || await createVowzFolder(tokens.access_token);
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

  await admin.from("user_google_drive").upsert(
    {
      user_id: userId,
      access_token: tokens.access_token,
      refresh_token: refreshToken,
      token_expires_at: expiresAt,
      drive_email: userInfo.email,
      drive_folder_id: folderId,
      is_linked: true,
    },
    { onConflict: "user_id" },
  );

  return { success: true, email: userInfo.email };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (req.method === "GET" && (url.searchParams.has("code") || url.searchParams.has("error"))) {
      const state = await verifyOAuthState(url.searchParams.get("state"));
      if (!state) {
        return new Response("Invalid or expired Google Drive state.", { status: 400 });
      }

      if (url.searchParams.get("error")) {
        return Response.redirect(
          buildFrontendRedirect(state.origin, state.returnTo, "error", url.searchParams.get("error_description") || "Google Drive access was denied."),
          302,
        );
      }

      try {
        await completeDriveLink(state.userId, url.searchParams.get("code")!, GOOGLE_DRIVE_CALLBACK_URL);
        return Response.redirect(buildFrontendRedirect(state.origin, state.returnTo, "linked"), 302);
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to link Google Drive.";
        return Response.redirect(buildFrontendRedirect(state.origin, state.returnTo, "error", message), 302);
      }
    }

    const userId = await getAuthenticatedUser(req);
    if (!userId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: get OAuth URL (no auth needed)
    if (action === "auth-url") {
      const { origin, returnTo } = await req.json();
      if (!origin || !isValidOrigin(origin)) {
        return new Response(JSON.stringify({ error: "Invalid origin" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const state = await createOAuthState({
        userId,
        origin,
        returnTo: normalizeReturnTo(returnTo),
        exp: Date.now() + 10 * 60 * 1000,
      });
      const redirectUri = buildOAuthRedirectUri(origin);
      const scopes = "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent&include_granted_scopes=true&state=${encodeURIComponent(state)}`;
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = getSupabaseAdmin();

    // Action: exchange code and store tokens
    if (action === "callback") {
      try {
        const { code, redirectUri, state } = await req.json();
        if (!code || !redirectUri) {
          return new Response(JSON.stringify({ error: "code and redirectUri are required" }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const verifiedState = state ? await verifyOAuthState(state) : null;
        if (state && (!verifiedState || verifiedState.userId !== userId)) {
          return new Response(JSON.stringify({ error: "Invalid or expired Google Drive state." }), {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const result = await completeDriveLink(userId, code, redirectUri);
        return new Response(JSON.stringify({ ...result, returnTo: verifiedState?.returnTo || null }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Token exchange failed" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
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

    // Action: list files in Vowz folder
    if (action === "list") {
      const tokenData = await getValidToken(userId);
      if (!tokenData) {
        return new Response(JSON.stringify({ error: "Google Drive not linked" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const query = `'${tokenData.folderId}' in parents and trashed = false`;
      const fields = "files(id,name,mimeType,size,createdTime,thumbnailLink,webViewLink,webContentLink)";
      const listRes = await fetch(
        `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=${encodeURIComponent(fields)}&orderBy=createdTime desc&pageSize=100`,
        { headers: { Authorization: `Bearer ${tokenData.accessToken}` } }
      );
      const listData = await listRes.json();
      return new Response(JSON.stringify({ success: true, files: listData.files || [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: delete file from Drive
    if (action === "delete") {
      const { fileId } = await req.json();
      if (!fileId) {
        return new Response(JSON.stringify({ error: "fileId required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tokenData = await getValidToken(userId);
      if (!tokenData) {
        return new Response(JSON.stringify({ error: "Google Drive not linked" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const delRes = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${tokenData.accessToken}` },
      });

      if (delRes.status === 204 || delRes.ok) {
        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const errData = await delRes.json().catch(() => ({}));
      return new Response(JSON.stringify({ error: "Delete failed", details: errData }), {
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
