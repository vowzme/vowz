/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { sendRawEmail } from '../_shared/managed-email.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const CRON_SECRET = Deno.env.get('CRON_SECRET') || ''

interface SubRow {
  id: string
  user_id: string
  expires_at: string
  status: string
  metadata: Record<string, any> | null
}

function daysBetween(future: string): number {
  return Math.floor((new Date(future).getTime() - Date.now()) / 86400000)
}
function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}
function escape(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!))
}

type ProductKind = 'premium' | 'storage_addon'

function renderEmail(
  name: string,
  daysLeft: number,
  expiresAt: string,
  product: ProductKind = 'premium',
): { html: string; text: string; subject: string } {
  const isExpired = daysLeft <= 0
  const isUrgent = daysLeft > 0 && daysLeft <= 3
  const safeName = escape(name)
  const date = fmtDate(expiresAt)
  const isAddon = product === 'storage_addon'
  const productLabel = isAddon ? 'VowZ +2 GB storage add-on' : 'VowZ Premium'
  const ctaHref = isAddon
    ? 'https://vowz.me/dashboard?buy=storage'
    : 'https://vowz.me/pricing'

  const subject = isExpired
    ? isAddon
      ? 'Your VowZ storage add-on has expired'
      : 'Your VowZ Premium has expired — site paused'
    : isUrgent
      ? `⚠️ Only ${daysLeft} days left on your ${productLabel}`
      : `Your ${productLabel} expires in ${daysLeft} days`

  const heading = isExpired
    ? `Your ${productLabel} has expired`
    : isUrgent
      ? `Only ${daysLeft} days left on your ${productLabel}`
      : `Your ${productLabel} expires in ${daysLeft} days`

  const intro = isAddon
    ? isExpired
      ? `Hi ${safeName}, your +2 GB storage add-on ended on ${date}. Your base storage still works, but the extra space is no longer counted toward your quota. Purchase again to instantly restore capacity for another 6 months.`
      : isUrgent
        ? `Hi ${safeName}, your +2 GB storage add-on expires on ${date}. Extend now to avoid running out of space for photos, invitations, and guest uploads.`
        : `Hi ${safeName}, your +2 GB storage add-on is set to expire on ${date}. Extend early for another 6 months of extra capacity — add-ons stack on top of your current quota.`
    : isExpired
      ? `Hi ${safeName}, your VowZ Premium subscription ended on ${date}. To keep your wedding website live and accessible to guests, your site has been temporarily paused. Renew anytime to bring it back instantly.`
      : isUrgent
        ? `Hi ${safeName}, just a friendly heads-up — your VowZ Premium expires on ${date}. Renew now to avoid any interruption to your wedding website.`
        : `Hi ${safeName}, your VowZ Premium subscription is set to expire on ${date}. Renew early to keep enjoying premium features without interruption.`

  const ctaLabel = isAddon
    ? (isExpired ? 'Buy +2 GB again' : 'Extend Storage')
    : (isExpired ? 'Reactivate Premium' : 'Renew Now')
  const muted = isAddon
    ? (isExpired
      ? 'Existing files are preserved — new uploads will be blocked only once your total usage exceeds the base quota.'
      : 'Each add-on gives you +2 GB for 6 months. They stack: buy multiple to reserve more space.')
    : (isExpired
      ? 'Your wedding site has been paused but is fully preserved. Reactivate to make it live again — all your photos, RSVPs, and guest blessings remain safe.'
      : 'Renewing keeps all premium features and uninterrupted access for your guests.')

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"/><title>${escape(subject)}</title></head>
<body style="margin:0;padding:0;background:#ffffff;font-family:Inter,-apple-system,BlinkMacSystemFont,sans-serif;color:#3a3a3a">
  <div style="max-width:560px;margin:0 auto;padding:24px 16px">
    <div style="text-align:center;padding:8px 0 24px">
      <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:28px;font-weight:700;color:#001F3F;margin:0">VowZ</h1>
      <p style="font-size:12px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;margin:4px 0 0">Beautiful Wedding Websites</p>
    </div>
    <div style="background:#FAFAF7;border:1px solid #EFE7D2;border-radius:12px;padding:32px 28px">
      <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#001F3F;margin:0 0 16px">${escape(heading)}</h2>
      <p style="font-size:15px;line-height:1.6;margin:0 0 16px">${intro}</p>
      <div style="text-align:center;margin:32px 0">
        <a href="${ctaHref}" style="background:#D4AF37;color:#001F3F;padding:12px 28px;border-radius:8px;font-size:15px;font-weight:600;text-decoration:none;display:inline-block">${ctaLabel}</a>
      </div>
      <p style="font-size:13px;color:#6b6b6b;line-height:1.5;margin:16px 0 0;text-align:center">${muted}</p>
    </div>
    <hr style="border:none;border-top:1px solid #EFE7D2;margin:32px 0 16px"/>
    <p style="font-size:12px;color:#999;text-align:center;margin:0">VowZ by AXPIR Tech India LLP · <a href="https://vowz.me" style="color:#D4AF37;text-decoration:none">vowz.me</a></p>
  </div>
</body></html>`

  const text = `${heading}\n\n${intro.replace(/<[^>]+>/g, '')}\n\n${ctaLabel}: ${ctaHref}\n\n${muted}\n\n— VowZ`
  return { html, text, subject }
}

async function enqueueExpiryEmail(
  admin: ReturnType<typeof createClient>,
  toEmail: string,
  name: string,
  daysLeft: number,
  expiresAt: string,
  product: ProductKind = 'premium',
) {
  const { html, text, subject } = renderEmail(name, daysLeft, expiresAt, product)
  const messageId = crypto.randomUUID()
  const prefix = product === 'storage_addon' ? 'storage_addon' : 'subscription'
  const label = daysLeft <= 0 ? `${prefix}_expired` : `${prefix}_expiry_${daysLeft}d`

  try {
    const result = await sendRawEmail({
      to: toEmail,
      subject,
      html,
      text,
      label,
      idempotencyKey: messageId,
    })
    const { error: logError } = await admin.from('email_send_log').insert({
      message_id: messageId,
      template_name: label,
      recipient_email: toEmail,
      status: result.sent ? 'sent' : 'suppressed',
    })
    if (logError) console.error('email_send_log insert failed', logError.message)
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e)
    const { error: logError } = await admin.from('email_send_log').insert({
      message_id: messageId,
      template_name: label,
      recipient_email: toEmail,
      status: 'failed',
      error_message: message.slice(0, 1000),
    })
    if (logError) console.error('email_send_log insert failed', logError.message)
    console.error('Expiry email send failed', message)
  }
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  // Auth: require either the service-role key or a configured CRON_SECRET
  // in the Authorization header. This function performs destructive admin
  // operations and must never be callable anonymously.
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '').trim()
  const allowed = new Set<string>([SERVICE_KEY])
  if (CRON_SECRET) allowed.add(CRON_SECRET)
  if (!token || !allowed.has(token)) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const summary = {
    processed: 0,
    sent_30d: 0,
    sent_14d: 0,
    sent_3d: 0,
    expired: 0,
    sites_paused: 0,
    addons_processed: 0,
    addons_sent_30d: 0,
    addons_sent_7d: 0,
    addons_expired_notified: 0,
    addons_expired: 0,
    errors: [] as string[],
  }

  try {
    // 1. Storage add-on reminders + expiry
    const addonHorizon = new Date(Date.now() + 31 * 86400000).toISOString()
    const { data: activeAddons, error: activeAddonErr } = await admin
      .from('user_storage_addons')
      .select('id, user_id, expires_at, status, metadata')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lte('expires_at', addonHorizon)
    if (activeAddonErr) summary.errors.push(`addons_read: ${activeAddonErr.message}`)

    for (const addon of (activeAddons || []) as SubRow[]) {
      summary.addons_processed++
      try {
        const days = daysBetween(addon.expires_at)
        const meta = (addon.metadata || {}) as Record<string, any>
        const { data: profile } = await admin
          .from('profiles')
          .select('email, full_name')
          .eq('id', addon.user_id)
          .maybeSingle()
        if (!profile?.email) continue
        const name = (profile.full_name as string | null)?.trim() || 'there'

        if (days <= 0) {
          await admin.from('user_storage_addons')
            .update({ status: 'expired', metadata: { ...meta, expired_notified_at: new Date().toISOString() } })
            .eq('id', addon.id)
          await enqueueExpiryEmail(admin, profile.email, name, 0, addon.expires_at, 'storage_addon')
          summary.addons_expired++
          summary.addons_expired_notified++
        } else if (days <= 7 && !meta.notified_7d) {
          await enqueueExpiryEmail(admin, profile.email, name, days, addon.expires_at, 'storage_addon')
          await admin.from('user_storage_addons')
            .update({ metadata: { ...meta, notified_7d: new Date().toISOString() } })
            .eq('id', addon.id)
          summary.addons_sent_7d++
        } else if (days <= 30 && days > 7 && !meta.notified_30d) {
          await enqueueExpiryEmail(admin, profile.email, name, days, addon.expires_at, 'storage_addon')
          await admin.from('user_storage_addons')
            .update({ metadata: { ...meta, notified_30d: new Date().toISOString() } })
            .eq('id', addon.id)
          summary.addons_sent_30d++
        }
      } catch (innerErr) {
        const msg = innerErr instanceof Error ? innerErr.message : String(innerErr)
        summary.errors.push(`addon ${addon.id}: ${msg}`)
      }
    }

    // 2. Active subs expiring within 15 days (or already past)
    const horizon = new Date(Date.now() + 31 * 86400000).toISOString()
    const { data: subs, error: subErr } = await admin
      .from('user_subscriptions')
      .select('id, user_id, expires_at, status, metadata')
      .eq('status', 'active')
      .not('expires_at', 'is', null)
      .lte('expires_at', horizon)

    if (subErr) throw subErr

    for (const sub of (subs || []) as SubRow[]) {
      summary.processed++
      try {
        const days = daysBetween(sub.expires_at)
        const meta = sub.metadata || {}

        const { data: profile } = await admin
          .from('profiles')
          .select('email, full_name')
          .eq('id', sub.user_id)
          .maybeSingle()

        if (!profile?.email) continue
        const name = profile.full_name?.trim() || 'there'

        if (days <= 0) {
          await admin.from('user_subscriptions')
            .update({ status: 'expired', metadata: { ...meta, expired_notified_at: new Date().toISOString() } })
            .eq('id', sub.id)

          const { data: paused } = await admin.from('wedding_sites')
            .update({ status: 'paused' })
            .eq('user_id', sub.user_id)
            .eq('status', 'active')
            .select('id')
          summary.sites_paused += paused?.length || 0

          await enqueueExpiryEmail(admin, profile.email, name, 0, sub.expires_at)
          summary.expired++
        } else if (days <= 3 && !meta.notified_3d) {
          await enqueueExpiryEmail(admin, profile.email, name, days, sub.expires_at)
          await admin.from('user_subscriptions')
            .update({ metadata: { ...meta, notified_3d: new Date().toISOString() } })
            .eq('id', sub.id)
          summary.sent_3d++
        } else if (days <= 14 && days > 3 && !meta.notified_14d) {
          await enqueueExpiryEmail(admin, profile.email, name, days, sub.expires_at)
          await admin.from('user_subscriptions')
            .update({ metadata: { ...meta, notified_14d: new Date().toISOString() } })
            .eq('id', sub.id)
          summary.sent_14d++
        } else if (days <= 30 && days > 14 && !meta.notified_30d) {
          await enqueueExpiryEmail(admin, profile.email, name, days, sub.expires_at)
          await admin.from('user_subscriptions')
            .update({ metadata: { ...meta, notified_30d: new Date().toISOString() } })
            .eq('id', sub.id)
          summary.sent_30d++
        }
      } catch (innerErr) {
        const msg = innerErr instanceof Error ? innerErr.message : String(innerErr)
        summary.errors.push(`sub ${sub.id}: ${msg}`)
      }
    }

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return new Response(JSON.stringify({ error: msg, summary }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})
