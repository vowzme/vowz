import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCors } from '../_shared/cors.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Emails one person the Wedding Intelligence Report they just generated.
//
// The caller passes only the id of the saved lead row. The recipient address and
// every line of the report are read server-side from that row, so this endpoint
// cannot be used to deliver arbitrary content to an arbitrary address.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const strArr = (v: unknown, max = 8) =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === 'string').slice(0, max).map((s) => (s as string).slice(0, 300))
    : undefined

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const body = await req.json().catch(() => ({}))
    const leadId = String(body.leadId ?? '').trim()
    if (!UUID_RE.test(leadId)) return json({ error: 'leadId is required' }, 400)

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: lead, error: leadErr } = await admin
      .from('wedding_report_leads')
      .select('id, email, couple_name, score, guest_count, budget, report, created_at')
      .eq('id', leadId)
      .maybeSingle()

    if (leadErr) {
      console.error('lead lookup failed', leadErr.message)
      return json({ error: 'Unexpected error' }, 500)
    }
    if (!lead) return json({ error: 'Not found' }, 404)

    // Single-use window: the report email is only sent right after the quiz is saved.
    const ageMs = Date.now() - new Date(lead.created_at as string).getTime()
    if (!(ageMs >= 0 && ageMs < 15 * 60 * 1000)) return json({ error: 'Not found' }, 404)

    const recipientEmail = String(lead.email ?? '').trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return json({ success: false, reason: 'no_recipient' })
    }

    const r = (lead.report ?? {}) as Record<string, unknown>
    const templateData = {
      name: typeof lead.couple_name === 'string' ? lead.couple_name.slice(0, 120) : undefined,
      score: typeof lead.score === 'number' ? lead.score : undefined,
      daysLeft: typeof r.daysLeft === 'number' ? r.daysLeft : undefined,
      guests: typeof lead.guest_count === 'number' ? lead.guest_count : undefined,
      budget: typeof lead.budget === 'number' ? Number(lead.budget) : undefined,
      splitLines: strArr(r.splitLines),
      timelineLines: strArr(r.timelineLines),
      gaps: strArr(r.gaps),
      rituals: strArr(r.rituals),
      reportUrl: 'https://vowz.me/wedding-report',
      weekly: false,
    }

    try {
      const result = await sendTemplateEmail('wedding-report', recipientEmail, {
        templateData,
        idempotencyKey: `wedding-report-${lead.id}`,
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
      return json({ error: 'Failed to send report email' }, 502)
    }
  } catch (e) {
    console.error('send-wedding-report error', e instanceof Error ? e.message : String(e))
    return json({ error: 'Unexpected error' }, 500)
  }
})
