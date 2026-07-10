/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  name?: string
  plan?: string
  amount?: string
  currency?: string
  paymentId?: string
  paidOn?: string
  expiresOn?: string
  dashboardUrl?: string
}

const PaymentReceiptEmail = ({ name, plan, amount, currency, paymentId, paidOn, expiresOn, dashboardUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment received — your VowZ premium is active</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://qkjuywqrncsbxjzwtlzm.supabase.co/storage/v1/object/public/email-assets/vowz-logo.png" width="120" height="40" alt="VowZ" style={logo} />
        <Heading style={h1}>Payment received ✨</Heading>
        <Text style={text}>Hi {name?.trim() || 'there'},</Text>
        <Text style={text}>Thanks for upgrading — your VowZ premium is now active.</Text>
        <Section style={card}>
          {plan && <Text style={cardRow}><span style={label}>Plan</span><span style={value}>{plan}</span></Text>}
          {amount && <Text style={cardRow}><span style={label}>Amount</span><span style={value}>{currency || ''} {amount}</span></Text>}
          {paidOn && <Text style={cardRow}><span style={label}>Paid on</span><span style={value}>{paidOn}</span></Text>}
          {expiresOn && <Text style={cardRow}><span style={label}>Renews / expires</span><span style={value}>{expiresOn}</span></Text>}
          {paymentId && <Text style={cardRow}><span style={label}>Payment ID</span><span style={value}>{paymentId}</span></Text>}
        </Section>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button style={button} href={dashboardUrl || 'https://vowz.me/dashboard'}>Go to dashboard</Button>
        </Section>
        <Hr style={divider} />
        <Text style={footer}>Sent with love via VowZ · beautiful wedding websites.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: PaymentReceiptEmail,
  subject: (d: Props) => `Payment received — VowZ ${d?.plan || 'Premium'} is active`,
  displayName: 'Payment Receipt',
  previewData: { name: 'Priya', plan: 'Premium (Yearly)', amount: '999', currency: '₹', paymentId: 'pay_ABC123XYZ', paidOn: 'July 10, 2026', expiresOn: 'July 10, 2027', dashboardUrl: 'https://vowz.me/dashboard' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '520px', margin: '0 auto' }
const logo = { margin: '0 0 24px' }
const h1 = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: '700' as const, color: '#001F3F', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4A6A8A', lineHeight: '1.6', margin: '0 0 16px' }
const card = { backgroundColor: '#FAF7F0', border: '1px solid #E8E0D4', borderRadius: '12px', padding: '20px 24px', margin: '20px 0 8px' }
const cardRow = { margin: '6px 0', fontSize: '14px', color: '#001F3F', display: 'block' as const }
const label = { color: '#B8943E', fontWeight: '600' as const, marginRight: '10px', textTransform: 'uppercase' as const, fontSize: '11px', letterSpacing: '1px' }
const value = { color: '#001F3F' }
const button = { backgroundColor: '#001F3F', color: '#F5F0E8', fontSize: '15px', fontWeight: '500' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const divider = { borderColor: '#E8E0D4', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5', textAlign: 'center' as const }