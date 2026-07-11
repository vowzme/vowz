import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/components@0.0.22'
import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'
import { DEFAULT_BRAND } from '../_shared/transactional-email-templates/brand.ts'

// Configuration baked in at scaffold time — do NOT change these manually.
// To update, re-run the email domain setup flow.
const SITE_NAME = "vowz"
// SENDER_DOMAIN is the verified sender subdomain FQDN (e.g., "notify.example.com").
// It MUST match the subdomain delegated to Lovable's nameservers — never the root domain.
// The email API looks up this exact domain; a mismatch causes "No email domain record found".
const SENDER_DOMAIN = "notify.vowz.me"
// FROM_DOMAIN is the domain shown in the From: header (e.g., "example.com").
// When display_from_root is enabled, this can be the root domain for cleaner branding,
// even though actual sending uses the subdomain above.
const FROM_DOMAIN = "vowz.me"

// Fetch admin-configurable branding row (single-row table with id=1).
async function loadBranding(supabase: any) {
  try {
    const { data } = await supabase
      .from('email_branding')
      .select('logo_url, primary_color, accent_color, button_text_color, from_name, footer_text')
      .eq('id', 1)
      .maybeSingle()
    if (!data) return DEFAULT_BRAND
    return {
      logoUrl: data.logo_url || DEFAULT_BRAND.logoUrl,
      primaryColor: data.primary_color || DEFAULT_BRAND.primaryColor,
      accentColor: data.accent_color || DEFAULT_BRAND.accentColor,
      buttonTextColor: data.button_text_color || DEFAULT_BRAND.buttonTextColor,
      fromName: data.from_name || DEFAULT_BRAND.fromName,
      footerText: data.footer_text || DEFAULT_BRAND.footerText,
    }
  } catch (e) {
    console.warn('loadBranding failed — using defaults', e)
    return DEFAULT_BRAND
  }
}

// Generate a cryptographically random 32-byte hex token
function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

// Auth note: this function uses verify_jwt = true in config.toml, so Supabase's
// gateway validates the caller's JWT (anon or service_role) before the request
// reaches this code. No in-function auth check is needed.
//
// SECURITY: the gateway only confirms the JWT is a valid Supabase key — it does
// NOT prove the caller has any right to send email to `recipientEmail`. Without
// an in-function authorization gate, anyone with the public anon key could use
// this endpoint to send branded phishing/spam from the verified domain. We
// enforce authorization below:
//
//   * Anonymous callers may only trigger a small allow-list of guest-facing
//     templates (currently `rsvp-confirmation`), and the recipient must
//     correspond to a recent row in a trusted table (e.g. `rsvps`) — so
//     attackers cannot mail arbitrary inboxes without first writing a real
//     RSVP row (which is itself RLS-scoped).
//   * Authenticated non-admin users may send to their OWN email only.
//   * Admins (per `admin_emails`) can send to any address (used by the admin
//     retry UI).

const ANON_ALLOWED_TEMPLATES = new Set(['rsvp-confirmation'])
// Freshness window when correlating anon sends against a trusted table row.
const ANON_RECORD_LOOKBACK_MS = 15 * 60 * 1000

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing required environment variables')
    return new Response(
      JSON.stringify({ error: 'Server configuration error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Resolve caller identity from the Authorization header.
  // `verify_jwt = true` at the gateway guarantees this header exists and is a
  // valid Supabase JWT (anon or user). We still need to distinguish anon vs
  // authenticated users in-function to authorize the send.
  const authHeader = req.headers.get('Authorization') || ''
  const bearer = authHeader.replace(/^Bearer\s+/i, '').trim()
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || ''
  let callerUserId: string | null = null
  let callerEmail: string | null = null
  if (bearer && bearer !== anonKey) {
    try {
      const authClient = createClient(supabaseUrl, anonKey || supabaseServiceKey)
      const { data: claimsResult } = await authClient.auth.getClaims(bearer)
      const claims: any = claimsResult?.claims
      if (claims && claims.role === 'authenticated' && typeof claims.sub === 'string') {
        callerUserId = claims.sub
        callerEmail = typeof claims.email === 'string' ? claims.email : null
      }
    } catch (e) {
      console.warn('JWT claim extraction failed — treating caller as anonymous', e)
    }
  }

  // Parse request body
  let templateName: string
  let recipientEmail: string
  let idempotencyKey: string
  let messageId: string
  let templateData: Record<string, any> = {}
  try {
    const body = await req.json()
    templateName = body.templateName || body.template_name
    recipientEmail = body.recipientEmail || body.recipient_email
    messageId = crypto.randomUUID()
    idempotencyKey = body.idempotencyKey || body.idempotency_key || messageId
    if (body.templateData && typeof body.templateData === 'object') {
      templateData = body.templateData
    }
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid JSON in request body' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (!templateName) {
    return new Response(
      JSON.stringify({ error: 'templateName is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 1. Look up template from registry (early — needed to resolve recipient)
  const template = TEMPLATES[templateName]

  if (!template) {
    console.error('Template not found in registry', { templateName })
    return new Response(
      JSON.stringify({
        error: `Template '${templateName}' not found. Available: ${Object.keys(TEMPLATES).join(', ')}`,
      }),
      {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Resolve effective recipient: template-level `to` takes precedence over
  // the caller-provided recipientEmail. This allows notification templates
  // to always send to a fixed address (e.g., site owner from env var).
  const effectiveRecipient = template.to || recipientEmail

  if (!effectiveRecipient) {
    return new Response(
      JSON.stringify({
        error: 'recipientEmail is required (unless the template defines a fixed recipient)',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // Create Supabase client with service role (bypasses RLS)
  const supabase = createClient(supabaseUrl, supabaseServiceKey)

  // Determine admin status for the caller (admins can send any template to any recipient).
  let isAdmin = false
  if (callerUserId) {
    try {
      const { data: adminCheck } = await supabase.rpc('is_admin', { _user_id: callerUserId })
      isAdmin = Boolean(adminCheck)
    } catch (e) {
      console.warn('is_admin RPC failed — treating caller as non-admin', e)
    }
  }

  // ── Authorization gate ────────────────────────────────────────────────────
  // Reject early when the caller has no right to send this template to this
  // recipient. Blocks the "anyone with the anon key can mail any inbox" hole.
  if (!isAdmin) {
    const normalized = effectiveRecipient.toLowerCase()
    if (!callerUserId) {
      // Anonymous caller — must use an allow-listed template AND the recipient
      // must correspond to a recently persisted trusted record.
      if (!ANON_ALLOWED_TEMPLATES.has(templateName)) {
        console.warn('Anon caller blocked from template', { templateName })
        return new Response(
          JSON.stringify({ error: 'Not authorized to send this template' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      if (templateName === 'rsvp-confirmation') {
        const since = new Date(Date.now() - ANON_RECORD_LOOKBACK_MS).toISOString()
        const { data: rsvpRow, error: rsvpErr } = await supabase
          .from('rsvps')
          .select('id')
          .ilike('guest_email', normalized)
          .gte('created_at', since)
          .limit(1)
          .maybeSingle()
        if (rsvpErr || !rsvpRow) {
          console.warn('Anon rsvp-confirmation blocked — no matching recent RSVP', {
            normalized,
            rsvpErr,
          })
          return new Response(
            JSON.stringify({ error: 'Not authorized to send to this recipient' }),
            { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
      }
    } else {
      // Authenticated non-admin — can only email themselves.
      if (!callerEmail || callerEmail.toLowerCase() !== normalized) {
        console.warn('Authenticated non-admin blocked from sending to another address', {
          callerUserId,
          normalized,
        })
        return new Response(
          JSON.stringify({ error: 'Not authorized to send to this recipient' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }
  }

  // 2. Check suppression list (fail-closed: if we can't verify, don't send)
  const { data: suppressed, error: suppressionError } = await supabase
    .from('suppressed_emails')
    .select('id')
    .eq('email', effectiveRecipient.toLowerCase())
    .maybeSingle()

  if (suppressionError) {
    console.error('Suppression check failed — refusing to send', {
      error: suppressionError,
      effectiveRecipient,
    })
    return new Response(
      JSON.stringify({ error: 'Failed to verify suppression status' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (suppressed) {
    // Log the suppressed attempt
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
    })

    console.log('Email suppressed', { effectiveRecipient, templateName })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 3. Get or create unsubscribe token (one token per email address)
  const normalizedEmail = effectiveRecipient.toLowerCase()
  let unsubscribeToken: string

  // Check for existing token for this email
  const { data: existingToken, error: tokenLookupError } = await supabase
    .from('email_unsubscribe_tokens')
    .select('token, used_at')
    .eq('email', normalizedEmail)
    .maybeSingle()

  if (tokenLookupError) {
    console.error('Token lookup failed', {
      error: tokenLookupError,
      email: normalizedEmail,
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to look up unsubscribe token',
    })
    return new Response(
      JSON.stringify({ error: 'Failed to prepare email' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  if (existingToken && !existingToken.used_at) {
    // Reuse existing unused token
    unsubscribeToken = existingToken.token
  } else if (!existingToken) {
    // Create new token — upsert handles concurrent inserts gracefully
    unsubscribeToken = generateToken()
    const { error: tokenError } = await supabase
      .from('email_unsubscribe_tokens')
      .upsert(
        { token: unsubscribeToken, email: normalizedEmail },
        { onConflict: 'email', ignoreDuplicates: true }
      )

    if (tokenError) {
      console.error('Failed to create unsubscribe token', {
        error: tokenError,
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to create unsubscribe token',
      })
      return new Response(
        JSON.stringify({ error: 'Failed to prepare email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    // If another request raced us, our upsert was silently ignored.
    // Re-read to get the actual stored token.
    const { data: storedToken, error: reReadError } = await supabase
      .from('email_unsubscribe_tokens')
      .select('token')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (reReadError || !storedToken) {
      console.error('Failed to read back unsubscribe token after upsert', {
        error: reReadError,
        email: normalizedEmail,
      })
      await supabase.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: effectiveRecipient,
        status: 'failed',
        error_message: 'Failed to confirm unsubscribe token storage',
      })
      return new Response(
        JSON.stringify({ error: 'Failed to prepare email' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }
    unsubscribeToken = storedToken.token
  } else {
    // Token exists but is already used — email should have been caught by suppression check above.
    // This is a safety fallback; log and skip sending.
    console.warn('Unsubscribe token already used but email not suppressed', {
      email: normalizedEmail,
    })
    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'suppressed',
      error_message:
        'Unsubscribe token used but email missing from suppressed list',
    })
    return new Response(
      JSON.stringify({ success: false, reason: 'email_suppressed' }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }

  // 4. Render React Email template to HTML and plain text
  const brand = await loadBranding(supabase)
  const renderData = { ...templateData, _brand: brand }
  const html = await renderAsync(
    React.createElement(template.component, renderData)
  )
  const plainText = await renderAsync(
    React.createElement(template.component, renderData),
    { plainText: true }
  )

  // Resolve subject — supports static string or dynamic function
  const resolvedSubject =
    typeof template.subject === 'function'
      ? template.subject(templateData)
      : template.subject

  // 5. Enqueue the pre-rendered email for async processing by the dispatcher.
  // The dispatcher (process-email-queue) handles sending, retries, and rate-limit backoff.

  // Log pending BEFORE enqueue so we have a record even if enqueue crashes
  await supabase.from('email_send_log').insert({
    message_id: messageId,
    template_name: templateName,
    recipient_email: effectiveRecipient,
    status: 'pending',
  })

  const { error: enqueueError } = await supabase.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: effectiveRecipient,
      from: `${brand.fromName || SITE_NAME} <noreply@${FROM_DOMAIN}>`,
      sender_domain: SENDER_DOMAIN,
      subject: resolvedSubject,
      html,
      text: plainText,
      purpose: 'transactional',
      label: templateName,
      idempotency_key: idempotencyKey,
      unsubscribe_token: unsubscribeToken,
      queued_at: new Date().toISOString(),
    },
  })

  if (enqueueError) {
    console.error('Failed to enqueue email', {
      error: enqueueError,
      templateName,
      effectiveRecipient,
    })

    await supabase.from('email_send_log').insert({
      message_id: messageId,
      template_name: templateName,
      recipient_email: effectiveRecipient,
      status: 'failed',
      error_message: 'Failed to enqueue email',
    })

    return new Response(JSON.stringify({ error: 'Failed to enqueue email' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  console.log('Transactional email enqueued', { templateName, effectiveRecipient })

  return new Response(
    JSON.stringify({ success: true, queued: true }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  )
})
