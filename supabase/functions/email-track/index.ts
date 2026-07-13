/// <reference lib="deno.ns" />
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// 1x1 transparent GIF
const PIXEL = Uint8Array.from([
  0x47,0x49,0x46,0x38,0x39,0x61,0x01,0x00,0x01,0x00,0x80,0x00,0x00,0xff,0xff,0xff,
  0x00,0x00,0x00,0x21,0xf9,0x04,0x01,0x00,0x00,0x00,0x00,0x2c,0x00,0x00,0x00,0x00,
  0x01,0x00,0x01,0x00,0x00,0x02,0x02,0x44,0x01,0x00,0x3b,
])

Deno.serve(async (req) => {
  const url = new URL(req.url)
  // Path shape: /email-track/open or /email-track/click
  const isOpen = url.pathname.endsWith('/open')
  const isClick = url.pathname.endsWith('/click')
  const m = url.searchParams.get('m') || ''
  const v = (url.searchParams.get('v') || 'A').toUpperCase() === 'B' ? 'B' : 'A'
  const t = url.searchParams.get('t') || 'unknown'
  const target = url.searchParams.get('u') || 'https://vowz.me/dashboard'

  const admin = createClient(SUPABASE_URL, SERVICE_KEY)
  if (m && (isOpen || isClick)) {
    try {
      await admin.from('email_ab_events').insert({
        message_id: m,
        template_name: t,
        variant: v,
        event_type: isOpen ? 'open' : 'click',
        url: isClick ? target : null,
      })
    } catch (_) { /* swallow */ }
  }

  if (isClick) {
    let safe = target
    try {
      const u = new URL(target)
      const allowedHosts = new Set([
        'vowz.me',
        'www.vowz.me',
        'vowz.lovable.app',
      ])
      const isAllowed =
        /^https?:$/.test(u.protocol) &&
        (allowedHosts.has(u.hostname) || u.hostname.endsWith('.vowz.me'))
      if (!isAllowed) safe = 'https://vowz.me/dashboard'
    } catch { safe = 'https://vowz.me/dashboard' }
    return new Response(null, { status: 302, headers: { Location: safe } })
  }

  return new Response(PIXEL, {
    headers: {
      'Content-Type': 'image/gif',
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      'Pragma': 'no-cache',
    },
  })
})