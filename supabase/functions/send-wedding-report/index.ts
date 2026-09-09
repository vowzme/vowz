import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCors } from '../_shared/cors.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Public endpoint: emails one person the Wedding Intelligence Report they just
// generated. It only ever sends the fixed 'wedding-report' template.

const strArr = (v: unknown, max = 8) =>
  Array.isArray(v) ? v.filter((x) => typeof x === 'string').slice(0, max).map((s) => (s as string).slice(0, 300)) : undefined

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const recipientEmail = String(body.recipientEmail ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return json({ error: 'Valid recipientEmail is required' }, 400)
    }
    const d = (body.templateData ?? {}) as Record<string, unknown>
    const templateData = {
      name: typeof d.name === 'string' ? d.name.slice(0, 120) : undefined,
      score: typeof d.score === 'number' ? d.score : undefined,
      daysLeft: typeof d.daysLeft === 'number' ? d.daysLeft : undefined,
      guests: typeof d.guests === 'number' ? d.guests : undefined,
      budget: typeof d.budget === 'number' ? d.budget : undefined,
      splitLines: strArr(d.splitLines),
      timelineLines: strArr(d.timelineLines),
      gaps: strArr(d.gaps),
      rituals: strArr(d.rituals),
      reportUrl: 'https://vowz.me/wedding-report',
      weekly: false,
    }

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    try {
      const result = await sendTemplateEmail('wedding-report', recipientEmail, {
        templateData,
        idempotencyKey: typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined,
      })
      await admin.from('email_send_log').insert({
        message_id: crypto.randomUUID(),
        template_name: 'wedding-report',
        recipient_email: recipientEmail,
        status: result.sent ? 'sent' : 'suppressed',
      })
      return json({ success: result.sent, reason: result.sent ? undefined : result.reason })
    } catch (e) {
      const message = e instanceof Error ? e.message : 'send failed'
      await admin.from('email_send_log').insert({
        message_id: crypto.randomUUID(),
        template_name: 'wedding-report',
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: message.slice(0, 500),
      })
      return json({ error: message }, 502)
    }
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : 'unexpected error' }, 500)
  }
})
