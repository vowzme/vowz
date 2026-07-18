/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const TRACK_BASE = `${SUPABASE_URL}/functions/v1/email-track`

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function render(opts: {
  guestName: string
  coupleNames: string
  weddingDate: string | null
  venue: string | null
  inviteUrl: string
  messageId: string
}) {
  const trackParams = `m=${encodeURIComponent(opts.messageId)}&v=A&t=rsvp_invite`
  const pixelUrl = `${TRACK_BASE}/open?${trackParams}`
  const ctaUrl = `${TRACK_BASE}/click?${trackParams}&u=${encodeURIComponent(opts.inviteUrl)}`
  const name = escape(opts.guestName || 'there')
  const couple = escape(opts.coupleNames || 'the happy couple')
  const date = opts.weddingDate ? escape(opts.weddingDate) : ''
  const venue = opts.venue ? escape(opts.venue) : ''

  const subject = `You're invited — ${opts.coupleNames || 'our wedding'} 💍`
  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#3a3a3a">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:8px 0 24px">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#001F3F;margin:0">VowZ</h1>
      <p style="font-size:12px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0">Wedding Invitation</p>
    </div>
    <div style="background:#FAFAF7;border:1px solid #EFE7D2;border-radius:12px;padding:32px 28px;text-align:center">
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#001F3F;margin:0 0 12px">Dear ${name},</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 8px">You're warmly invited to celebrate the wedding of</p>
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:700;color:#001F3F;margin:8px 0 16px">${couple}</p>
      ${date ? `<p style="font-size:14px;color:#6b6b6b;margin:0 0 4px"><strong style="color:#001F3F">Date:</strong> ${date}</p>` : ''}
      ${venue ? `<p style="font-size:14px;color:#6b6b6b;margin:0 0 16px"><strong style="color:#001F3F">Venue:</strong> ${venue}</p>` : ''}
      <p style="font-size:14px;line-height:1.6;margin:16px 0 20px;color:#3a3a3a">
        Please open your personal invitation and let us know if you'll be joining us.
      </p>
      <div style="text-align:center;margin:24px 0 8px">
        <a href="${ctaUrl}" style="background:#D4AF37;color:#001F3F;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block">Open my invitation & RSVP</a>
      </div>
      <p style="font-size:12px;color:#999;line-height:1.5;margin:20px 0 0">This link is unique to you — please don't share it.</p>
    </div>
    <hr style="border:none;border-top:1px solid #EFE7D2;margin:32px 0 16px"/>
    <p style="font-size:12px;color:#999;text-align:center;margin:0">Sent with love via VowZ · <a href="https://vowz.me" style="color:#D4AF37;text-decoration:none">vowz.me</a></p>
    <img src="${pixelUrl}" alt="" width="1" height="1" style="display:block;border:0;width:1px;height:1px" />
  </div>
</body></html>`
  const text = `Dear ${opts.guestName},\n\nYou're invited to ${opts.coupleNames}'s wedding.\n${date ? `Date: ${opts.weddingDate}\n` : ''}${venue ? `Venue: ${opts.venue}\n` : ''}\nOpen your personal invitation & RSVP: ${ctaUrl}\n\n— VowZ`
  return { html, text, subject }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const authHeader = req.headers.get('Authorization') || ''
  const jwt = authHeader.replace(/^Bearer\s+/i, '').trim()
  if (!jwt) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } })
  const { data: userData, error: userErr } = await userClient.auth.getUser()
  if (userErr || !userData?.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const userId = userData.user.id

  let body: any
  try { body = await req.json() } catch { return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) }
  const siteId = String(body?.site_id || '')
  const inviteIds: string[] = Array.isArray(body?.invite_ids) ? body.invite_ids.map(String).slice(0, 500) : []
  if (!siteId || inviteIds.length === 0) {
    return new Response(JSON.stringify({ error: 'site_id and invite_ids required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  // Verify ownership
  const { data: site, error: siteErr } = await admin
    .from('wedding_sites')
    .select('id, user_id, partner1, partner2, wedding_date, venue, slug, status, is_published')
    .eq('id', siteId)
    .maybeSingle()
  if (siteErr || !site || site.user_id !== userId) {
    return new Response(JSON.stringify({ error: 'Not authorized for this site' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const coupleNames = [site.partner1, site.partner2].filter(Boolean).join(' & ') || 'our wedding'
  const weddingDate = site.wedding_date
    ? new Date(site.wedding_date + 'T00:00:00Z').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' })
    : null
  const baseUrl = site.slug ? `https://vowz.me/site/${site.slug}` : null

  const { data: invites, error: inviteErr } = await admin
    .from('guest_invites')
    .select('id, guest_name, guest_email, token, wedding_site_id')
    .eq('wedding_site_id', siteId)
    .in('id', inviteIds)
  if (inviteErr) {
    return new Response(JSON.stringify({ error: inviteErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const results: Array<{ invite_id: string; status: string; error?: string }> = []
  let sent = 0
  let skipped = 0
  let failed = 0

  for (const inv of (invites || []) as any[]) {
    if (!inv.guest_email || !baseUrl) {
      skipped++
      results.push({ invite_id: inv.id, status: 'skipped', error: !inv.guest_email ? 'no email' : 'site has no slug' })
      continue
    }
    const inviteUrl = `${baseUrl}?g=${encodeURIComponent(inv.token)}`
    const messageId = crypto.randomUUID()
    const { html, text, subject } = render({
      guestName: inv.guest_name || 'friend',
      coupleNames,
      weddingDate,
      venue: site.venue || null,
      inviteUrl,
      messageId,
    })

    const payload = {
      message_id: messageId,
      to: inv.guest_email,
      from: 'VowZ Invites <noreply@vowz.me>',
      sender_domain: 'notify.vowz.me',
      subject,
      html,
      text,
      purpose: 'transactional',
      label: 'rsvp_invite',
      queued_at: new Date().toISOString(),
      metadata: { invite_id: inv.id, site_id: siteId },
    }

    await admin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'rsvp_invite',
      recipient_email: inv.guest_email,
      status: 'pending',
      metadata: { invite_id: inv.id },
    })
    await admin.from('email_ab_events').insert({
      message_id: messageId,
      template_name: 'rsvp_invite',
      variant: 'A',
      event_type: 'sent',
      user_id: userId,
    })

    const { error: qErr } = await admin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload,
    })

    await admin.from('guest_invite_sends').insert({
      invite_id: inv.id,
      wedding_site_id: siteId,
      channel: 'email',
      recipient: inv.guest_email,
      message_id: messageId,
      status: qErr ? 'failed' : 'queued',
      error: qErr ? (qErr.message || String(qErr)) : null,
    })

    if (qErr) {
      failed++
      results.push({ invite_id: inv.id, status: 'failed', error: qErr.message })
    } else {
      sent++
      results.push({ invite_id: inv.id, status: 'queued' })
    }
  }

  return new Response(JSON.stringify({ sent, failed, skipped, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})