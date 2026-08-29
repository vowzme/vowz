/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { sendRawEmail } from '../_shared/managed-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

type Action = 'approved' | 'hidden' | 'deleted'

function escape(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function render(guestName: string, coupleTitle: string, action: Action, caption: string | null) {
  const g = escape(guestName || 'there')
  const c = escape(coupleTitle || 'the wedding')
  const cap = caption ? `<p style="font-size:14px;color:#6b6b6b;font-style:italic;margin:12px 0 0">${'\u201C'}${escape(caption)}${'\u201D'}</p>` : ''

  const heading =
    action === 'approved' ? 'Your photo is live! 🎉' :
    action === 'hidden' ? 'Your photo was hidden' :
    'Your photo was removed'

  const message =
    action === 'approved'
      ? `Great news — the couple approved your photo submission for <strong>${c}</strong>. It${'\u2019'}s now visible in the guest album.`
      : action === 'hidden'
      ? `Just a heads-up: the couple has hidden your photo submission for <strong>${c}</strong> from the public guest album. It has not been deleted.`
      : `We wanted to let you know that the couple has removed your photo submission for <strong>${c}</strong> from the guest album.`

  const subject =
    action === 'approved' ? `Your photo is live in ${coupleTitle}${'\u2019'}s album` :
    action === 'hidden' ? `Your photo was hidden from ${coupleTitle}${'\u2019'}s album` :
    `Your photo was removed from ${coupleTitle}${'\u2019'}s album`

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#3a3a3a">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:8px 0 24px">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#001F3F;margin:0">VowZ</h1>
      <p style="font-size:12px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0">Guest Album</p>
    </div>
    <div style="background:#FAFAF7;border:1px solid #EFE7D2;border-radius:12px;padding:32px 28px">
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#001F3F;margin:0 0 16px">${escape(heading)}</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 12px">Hi ${g},</p>
      <p style="font-size:15px;line-height:1.6;margin:0">${message}</p>
      ${cap}
    </div>
    <p style="font-size:12px;color:#999;text-align:center;margin:24px 0 0">VowZ by AXPIR Tech India LLP · <a href="https://vowz.me" style="color:#D4AF37;text-decoration:none">vowz.me</a></p>
  </div>
</body></html>`

  const text = `${heading}\n\nHi ${guestName || 'there'},\n\n${message.replace(/<[^>]+>/g, '')}\n\n— VowZ`
  return { html, text, subject }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const authHeader = req.headers.get('Authorization') || ''
  if (!authHeader.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const user = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: authHeader } } })
  const { data: claims, error: claimsErr } = await user.auth.getClaims(authHeader.replace('Bearer ', ''))
  if (claimsErr || !claims?.claims?.sub) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
  const userId = claims.claims.sub as string

  let body: { post_id?: string; action?: Action; resend?: boolean }
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const postId = body.post_id
  const action = body.action
  const resend = body.resend === true
  if (!postId || !action || !['approved', 'hidden', 'deleted'].includes(action)) {
    return new Response(JSON.stringify({ error: 'post_id and valid action required' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  // Fetch post + verify ownership through wedding_sites
  const { data: post } = await admin
    .from('guest_album_posts')
    .select('id, wedding_site_id, guest_name, guest_email, caption')
    .eq('id', postId)
    .maybeSingle()

  if (!post) {
    return new Response(JSON.stringify({ error: 'Post not found' }), {
      status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const { data: site } = await admin
    .from('wedding_sites')
    .select('id, user_id, partner1, partner2')
    .eq('id', post.wedding_site_id)
    .maybeSingle()

  const { data: isAdminRow } = await admin.rpc('is_admin', { _user_id: userId })
  if (!site || (site.user_id !== userId && !isAdminRow)) {
    return new Response(JSON.stringify({ error: 'Forbidden' }), {
      status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  let messageId: string | null = null
  const guestEmail = post.guest_email?.trim()

  messageId = crypto.randomUUID()

  if (resend) {
    // Manual resend: bypass idempotency, refresh the event's message_id
    // so the new attempt is tracked separately in email_send_log.
    if (!guestEmail) {
      return new Response(JSON.stringify({ error: 'No guest email on file for this post' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    await admin
      .from('guest_moderation_events')
      .update({ message_id: messageId, guest_email: guestEmail, actor_user_id: userId })
      .eq('post_id', postId)
      .eq('action', action)
  } else {
    // Idempotency: insert the moderation event first. A unique index on
    // (post_id, action) makes duplicate clicks a no-op — we detect that
    // via the returned row count and skip enqueueing another email.
    const { data: inserted, error: insertErr } = await admin
      .from('guest_moderation_events')
      .upsert({
        post_id: postId,
        wedding_site_id: site.id,
        action,
        guest_email: guestEmail || null,
        message_id: guestEmail ? messageId : null,
        actor_user_id: userId,
      }, { onConflict: 'post_id,action', ignoreDuplicates: true })
      .select('id')

    if (insertErr) {
      return new Response(JSON.stringify({ error: 'Failed to record event', detail: insertErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const isDuplicate = !inserted || inserted.length === 0
    if (isDuplicate) {
      return new Response(JSON.stringify({ ok: true, emailed: false, duplicate: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
  }

  if (guestEmail) {
    // Owner opt-out: account-wide or per-site
    const { data: prefs } = await admin
      .from('guest_notification_prefs')
      .select('wedding_site_id, enabled')
      .eq('user_id', site.user_id)
      .or(`wedding_site_id.is.null,wedding_site_id.eq.${site.id}`)

    const account = (prefs || []).find((p: any) => p.wedding_site_id === null)
    const siteRow = (prefs || []).find((p: any) => p.wedding_site_id === site.id)
    const optedOut =
      (account && account.enabled === false) ||
      (siteRow && siteRow.enabled === false)

    if (optedOut) {
      return new Response(JSON.stringify({ ok: true, emailed: false, opted_out: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Skip if suppressed
    const { data: suppressed } = await admin
      .from('suppressed_emails')
      .select('email')
      .eq('email', guestEmail.toLowerCase())
      .maybeSingle()

    if (!suppressed) {
      const couple = [site.partner1, site.partner2].filter(Boolean).join(' & ') || 'the couple'
      let { html, text, subject } = render(post.guest_name || 'there', couple, action, post.caption)

      // Optional per-site custom template
      const { data: custom } = await admin
        .from('guest_moderation_templates')
        .select('subject, body_html')
        .eq('wedding_site_id', site.id)
        .eq('action', action)
        .maybeSingle()

      if (custom && (custom.subject || custom.body_html)) {
        const vars: Record<string, string> = {
          guest_name: post.guest_name || 'there',
          couple,
          caption: post.caption || '',
          action,
        }
        const substitute = (s: string) =>
          s.replace(/\{\{\s*(guest_name|couple|caption|action)\s*\}\}/g, (_, k) => escape(vars[k] || ''))

        if (custom.subject) subject = substitute(custom.subject)
        if (custom.body_html) {
          html = substitute(custom.body_html)
          text = html.replace(/<[^>]+>/g, '').trim()
        }
      }
      const label = `guest_moderation_${action}`

      await admin.from('email_send_log').insert({
        message_id: messageId,
        template_name: label,
        recipient_email: guestEmail,
        status: 'pending',
      })

      try {
        await admin.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: guestEmail,
            from: 'VowZ Album <noreply@vowz.me>',
            sender_domain: 'notify.vowz.me',
            subject,
            html,
            text,
            purpose: 'transactional',
            label,
            queued_at: new Date().toISOString(),
          },
        })
      } catch (e) {
        await admin.from('email_send_log').insert({
          message_id: messageId,
          template_name: label,
          recipient_email: guestEmail,
          status: 'failed',
          error_message: e instanceof Error ? e.message : String(e),
        })
      }
    } else {
      messageId = null
    }
  } else {
    messageId = null
  }

  return new Response(JSON.stringify({ ok: true, emailed: Boolean(messageId), message_id: messageId }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})