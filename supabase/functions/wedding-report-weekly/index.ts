import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCors } from '../_shared/cors.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'

// Scheduled weekly: sends each Wedding Intelligence Report lead a short summary
// of what to do next, until their wedding date passes. One email per lead per week.

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  // Scheduler-only: this job reads private lead data and sends bulk email, so it
  // requires the service-role key or the configured CRON_SECRET.
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const cronSecret = Deno.env.get('CRON_SECRET') || ''
  const token = (req.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '').trim()
  const allowed = new Set<string>([serviceKey])
  if (cronSecret) allowed.add(cronSecret)
  if (!token || !allowed.has(token)) return json({ error: 'Unauthorized' }, 401)

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, serviceKey)
  const today = new Date().toISOString().slice(0, 10)
  const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString()

  const { data: leads, error } = await admin
    .from('wedding_report_leads')
    .select('id, email, couple_name, wedding_date, guest_count, budget, score, report, weekly_optin')
    .not('email', 'is', null)
    .eq('weekly_optin', true)
    .order('created_at', { ascending: false })
    .limit(500)
  if (error) return json({ error: error.message }, 500)

  // Most recent lead per email address, weddings still ahead of us.
  const seen = new Set<string>()
  const targets = (leads ?? []).filter((l) => {
    const email = (l.email ?? '').toLowerCase()
    if (!email || seen.has(email)) return false
    if (l.wedding_date && l.wedding_date < today) return false
    seen.add(email)
    return true
  })


  let sent = 0
  let skipped = 0
  for (const lead of targets) {
    const email = (lead.email as string).toLowerCase()
    const { count } = await admin
      .from('email_send_log')
      .select('id', { count: 'exact', head: true })
      .eq('template_name', 'wedding-report-weekly')
      .eq('recipient_email', email)
      .gte('created_at', weekAgo)
    if ((count ?? 0) > 0) { skipped++; continue }

    const report = (lead.report ?? {}) as Record<string, any>
    const daysLeft = lead.wedding_date
      ? Math.max(0, Math.round((new Date(lead.wedding_date as string).getTime() - Date.now()) / 864e5))
      : undefined
    const timelineLines: string[] = Array.isArray(report.timeline)
      ? report.timeline.map((t: any) => (typeof t === 'string' ? t : `${t?.when ?? ''} — ${t?.what ?? ''}`.trim())).slice(0, 5)
      : []
    const gaps: string[] = Array.isArray(report.gaps) ? report.gaps.slice(0, 4) : []
    const rituals: string[] = Array.isArray(report.rituals)
      ? report.rituals.map((r: any) => `${r?.emoji ?? ''} ${r?.name ?? ''} — ${r?.short ?? ''}`.trim()).slice(0, 4)
      : []

    try {
      const result = await sendTemplateEmail('wedding-report', email, {
        templateData: {
          name: lead.couple_name ?? undefined,
          score: typeof lead.score === 'number' ? lead.score : undefined,
          daysLeft,
          guests: lead.guest_count ?? undefined,
          budget: lead.budget ?? undefined,
          timelineLines,
          gaps,
          rituals,
          weekly: true,
          reportUrl: 'https://vowz.me/wedding-report',
        },
        idempotencyKey: `wedding-report-weekly-${lead.id}-${today}`,
      })
      await admin.from('email_send_log').insert({
        message_id: crypto.randomUUID(),
        template_name: 'wedding-report-weekly',
        recipient_email: email,
        status: result.sent ? 'sent' : 'suppressed',
      })
      if (result.sent) sent++
      else skipped++
    } catch (e) {
      await admin.from('email_send_log').insert({
        message_id: crypto.randomUUID(),
        template_name: 'wedding-report-weekly',
        recipient_email: email,
        status: 'failed',
        error_message: (e instanceof Error ? e.message : 'send failed').slice(0, 500),
      })
    }
  }

  return json({ processed: targets.length, sent, skipped })
})
