/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { resolveBrand, type EmailBrand } from './brand.ts'

interface Props {
  guestName?: string
  coupleNames?: string
  weddingDate?: string
  venue?: string
  attending?: boolean
  guestCount?: number
  siteUrl?: string
  editUrl?: string
  _brand?: Partial<EmailBrand>
}

const RsvpConfirmationEmail = ({
  guestName,
  coupleNames,
  weddingDate,
  venue,
  attending,
  guestCount,
  siteUrl,
  editUrl,
  _brand,
}: Props) => {
  const name = guestName?.trim() || 'there'
  const couple = coupleNames?.trim() || 'the happy couple'
  const isAttending = attending !== false
  const b = resolveBrand(_brand)

  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>
        {isAttending
          ? `Your RSVP is confirmed for ${couple}'s wedding`
          : `We've received your RSVP for ${couple}'s wedding`}
      </Preview>
      <Body style={main}>
        <Container style={container}>
          <Img
            src={b.logoUrl}
            width="120"
            height="40"
            alt={b.fromName}
            style={logo}
          />
          <Heading style={{ ...h1, color: b.primaryColor }}>
            {isAttending ? 'Your RSVP is confirmed 💍' : "Thanks for letting us know"}
          </Heading>
          <Text style={text}>Hi {name},</Text>
          <Text style={text}>
            {isAttending
              ? `We're delighted you'll be joining ${couple} on their special day. Your response has been recorded.`
              : `Thank you for responding. ${couple} will miss you, but truly appreciate you letting them know.`}
          </Text>

          <Section style={card}>
            {weddingDate && (
              <Text style={cardRow}>
                <span style={{ ...label, color: b.accentColor }}>Date</span>
                <span style={{ ...value, color: b.primaryColor }}>{weddingDate}</span>
              </Text>
            )}
            {venue && (
              <Text style={cardRow}>
                <span style={{ ...label, color: b.accentColor }}>Venue</span>
                <span style={{ ...value, color: b.primaryColor }}>{venue}</span>
              </Text>
            )}
            {isAttending && guestCount && guestCount > 0 && (
              <Text style={cardRow}>
                <span style={{ ...label, color: b.accentColor }}>Guests</span>
                <span style={{ ...value, color: b.primaryColor }}>{guestCount}</span>
              </Text>
            )}
          </Section>

          {siteUrl && (
            <Section style={{ textAlign: 'center', margin: '28px 0' }}>
              <Button style={{ ...button, backgroundColor: b.primaryColor, color: b.buttonTextColor }} href={siteUrl}>
                View wedding site
              </Button>
            </Section>
          )}

          {editUrl && (
            <Section style={{ textAlign: 'center', margin: '0 0 24px' }}>
              <Text style={{ ...text, textAlign: 'center', margin: '0 0 8px' }}>
                Need to change your response, meal, or headcount?
              </Text>
              <Button
                style={{
                  ...button,
                  backgroundColor: 'transparent',
                  color: b.primaryColor,
                  border: `1px solid ${b.primaryColor}`,
                  padding: '12px 24px',
                }}
                href={editUrl}
              >
                Edit your RSVP
              </Button>
            </Section>
          )}

          <Hr style={divider} />
          <Text style={footer}>
            {b.footerText}
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: RsvpConfirmationEmail,
  subject: (data: Props) =>
    data?.attending === false
      ? `RSVP received for ${data?.coupleNames || 'the wedding'}`
      : `You're confirmed for ${data?.coupleNames || 'the wedding'} 💍`,
  displayName: 'RSVP Confirmation',
  previewData: {
    guestName: 'Aarav',
    coupleNames: 'Priya & Rohan',
    weddingDate: 'Saturday, February 14, 2026',
    venue: 'The Leela Palace, Bengaluru',
    attending: true,
    guestCount: 2,
    siteUrl: 'https://vowz.me',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '520px', margin: '0 auto' }
const logo = { margin: '0 0 24px' }
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#001F3F',
  margin: '0 0 20px',
}
const text = { fontSize: '15px', color: '#4A6A8A', lineHeight: '1.6', margin: '0 0 16px' }
const card = {
  backgroundColor: '#FAF7F0',
  border: '1px solid #E8E0D4',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '20px 0 8px',
}
const cardRow = {
  margin: '6px 0',
  fontSize: '14px',
  color: '#001F3F',
  display: 'block' as const,
}
const label = { color: '#B8943E', fontWeight: '600' as const, marginRight: '10px', textTransform: 'uppercase' as const, fontSize: '11px', letterSpacing: '1px' }
const value = { color: '#001F3F' }
const button = {
  backgroundColor: '#001F3F',
  color: '#F5F0E8',
  fontSize: '15px',
  fontWeight: '500' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const divider = { borderColor: '#E8E0D4', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5', textAlign: 'center' as const }