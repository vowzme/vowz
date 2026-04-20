/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import * as React from 'npm:react@18.3.1'
import { renderAsync } from 'npm:@react-email/render@0.0.17'
import { SubscriptionExpiryEmail } from '../_shared/email-templates/subscription-expiry.tsx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface SubRow {
  id: string
  user_id: string
  expires_at: string
  status: string
  metadata: Record<string, any> | null
}

function daysBetween(future: string): number {
  const ms = new Date(future).getTime() - Date.now()
  return Math.floor(ms / (1000 * 60 * 60 * 24))
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
}

async function enqueueExpiryEmail(
  admin: ReturnType<typeof createClient>,
  toEmail: string,
  recipientName: string,
  daysLeft: number,
  expiresAt: string,
) {
  const props = { recipientName, daysLeft, expiresAt: fmtDate(expiresAt) }
  const html = await renderAsync(React.createElement(SubscriptionExpiryEmail, props))
  const text = await renderAsync(React.createElement(SubscriptionExpiryEmail, props), { plainText: true })
  const messageId = crypto.randomUUID()
  const label = daysLeft <= 0 ? 'subscription_expired' : `subscription_expiry_${daysLeft}d`
  const subject = daysLeft <= 0
    ? 'Your VowZ Premium has expired — site paused'
    : daysLeft <= 3
      ? `⚠️ Only ${daysLeft} days left on your VowZ Premium`
      : `Your VowZ Premium expires in ${daysLeft} days`

  await admin.from('email_send_log').insert({
    message_id: messageId,
    template_name: label,
    recipient_email: toEmail,
    status: 'pending',
  })

  await admin.rpc('enqueue_email', {
    queue_name: 'transactional_emails',
    payload: {
      message_id: messageId,
      to: toEmail,
      from: 'VowZ <noreply@vowz.me>',
      sender_domain: 'notify.vowz.me',
      subject,
      html,
      text,
      purpose: 'transactional',
      label,
      queued_at: new Date().toISOString(),
    },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  const summary = { processed: 0, sent_14d: 0, sent_3d: 0, expired: 0, sites_paused: 0, addons_expired: 0, errors: [] as string[] }

  try {
    // 1. Expire storage addons whose time has passed
    const { data: addons, error: addonErr } = await admin
      .from('user_storage_addons')
      .update({ status: 'expired' })
      .eq('status', 'active')
      .lt('expires_at', new Date().toISOString())
      .select('id')
    if (addonErr) summary.errors.push(`addons: ${addonErr.message}`)
    else summary.addons_expired = addons?.length || 0

    // 2. Fetch active subs with an expiry date in the next 15 days OR already expired
    const horizon = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString()
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
          // Mark expired + pause user's active sites + send final email
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
