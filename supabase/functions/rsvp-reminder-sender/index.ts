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
const TRACK_BASE = `${SUPABASE_URL}/functions/v1/email-track`

function escape(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function render(opts: {
  guestName: string
  coupleNames: string
  weddingDate: string | null
  inviteUrl: string
  daysLeft: number
  messageId: string
  subjectOverride?: string | null
  bodyOverride?: string | null
}) {
  const trackParams = `m=${encodeURIComponent(opts.messageId)}&v=A&t=rsvp_reminder`
  const pixelUrl = `${TRACK_BASE}/open?${trackParams}`
  const ctaUrl = `${TRACK_BASE}/click?${trackParams}&u=${encodeURIComponent(opts.inviteUrl)}`
  const name = escape(opts.guestName || 'there')
  const couple = escape(opts.coupleNames || 'the happy couple')
  const daysLeft = Math.max(0, opts.daysLeft | 0)
  const dateLine = opts.weddingDate ? escape(opts.weddingDate) : ''

  const subject =
    (opts.subjectOverride && opts.subjectOverride.trim()) ||
    `A gentle reminder — ${opts.coupleNames || 'our wedding'} is in ${daysLeft} day${daysLeft === 1 ? '' : 's'} 💌`

  const bodyText =
    (opts.bodyOverride && opts.bodyOverride.trim()) ||
    `We haven't heard back from you yet and we'd love to know if you'll be joining us. It only takes a minute to RSVP through your personal invitation.`

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#3a3a3a">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:8px 0 24px">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#001F3F;margin:0">VowZ</h1>
      <p style="font-size:12px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0">Friendly RSVP Reminder</p>
    </div>
    <div style="background:#FAFAF7;border:1px solid #EFE7D2;border-radius:12px;padding:32px 28px;text-align:center">
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#001F3F;margin:0 0 12px">Dear ${name},</h2>
      <p style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:700;color:#001F3F;margin:8px 0 12px">${couple}</p>
      ${dateLine ? `<p style="font-size:14px;color:#6b6b6b;margin:0 0 12px"><strong style="color:#001F3F">Wedding date:</strong> ${dateLine}</p>` : ''}
      <p style="font-size:15px;line-height:1.6;margin:16px 0 20px;color:#3a3a3a">${escape(bodyText)}</p>
      <div style="text-align:center;margin:24px 0 8px">
        <a href="${ctaUrl}" style="background:#D4AF37;color:#001F3F;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block">RSVP now</a>
      </div>
      <p style="font-size:13px;color:#6b6b6b;line-height:1.5;margin:20px 0 0">Only ${daysLeft} day${daysLeft === 1 ? '' : 's'} to go — we can't wait to celebrate with you.</p>
    </div>
    <hr style="border:none;border-top:1px solid #EFE7D2;margin:32px 0 16px"/>
    <p style="font-size:12px;color:#999;text-align:center;margin:0">Sent with love via VowZ · <a href="https://vowz.me" style="color:#D4AF37;text-decoration:none">vowz.me</a></p>
    <img src="${pixelUrl}" alt="" width="1" height="1" style="display:block;border:0;width:1px;height:1px" />
  </div>
</body></html>`

  const text = `Dear ${opts.guestName},\n\n${bodyText}\n\n${opts.coupleNames}${dateLine ? ` — ${opts.weddingDate}` : ''}\n\nRSVP: ${ctaUrl}\n\n— VowZ`
  return { html, text, subject }
}

function daysUntil(weddingDate: string): number {
  // weddingDate is ISO date (YYYY-MM-DD). Compare in UTC to be timezone-stable.
  const today = new Date()
  const todayUtc = Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  const [y, m, d] = weddingDate.split('-').map(Number)
  const target = Date.UTC(y, (m || 1) - 1, d || 1)
  return Math.round((target - todayUtc) / 86_400_000)
}

async function processSchedule(admin: any, schedule: any, forcedOffset: number | null) {
  if (!schedule.wedding_date) return { site_id: schedule.wedding_site_id, skipped: 'no_wedding_date' }
  const offsets: number[] = Array.isArray(schedule.offsets_days) ? schedule.offsets_days : []
  const dLeft = daysUntil(schedule.wedding_date)
  const offset = forcedOffset ?? (offsets.includes(dLeft) ? dLeft : null)
  if (offset === null) {
    return { site_id: schedule.wedding_site_id, skipped: 'no_matching_offset', days_left: dLeft, offsets }
  }

  const { data: site } = await admin
    .from('wedding_sites')
    .select('id, partner1, partner2, slug, is_published, status')
    .eq('id', schedule.wedding_site_id)
    .maybeSingle()
  if (!site || !site.is_published || site.status !== 'active' || !site.slug) {
    return { site_id: schedule.wedding_site_id, skipped: 'site_inactive' }
  }
  const coupleNames = [site.partner1, site.partner2].filter(Boolean).join(' & ') || 'our wedding'
  const baseUrl = `https://vowz.me/site/${site.slug}`
  const weddingDateLabel = new Date(schedule.wedding_date + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })

  // Non-responders = invite has no rsvp_id and has an email.
  const { data: invites, error: invErr } = await admin
    .from('guest_invites')
    .select('id, guest_name, guest_email, token')
    .eq('wedding_site_id', site.id)
    .is('rsvp_id', null)
    .not('guest_email', 'is', null)
    .neq('guest_email', '')
  if (invErr) return { site_id: site.id, error: invErr.message }

  let sent = 0, skipped = 0, failed = 0
  for (const inv of (invites || []) as any[]) {
    // Reserve this (invite, offset) slot atomically — unique index prevents dupes.
    const messageId = crypto.randomUUID()
    const { error: resErr } = await admin.from('rsvp_reminder_sends').insert({
      wedding_site_id: site.id,
      invite_id: inv.id,
      offset_day: offset,
      recipient: inv.guest_email,
      message_id: messageId,
      status: 'queued',
    })
    if (resErr) { skipped++; continue } // duplicate — already sent for this offset

    const inviteUrl = `${baseUrl}?g=${encodeURIComponent(inv.token)}`
    const { html, text, subject } = render({
      guestName: inv.guest_name || 'friend',
      coupleNames,
      weddingDate: weddingDateLabel,
      inviteUrl,
      daysLeft: Math.max(0, offset),
      messageId,
      subjectOverride: schedule.subject_override,
      bodyOverride: schedule.body_override,
    })

    let sendError: string | null = null
    let suppressed = false
    try {
      const result = await sendRawEmail({
        to: inv.guest_email,
        fromName: 'VowZ Invites',
        subject,
        html,
        text,
        label: 'rsvp_reminder',
        idempotencyKey: messageId,
      })
      suppressed = !result.sent
    } catch (e) {
      sendError = e instanceof Error ? e.message : String(e)
    }

    const { error: logError } = await admin.from('email_send_log').insert({
      message_id: messageId,
      template_name: 'rsvp_reminder',
      recipient_email: inv.guest_email,
      status: sendError ? 'failed' : suppressed ? 'suppressed' : 'sent',
      error_message: sendError ? sendError.slice(0, 1000) : null,
      metadata: { invite_id: inv.id, offset_day: offset },
    })
    if (logError) console.error('email_send_log insert failed', logError.message)

    if (sendError) {
      failed++
      await admin
        .from('rsvp_reminder_sends')
        .update({ status: 'failed', error: sendError })
        .eq('message_id', messageId)
    } else {
      sent++
    }
  }


  await admin
    .from('rsvp_reminder_schedules')
    .update({ last_run_at: new Date().toISOString() })
    .eq('id', schedule.id)

  return { site_id: site.id, offset, non_responders: invites?.length ?? 0, sent, skipped, failed }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  const admin = createClient(SUPABASE_URL, SERVICE_KEY)

  let mode: 'cron' | 'user' = 'cron'
  let requestedSiteId: string | null = null
  let forcedOffset: number | null = null
  let action: 'send' | 'preview' | 'test_send' = 'send'
  let testEmail: string | null = null

  if (req.method === 'POST') {
    try {
      const body = await req.json()
      if (body?.site_id) {
        requestedSiteId = String(body.site_id)
        mode = 'user'
      }
      if (typeof body?.force_offset === 'number') forcedOffset = body.force_offset
      if (body?.action === 'preview' || body?.action === 'test_send') action = body.action
      if (typeof body?.test_email === 'string') testEmail = body.test_email.trim()
    } catch { /* empty body OK for cron */ }
  }

  // User-triggered "send now" — verify ownership via user JWT.
  if (mode === 'user' && requestedSiteId) {
    const jwt = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
    if (!jwt) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const userClient = createClient(SUPABASE_URL, ANON_KEY, { global: { headers: { Authorization: `Bearer ${jwt}` } } })
    const { data: u } = await userClient.auth.getUser()
    if (!u?.user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    const { data: site } = await admin.from('wedding_sites').select('user_id').eq('id', requestedSiteId).maybeSingle()
    if (!site || site.user_id !== u.user.id) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }
    const { data: schedule } = await admin
      .from('rsvp_reminder_schedules')
      .select('*')
      .eq('wedding_site_id', requestedSiteId)
      .maybeSingle()
    if (!schedule) return new Response(JSON.stringify({ error: 'No schedule configured' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

    // Preview / test-send do not persist reminder sends and use sample data.
    if (action === 'preview' || action === 'test_send') {
      const offset = forcedOffset ?? 7
      const { data: siteRow } = await admin
        .from('wedding_sites')
        .select('id, partner1, partner2, slug')
        .eq('id', requestedSiteId)
        .maybeSingle()
      const coupleNames = [siteRow?.partner1, siteRow?.partner2].filter(Boolean).join(' & ') || 'our wedding'
      const baseUrl = siteRow?.slug ? `https://vowz.me/site/${siteRow.slug}` : 'https://vowz.me'
      const weddingDateLabel = schedule.wedding_date
        ? new Date(schedule.wedding_date + 'T00:00:00Z').toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
          })
        : null
      const messageId = crypto.randomUUID()
      const { html, text, subject } = render({
        guestName: 'Sample Guest',
        coupleNames,
        weddingDate: weddingDateLabel,
        inviteUrl: `${baseUrl}?g=preview`,
        daysLeft: Math.max(0, offset),
        messageId,
        subjectOverride: schedule.subject_override,
        bodyOverride: schedule.body_override,
      })

      if (action === 'preview') {
        return new Response(JSON.stringify({ ok: true, preview: { subject, html, text, offset } }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // test_send — send a real email to the requested address (defaults to owner's).
      const to = testEmail || u.user.email || ''
      if (!to || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
        return new Response(JSON.stringify({ error: 'Invalid test email' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const testSubject = `[TEST] ${subject}`
      let testError: string | null = null
      let testSuppressed = false
      try {
        const testResult = await sendRawEmail({
          to,
          fromName: 'VowZ Invites',
          subject: testSubject,
          html,
          text,
          label: 'rsvp_reminder_test',
          idempotencyKey: messageId,
        })
        testSuppressed = !testResult.sent
      } catch (e) {
        testError = e instanceof Error ? e.message : String(e)
      }

      const { error: logError } = await admin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'rsvp_reminder',
        recipient_email: to,
        status: testError ? 'failed' : testSuppressed ? 'suppressed' : 'sent',
        error_message: testError ? testError.slice(0, 1000) : null,
        metadata: { test: true, offset_day: offset, site_id: requestedSiteId },
      })
      if (logError) console.error('email_send_log insert failed', logError.message)

      if (testError) {
        return new Response(JSON.stringify({ error: testError }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ ok: true, test_send: { to, offset, subject: testSubject } }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const result = await processSchedule(admin, schedule, forcedOffset)
    return new Response(JSON.stringify({ ok: true, result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Cron mode — process every enabled schedule that matches today's offsets.
  const { data: schedules, error } = await admin
    .from('rsvp_reminder_schedules')
    .select('*')
    .eq('enabled', true)
    .not('wedding_date', 'is', null)
  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  const results: any[] = []
  for (const s of schedules || []) {
    try {
      results.push(await processSchedule(admin, s, null))
    } catch (e) {
      results.push({ site_id: s.wedding_site_id, error: String((e as Error).message || e) })
    }
  }

  return new Response(JSON.stringify({ ok: true, processed: results.length, results }), {
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
})