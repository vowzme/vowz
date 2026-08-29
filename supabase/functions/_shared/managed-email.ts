import { EmailAPIError, sendLovableEmail } from 'npm:@lovable.dev/email-js@0.1.0'

// Server-only: reads LOVABLE_API_KEY. Import from edge functions only.
// Use this for feature senders that compose their own HTML at send time.
// Registered templates should go through
// `_shared/transactional-email-templates/send-email.ts` instead.

const SENDER_DOMAIN = 'notify.vowz.me'
const FROM_DOMAIN = 'vowz.me'

export type RawEmailResult =
  | { sent: true }
  | { sent: false; reason: 'recipient_suppressed' }

export interface RawEmailInput {
  to: string
  /** Display name shown before the sender address. Defaults to "VowZ". */
  fromName?: string
  subject: string
  html: string
  text?: string
  /** Short machine label for the send (used in delivery logs). */
  label: string
  idempotencyKey?: string
  replyTo?: string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

/**
 * Sends one email through Lovable's managed email API.
 * Suppression, retries, rate limits and unsubscribe are enforced by Lovable.
 * A suppressed recipient resolves `{ sent: false }`; every other failure throws.
 */
export async function sendRawEmail(input: RawEmailInput): Promise<RawEmailResult> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY')
  if (!apiKey) throw new Error('LOVABLE_API_KEY is not configured')

  const payload = {
    to: input.to,
    from: `${input.fromName || 'VowZ'} <noreply@${FROM_DOMAIN}>`,
    sender_domain: SENDER_DOMAIN,
    subject: input.subject,
    html: input.html,
    text: input.text,
    purpose: 'transactional' as const,
    label: input.label,
    idempotency_key: input.idempotencyKey || crypto.randomUUID(),
    reply_to: input.replyTo,
  }
  const options = { apiKey, sendUrl: Deno.env.get('LOVABLE_SEND_URL') }

  try {
    await sendLovableEmail(payload, options)
  } catch (error) {
    if (error instanceof EmailAPIError && error.code === 'recipient_suppressed') {
      return { sent: false, reason: 'recipient_suppressed' }
    }
    // Rate limited: honour the API's retry-after once before giving up.
    if (error instanceof EmailAPIError && error.status === 429) {
      await sleep((error.retryAfterSeconds ?? 60) * 1000)
      try {
        await sendLovableEmail(payload, options)
        return { sent: true }
      } catch (retryError) {
        if (
          retryError instanceof EmailAPIError &&
          retryError.code === 'recipient_suppressed'
        ) {
          return { sent: false, reason: 'recipient_suppressed' }
        }
        throw retryError
      }
    }
    throw error
  }

  return { sent: true }
}
