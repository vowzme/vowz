/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { resolveBrand, type EmailBrand } from './brand.ts'

interface Props { name?: string; daysLeft?: number; upgradeUrl?: string; _brand?: Partial<EmailBrand> }

const TrialEndingEmail = ({ name, daysLeft, upgradeUrl, _brand }: Props) => {
  const days = typeof daysLeft === 'number' ? daysLeft : 2
  const b = resolveBrand(_brand)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your VowZ trial ends in {days} day{days === 1 ? '' : 's'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={b.logoUrl} width="120" height="40" alt={b.fromName} style={logo} />
          <Heading style={{ ...h1, color: b.primaryColor }}>Your trial ends soon</Heading>
          <Text style={text}>Hi {name?.trim() || 'there'},</Text>
          <Text style={text}>
            Your VowZ free trial ends in <strong>{days} day{days === 1 ? '' : 's'}</strong>. Upgrade to keep your site live,
            unlock premium templates, and continue sharing your story.
          </Text>
          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={{ ...button, backgroundColor: b.primaryColor, color: b.buttonTextColor }} href={upgradeUrl || 'https://vowz.me/pricing'}>Upgrade to premium</Button>
          </Section>
          <Hr style={divider} />
          <Text style={footer}>{b.footerText}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: TrialEndingEmail,
  subject: (d: Props) => `Your VowZ trial ends in ${d?.daysLeft ?? 2} day${(d?.daysLeft ?? 2) === 1 ? '' : 's'}`,
  displayName: 'Trial Ending',
  previewData: { name: 'Priya', daysLeft: 2, upgradeUrl: 'https://vowz.me/pricing' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '520px', margin: '0 auto' }
const logo = { margin: '0 0 24px' }
const h1 = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: '700' as const, color: '#001F3F', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4A6A8A', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#001F3F', color: '#F5F0E8', fontSize: '15px', fontWeight: '500' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const divider = { borderColor: '#E8E0D4', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5', textAlign: 'center' as const }