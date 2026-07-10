import { template as rsvpConfirmation } from './rsvp-confirmation.tsx'
import { template as welcome } from './welcome.tsx'
import { template as paymentReceipt } from './payment-receipt.tsx'
import { template as familyInvite } from './family-invite.tsx'
import { template as sitePublished } from './site-published.tsx'
import { template as trialEnding } from './trial-ending.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: any) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  to?: (data: any) => string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'rsvp-confirmation': rsvpConfirmation,
  'welcome': welcome,
  'payment-receipt': paymentReceipt,
  'family-invite': familyInvite,
  'site-published': sitePublished,
  'trial-ending': trialEnding,
}