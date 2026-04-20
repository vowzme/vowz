/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'
import {
  Body, Container, Head, Heading, Html, Preview, Section, Text, Link, Hr,
} from 'npm:@react-email/components@0.0.22'

interface ExpiryEmailProps {
  recipientName?: string
  daysLeft: number // 14, 3, or 0
  expiresAt: string
  renewUrl?: string
}

export const SubscriptionExpiryEmail = ({
  recipientName = 'there',
  daysLeft,
  expiresAt,
  renewUrl = 'https://vowz.me/pricing',
}: ExpiryEmailProps) => {
  const isExpired = daysLeft <= 0
  const isUrgent = daysLeft <= 3 && daysLeft > 0

  const heading = isExpired
    ? 'Your VowZ Premium has expired'
    : isUrgent
      ? `Only ${daysLeft} days left on your VowZ Premium`
      : `Your VowZ Premium expires in ${daysLeft} days`

  const intro = isExpired
    ? `Hi ${recipientName}, your VowZ Premium subscription ended on ${expiresAt}. To keep your wedding website live and accessible to guests, your site has been temporarily paused. Renew anytime to bring it back instantly.`
    : isUrgent
      ? `Hi ${recipientName}, just a friendly heads-up — your VowZ Premium expires on ${expiresAt}. Renew now to avoid any interruption to your wedding website.`
      : `Hi ${recipientName}, your VowZ Premium subscription is set to expire on ${expiresAt}. Renew early to keep enjoying premium features without interruption.`

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{heading}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={header}>
            <Heading style={h1}>VowZ</Heading>
            <Text style={tagline}>Beautiful Wedding Websites</Text>
          </Section>

          <Section style={card}>
            <Heading style={h2}>{heading}</Heading>
            <Text style={text}>{intro}</Text>

            <Section style={{ textAlign: 'center', margin: '32px 0' }}>
              <Link href={renewUrl} style={button}>
                {isExpired ? 'Reactivate Premium' : 'Renew Now'}
              </Link>
            </Section>

            {isExpired ? (
              <Text style={muted}>
                Your wedding site has been paused but is fully preserved. Reactivate to make it live again — all your photos, RSVPs, and guest blessings remain safe.
              </Text>
            ) : (
              <Text style={muted}>
                Renewing keeps your custom domain, all premium features, and uninterrupted access for your guests.
              </Text>
            )}
          </Section>

          <Hr style={hr} />
          <Text style={footer}>
            VowZ by AXPIR Tech India LLP · <Link href="https://vowz.me" style={footerLink}>vowz.me</Link>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export default SubscriptionExpiryEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif' }
const container = { margin: '0 auto', padding: '24px 16px', maxWidth: '560px' }
const header = { textAlign: 'center' as const, padding: '8px 0 24px' }
const h1 = { fontSize: '28px', fontWeight: 700, color: '#001F3F', margin: 0, fontFamily: 'Playfair Display, Georgia, serif' }
const tagline = { fontSize: '12px', color: '#D4AF37', letterSpacing: '2px', textTransform: 'uppercase' as const, margin: '4px 0 0' }
const card = { backgroundColor: '#FAFAF7', border: '1px solid #EFE7D2', borderRadius: '12px', padding: '32px 28px' }
const h2 = { fontSize: '20px', fontWeight: 700, color: '#001F3F', margin: '0 0 16px', fontFamily: 'Playfair Display, Georgia, serif' }
const text = { fontSize: '15px', color: '#3a3a3a', lineHeight: '1.6', margin: '0 0 16px' }
const muted = { fontSize: '13px', color: '#6b6b6b', lineHeight: '1.5', margin: '16px 0 0', textAlign: 'center' as const }
const button = { backgroundColor: '#D4AF37', color: '#001F3F', padding: '12px 28px', borderRadius: '8px', fontSize: '15px', fontWeight: 600, textDecoration: 'none', display: 'inline-block' }
const hr = { borderColor: '#EFE7D2', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999', textAlign: 'center' as const, margin: 0 }
const footerLink = { color: '#D4AF37', textDecoration: 'none' }
