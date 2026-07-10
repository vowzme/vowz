// Runtime-resolved email branding. Templates call `resolveBrand(props._brand)`
// so the send-transactional-email function can override defaults per project.

export interface EmailBrand {
  logoUrl: string
  primaryColor: string
  accentColor: string
  buttonTextColor: string
  fromName: string
  footerText: string
}

export const DEFAULT_BRAND: EmailBrand = {
  logoUrl:
    'https://qkjuywqrncsbxjzwtlzm.supabase.co/storage/v1/object/public/email-assets/vowz-logo.png',
  primaryColor: '#001F3F',
  accentColor: '#B8943E',
  buttonTextColor: '#F5F0E8',
  fromName: 'vowz',
  footerText: 'Sent with love via VowZ · beautiful wedding websites.',
}

export function resolveBrand(input?: Partial<EmailBrand> | null): EmailBrand {
  return { ...DEFAULT_BRAND, ...(input || {}) }
}