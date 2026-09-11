import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCors } from '../_shared/cors.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Sends the RSVP confirmation email for one guest after they submit an RSVP.
//
// The caller only proves which RSVP it is (rsvpId + the RSVP's secret editToken).
// Every value in the email — recipient address, names, date, venue and both
// links — is looked up server-side, so a caller can never make this endpoint
// deliver arbitrary text or an attacker-controlled link to an arbitrary address.

const APP_ORIGIN = 'https://vowz.me'
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const rsvpId = String(body.rsvpId ?? '').trim()
    const editToken = String(body.editToken ?? '').trim()
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey.slice(0, 200) : undefined

    if (!UUID_RE.test(rsvpId) || !UUID_RE.test(editToken)) {
      return json({ error: 'rsvpId and editToken are required' }, 400)
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    // Authorization: only a caller holding this RSVP's secret edit token gets an email,
    // and only ever to the address stored on that RSVP row.
    const { data: rsvp, error: rsvpErr } = await admin
      .from('rsvps')
      .select('id, wedding_site_id, guest_name, guest_email, attending, guest_count, edit_token')
      .eq('id', rsvpId)
      .maybeSingle()

    if (rsvpErr) {
      console.error('rsvp lookup failed', rsvpErr.message)
      return json({ error: 'Unexpected error' }, 500)
    }
    if (!rsvp || rsvp.edit_token !== editToken) {
      return json({ error: 'Not found' }, 404)
    }

    const recipientEmail = String(rsvp.guest_email ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return json({ success: false, reason: 'no_recipient' })
    }

    const { data: site } = await admin
      .from('wedding_sites')
      .select('id, partner1, partner2, slug, sections, is_published, status')
      .eq('id', rsvp.wedding_site_id)
      .maybeSingle()

    if (!site || site.is_published !== true || site.status !== 'active') {
      return json({ error: 'Not found' }, 404)
    }

    // First scheduled event, for the date/venue line.
    let weddingDate: string | undefined
    let venue: string | undefined
    try {
      const sections = Array.isArray(site.sections) ? (site.sections as any[]) : []
      const events = sections.find((s) => s?.type === 'events')?.data?.events
      const first = Array.isArray(events) ? events[0] : undefined
      if (first?.date) {
        const d = new Date(first.date)
        if (!Number.isNaN(d.getTime())) {
          weddingDate = d.toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
          })
        }
      }
      if (typeof first?.venue === 'string') venue = first.venue.slice(0, 200)
    } catch {
      // Optional detail only — never block the email on it.
    }

    // Links are built from our own origin and the site's own slug only.
    const siteUrl = site.slug ? `${APP_ORIGIN}/site/${encodeURIComponent(site.slug)}` : APP_ORIGIN
    const editUrl = site.slug
      ? `${siteUrl}?rsvp=${encodeURIComponent(rsvp.id)}&t=${encodeURIComponent(editToken)}`
      : undefined

    const templateData = {
      guestName: String(rsvp.guest_name ?? '').slice(0, 120) || undefined,
      coupleNames: `${site.partner1 ?? ''} & ${site.partner2 ?? ''}`.trim().slice(0, 160),
      weddingDate,
      venue,
      attending: typeof rsvp.attending === 'boolean' ? rsvp.attending : undefined,
      guestCount: typeof rsvp.guest_count === 'number' ? rsvp.guest_count : undefined,
      siteUrl,
      editUrl,
    }

    const messageId = crypto.randomUUID()

    try {
      const result = await sendTemplateEmail('rsvp-confirmation', recipientEmail, {
        templateData,
        idempotencyKey,
      })
      const { error: logError } = await admin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'rsvp-confirmation',
        recipient_email: recipientEmail,
        status: result.sent ? 'sent' : 'suppressed',
      })
      if (logError) console.error('email_send_log insert failed', logError.message)
      return json({ success: result.sent, reason: result.sent ? undefined : result.reason })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const { error: logError } = await admin.from('email_send_log').insert({
        message_id: messageId,
        template_name: 'rsvp-confirmation',
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: message.slice(0, 1000),
      })
      if (logError) console.error('email_send_log insert failed', logError.message)
      return json({ error: 'Failed to send confirmation email' }, 500)
    }
  } catch (e) {
    console.error('send-rsvp-confirmation error', e instanceof Error ? e.message : String(e))
    return json({ error: 'Unexpected error' }, 500)
  }
})
