import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { buildCors } from '../_shared/cors.ts'
import { sendTemplateEmail } from '../_shared/transactional-email-templates/send-email.ts'
import { TEMPLATES } from '../_shared/transactional-email-templates/registry.ts'

// Admin-only: retries a previously failed app email from the monitoring page.

Deno.serve(async (req) => {
  const corsHeaders = buildCors(req)
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders })

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Unauthorized' }, 401)

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await anonClient.auth.getUser()
    if (!caller) return json({ error: 'Unauthorized' }, 401)
    const { data: isAdmin } = await anonClient.rpc('is_admin', { _user_id: caller.id })
    if (!isAdmin) return json({ error: 'Forbidden' }, 403)

    const body = await req.json().catch(() => ({}))
    const templateName = String(body.templateName ?? '')
    const recipientEmail = String(body.recipientEmail ?? '').trim().toLowerCase()
    const idempotencyKey = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : undefined
    const templateData = (body.templateData ?? {}) as Record<string, unknown>

    if (!TEMPLATES[templateName]) return json({ error: 'Unknown template' }, 400)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipientEmail)) {
      return json({ error: 'Valid recipientEmail is required' }, 400)
    }

    const admin = createClient(supabaseUrl, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    // This action only retries mail the app already tried to send. The recipient
    // must already appear in the send log, so it cannot be used to mail strangers.
    const { count: knownRecipient } = await admin
      .from('email_send_log')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_email', recipientEmail)
    if (!knownRecipient) {
      return json({ error: 'This address has no previous email from this app, so it cannot be resent.' }, 403)
    }

    const messageId = crypto.randomUUID()

    try {
      const result = await sendTemplateEmail(templateName, recipientEmail, {
        templateData,
        idempotencyKey,
      })
      const { error: logError } = await admin.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipientEmail,
        status: result.sent ? 'sent' : 'suppressed',
      })
      if (logError) console.error('email_send_log insert failed', logError.message)
      return json({ success: result.sent, reason: result.sent ? undefined : result.reason })
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      const { error: logError } = await admin.from('email_send_log').insert({
        message_id: messageId,
        template_name: templateName,
        recipient_email: recipientEmail,
        status: 'failed',
        error_message: message.slice(0, 1000),
      })
      if (logError) console.error('email_send_log insert failed', logError.message)
      return json({ error: message }, 500)
    }
  } catch (e) {
    console.error('admin-resend-email error', e instanceof Error ? e.message : String(e))
    return json({ error: 'Unexpected error' }, 500)
  }
})
