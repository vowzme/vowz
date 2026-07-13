/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') || ''

type Milestone = 'd7' | 'd3' | 'd1' | 'overdue'

interface ChecklistRow {
  id: string
  wedding_site_id: string
  title: string
  category: string | null
  due_date: string
  is_completed: boolean
  reminder_flags: Record<string, string> | null
}

function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

function fmtDate(iso: string): string {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC',
  })
}

function daysUntilDue(dueDate: string): number {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  const due = new Date(dueDate + 'T00:00:00Z')
  return Math.floor((due.getTime() - today.getTime()) / 86400000)
}

function milestoneFor(days: number): Milestone | null {
  if (days < 0) return 'overdue'
  if (days === 0 || days === 1) return 'd1'
  if (days <= 3) return 'd3'
  if (days <= 7) return 'd7'
  return null
}

function render(name: string, coupleTitle: string, items: ChecklistRow[], milestone: Milestone) {
  const safeName = escape(name)
  const safeCouple = escape(coupleTitle)
  const heading =
    milestone === 'overdue' ? 'Overdue wedding tasks need your attention' :
    milestone === 'd1' ? 'A wedding task is due tomorrow' :
    milestone === 'd3' ? 'Wedding tasks due in the next 3 days' :
    'Wedding tasks due in the next week'

  const subject =
    milestone === 'overdue' ? `⚠️ Overdue: ${items.length} wedding task${items.length === 1 ? '' : 's'}` :
    milestone === 'd1' ? `⏰ Due tomorrow: ${items[0].title}` :
    milestone === 'd3' ? `🗓️ ${items.length} wedding task${items.length === 1 ? '' : 's'} due soon` :
    `📋 ${items.length} wedding task${items.length === 1 ? '' : 's'} due this week`

  const rows = items.map((it) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #EFE7D2;font-size:14px;color:#001F3F;font-weight:600">${escape(it.title)}</td>
      <td style="padding:12px 8px;border-bottom:1px solid #EFE7D2;font-size:13px;color:#6b6b6b;text-align:right;white-space:nowrap">${fmtDate(it.due_date)}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#3a3a3a">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:8px 0 24px">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#001F3F;margin:0">VowZ</h1>
      <p style="font-size:12px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0">Wedding Planner</p>
    </div>
    <div style="background:#FAFAF7;border:1px solid #EFE7D2;border-radius:12px;padding:32px 28px">
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#001F3F;margin:0 0 16px">${escape(heading)}</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px">Hi ${safeName}, here${'\u2019'}s a friendly reminder for <strong>${safeCouple}</strong>:</p>
      <table style="width:100%;border-collapse:collapse;margin:8px 0 16px">${rows}</table>
      <div style="text-align:center;margin:24px 0 8px">
        <a href="https://vowz.me/dashboard" style="background:#D4AF37;color:#001F3F;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block">Open Planner</a>
      </div>
      <p style="font-size:13px;color:#6b6b6b;line-height:1.5;margin:16px 0 0;text-align:center">Mark items complete once done — we won${'\u2019'}t remind you again.</p>
    </div>
    <hr style="border:none;border-top:1px solid #EFE7D2;margin:32px 0 16px"/>
    <p style="font-size:12px;color:#999;text-align:center;margin:0">VowZ by AXPIR Tech India LLP · <a href="https://vowz.me" style="color:#D4AF37;text-decoration:none">vowz.me</a></p>
  </div>
</body></html>`

  const text = `${heading}\n\nHi ${name},\n\n${items.map((it) => `• ${it.title} — due ${fmtDate(it.due_date)}`).join('\n')}\n\nOpen Planner: https://vowz.me/dashboard\n\n— VowZ`
  return { html, text, subject }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  const allowed = new Set<string>([SERVICE_KEY])
  if (CRON_SECRET) allowed.add(CRON_SECRET)
  if (!token || !allowed.has(token)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const summary = { sites_scanned: 0, emails_sent: 0, items_notified: 0, errors: [] as string[] }

  try {
    // Look 7 days ahead + a small window into the past to catch overdue.
    const horizon = new Date(Date.now() + 8 * 86400000).toISOString().slice(0, 10)
    const pastLimit = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)

    const { data: items, error } = await admin
      .from('wedding_checklist')
      .select('id, wedding_site_id, title, category, due_date, is_completed, reminder_flags')
      .eq('is_completed', false)
      .not('due_date', 'is', null)
      .lte('due_date', horizon)
      .gte('due_date', pastLimit)

    if (error) throw error

    // Group items by (site, milestone) so each owner gets at most one email per bucket per run.
    const buckets = new Map<string, { siteId: string; milestone: Milestone; items: ChecklistRow[] }>()
    for (const raw of (items || []) as ChecklistRow[]) {
      const days = daysUntilDue(raw.due_date)
      const m = milestoneFor(days)
      if (!m) continue
      const flags = raw.reminder_flags || {}
      if (flags[m]) continue // already sent for this milestone
      const key = `${raw.wedding_site_id}::${m}`
      const existing = buckets.get(key)
      if (existing) existing.items.push(raw)
      else buckets.set(key, { siteId: raw.wedding_site_id, milestone: m, items: [raw] })
    }

    if (buckets.size === 0) {
      return new Response(JSON.stringify(summary), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const siteIds = Array.from(new Set(Array.from(buckets.values()).map((b) => b.siteId)))
    const { data: sites } = await admin
      .from('wedding_sites')
      .select('id, user_id, bride_name, groom_name, status')
      .in('id', siteIds)

    const siteMap = new Map((sites || []).map((s: any) => [s.id, s]))
    const userIds = Array.from(new Set((sites || []).map((s: any) => s.user_id)))
    const { data: profiles } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]))

    for (const bucket of buckets.values()) {
      summary.sites_scanned++
      try {
        const site: any = siteMap.get(bucket.siteId)
        if (!site || site.status !== 'active') continue
        const profile: any = profileMap.get(site.user_id)
        if (!profile?.email) continue

        const name = profile.full_name?.trim() || site.bride_name || 'there'
        const couple = [site.bride_name, site.groom_name].filter(Boolean).join(' & ') || 'your wedding'
        const { html, text, subject } = render(name, couple, bucket.items, bucket.milestone)

        const messageId = crypto.randomUUID()
        const label = `checklist_reminder_${bucket.milestone}`

        await admin.from('email_send_log').insert({
          message_id: messageId,
          template_name: label,
          recipient_email: profile.email,
          status: 'pending',
        })

        await admin.rpc('enqueue_email', {
          queue_name: 'transactional_emails',
          payload: {
            message_id: messageId,
            to: profile.email,
            from: 'VowZ Planner <noreply@vowz.me>',
            sender_domain: 'notify.vowz.me',
            subject,
            html,
            text,
            purpose: 'transactional',
            label,
            queued_at: new Date().toISOString(),
          },
        })

        // Mark each item so we never re-send the same milestone.
        const stamp = new Date().toISOString()
        for (const it of bucket.items) {
          const merged = { ...(it.reminder_flags || {}), [bucket.milestone]: stamp }
          await admin.from('wedding_checklist')
            .update({ reminder_flags: merged })
            .eq('id', it.id)
        }

        summary.emails_sent++
        summary.items_notified += bucket.items.length
      } catch (inner) {
        summary.errors.push(inner instanceof Error ? inner.message : String(inner))
      }
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err instanceof Error ? err.message : String(err), summary }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})