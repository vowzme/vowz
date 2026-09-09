/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'
import { resolveBrand, type EmailBrand } from './brand.ts'

interface Props {
  name?: string
  score?: number
  daysLeft?: number | null
  guests?: number
  budget?: number
  splitLines?: string[]
  timelineLines?: string[]
  gaps?: string[]
  rituals?: string[]
  weekly?: boolean
  reportUrl?: string
  _brand?: Partial<EmailBrand>
}

const List = ({ items, color }: { items?: string[]; color: string }) =>
  items && items.length ? (
    <Section style={{ margin: '0 0 18px' }}>
      {items.slice(0, 8).map((line, i) => (
        <Text key={i} style={{ ...text, margin: '0 0 6px' }}>
          <span style={{ color }}>•</span> {line}
        </Text>
      ))}
    </Section>
  ) : null

const WeddingReportEmail = ({
  name, score, daysLeft, guests, budget, splitLines, timelineLines, gaps, rituals, weekly, reportUrl, _brand,
}: Props) => {
  const b = resolveBrand(_brand)
  const heading = weekly ? 'This week on your wedding plan' : 'Your Wedding Intelligence Report'
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{weekly ? 'A short weekly nudge for your wedding planning' : 'Your personalised wedding readiness report'}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Img src={b.logoUrl} width="120" height="40" alt={b.fromName} style={logo} />
          <Heading style={{ ...h1, color: b.primaryColor }}>{heading}</Heading>
          <Text style={text}>Hi {name?.trim() || 'there'},</Text>
          {typeof score === 'number' && (
            <Text style={text}>
              Your wedding readiness score is <strong>{score}/100</strong>
              {typeof daysLeft === 'number' ? ` with about ${daysLeft} days to go` : ''}
              {guests ? `, planning for around ${guests} guests` : ''}
              {budget ? ` on a budget of ₹${Math.round(budget).toLocaleString('en-IN')}` : ''}.
            </Text>
          )}

          {splitLines?.length ? <Text style={h2}>Where the money goes</Text> : null}
          <List items={splitLines} color={b.accentColor} />

          {timelineLines?.length ? <Text style={h2}>What to do next</Text> : null}
          <List items={timelineLines} color={b.accentColor} />

          {gaps?.length ? <Text style={h2}>Gaps worth closing</Text> : null}
          <List items={gaps} color={b.accentColor} />

          {rituals?.length ? <Text style={h2}>Ceremonies your guests will ask about</Text> : null}
          <List items={rituals} color={b.accentColor} />

          <Section style={{ textAlign: 'center', margin: '28px 0' }}>
            <Button style={{ ...button, backgroundColor: b.primaryColor, color: b.buttonTextColor }} href={reportUrl || 'https://vowz.me/wedding-report'}>
              {weekly ? 'Update your plan' : 'Build your wedding website'}
            </Button>
          </Section>
          <Hr style={divider} />
          <Text style={footer}>{b.footerText}</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const template = {
  component: WeddingReportEmail,
  subject: (d: Props) => (d?.weekly ? 'Your weekly wedding planning summary' : 'Your Wedding Intelligence Report'),
  displayName: 'Wedding Intelligence Report',
  previewData: {
    name: 'Priya',
    score: 68,
    daysLeft: 120,
    guests: 300,
    budget: 1500000,
    splitLines: ['Venue & catering — ₹7,50,000', 'Decor — ₹2,25,000'],
    timelineLines: ['4 months out: lock the photographer', '2 months out: send RSVPs'],
    gaps: ['No single link for your guests yet.'],
    rituals: ['🌼 Haldi — turmeric blessing before the wedding'],
    reportUrl: 'https://vowz.me/wedding-report',
  },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '560px', margin: '0 auto' }
const logo = { margin: '0 0 24px' }
const h1 = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: '700' as const, color: '#001F3F', margin: '0 0 20px' }
const h2 = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '17px', fontWeight: '700' as const, color: '#001F3F', margin: '18px 0 8px' }
const text = { fontSize: '15px', color: '#4A6A8A', lineHeight: '1.6', margin: '0 0 16px' }
const button = { backgroundColor: '#001F3F', color: '#F5F0E8', fontSize: '15px', fontWeight: '500' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const divider = { borderColor: '#E8E0D4', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5', textAlign: 'center' as const }
