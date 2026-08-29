import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCors } from '../_shared/cors.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Public endpoint: sends the RSVP confirmation email for one guest after they
// submit an RSVP. It only ever sends the fixed 'rsvp-confirmation' template.

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
    const recipientEmail = String(body.recipientEmail ?? '').trim().toLowerCase()
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined
    const data = (body.templateData ?? {}) as Record<string, unknown>

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return json({ error: 'Valid recipientEmail is required' }, 400)
    }

    const str = (v: unknown, max = 300) =>
      typeof v === 'string' ? v.slice(0, max) : undefined
    const templateData = {
      guestName: str(data.guestName, 120),
      coupleNames: str(data.coupleNames, 160),
      weddingDate: str(data.weddingDate, 80),
      venue: str(data.venue, 200),
      attending: typeof data.attending === 'boolean' ? data.attending : undefined,
      guestCount: typeof data.guestCount === 'number' ? data.guestCount : undefined,
      siteUrl: str(data.siteUrl, 500),
      editUrl: str(data.editUrl, 700),
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )
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
