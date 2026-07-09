/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Row,
  Column,
} from 'npm:@react-email/components@0.0.22'

interface PaymentSuccessEmailProps {
  recipientName: string
  recipientEmail: string
  orderId: string
  paymentId: string
  plan: string
  amount: string
  currency: string
  paymentDate: string
  expiresAt: string
  paymentMethod?: string
}

export const PaymentSuccessEmail = ({
  recipientName = 'there',
  recipientEmail = '',
  orderId = '',
  paymentId = '',
  plan = 'Premium (1 Year)',
  amount = '₹599',
  currency = 'INR',
  paymentDate = '',
  expiresAt = '',
  paymentMethod = '',
}: PaymentSuccessEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Payment confirmed — your VowZ Premium is now active! 🎉</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://qkjuywqrncsbxjzwtlzm.supabase.co/storage/v1/object/public/email-assets/vowz-logo.png"
          width="120"
          height="40"
          alt="VowZ"
          style={logo}
        />
        <Heading style={h1}>Payment Successful! 🎉</Heading>
        <Text style={text}>
          Hey {recipientName}, your Premium plan is now active. Here are your invoice details:
        </Text>

        <Section style={invoiceBox}>
          <Text style={invoiceTitle}>Invoice</Text>
          <Hr style={invoiceDivider} />
          <Section>
            <Row style={invoiceRow}>
              <Column style={labelCol}>Plan</Column>
              <Column style={valueCol}>{plan}</Column>
            </Row>
            <Row style={invoiceRow}>
              <Column style={labelCol}>Amount Paid</Column>
              <Column style={valueCol}>{amount}</Column>
            </Row>
            <Row style={invoiceRow}>
              <Column style={labelCol}>Order ID</Column>
              <Column style={valueColMono}>{orderId}</Column>
            </Row>
            <Row style={invoiceRow}>
              <Column style={labelCol}>Payment ID</Column>
              <Column style={valueColMono}>{paymentId}</Column>
            </Row>
            {paymentMethod && (
              <Row style={invoiceRow}>
                <Column style={labelCol}>Method</Column>
                <Column style={valueCol}>{paymentMethod}</Column>
              </Row>
            )}
            <Row style={invoiceRow}>
              <Column style={labelCol}>Date</Column>
              <Column style={valueCol}>{paymentDate}</Column>
            </Row>
            <Hr style={invoiceDivider} />
            <Row style={invoiceRow}>
              <Column style={labelCol}>Valid Until</Column>
              <Column style={{ ...valueCol, fontWeight: '600', color: '#B8943E' }}>{expiresAt}</Column>
            </Row>
          </Section>
        </Section>

        <Text style={text}>
          You now have access to all premium features — advanced themes, AI
          editor, and more. Head to your{' '}
          <Link href="https://vowz.me/dashboard" style={link}>
            dashboard
          </Link>{' '}
          to start creating.
        </Text>

        <Hr style={divider} />
        <Text style={footer}>
          This is your payment receipt for VowZ Premium. If you have questions,
          reply to this email or reach out at{' '}
          <Link href="mailto:support@vowz.me" style={footerLink}>
            support@vowz.me
          </Link>
          .
        </Text>
        <Text style={footer}>
          Billed to: {recipientEmail}
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PaymentSuccessEmail

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
const text = {
  fontSize: '15px',
  color: '#4A6A8A',
  lineHeight: '1.6',
  margin: '0 0 20px',
}
const link = { color: '#B8943E', textDecoration: 'underline' }
const invoiceBox = {
  border: '1px solid #E8E0D4',
  borderRadius: '12px',
  padding: '20px 24px',
  margin: '0 0 24px',
  backgroundColor: '#FDFBF7',
}
const invoiceTitle = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '16px',
  fontWeight: '600' as const,
  color: '#001F3F',
  margin: '0 0 8px',
}
const invoiceDivider = { borderColor: '#E8E0D4', margin: '12px 0' }
const invoiceRow = { margin: '0' }
const labelCol = {
  fontSize: '13px',
  color: '#4A6A8A',
  padding: '4px 0',
  width: '140px',
  verticalAlign: 'top' as const,
}
const valueCol = {
  fontSize: '13px',
  color: '#001F3F',
  padding: '4px 0',
  fontWeight: '500' as const,
  verticalAlign: 'top' as const,
}
const valueColMono = {
  ...valueCol,
  fontFamily: "'Courier New', monospace",
  fontSize: '12px',
  wordBreak: 'break-all' as const,
}
const divider = { borderColor: '#E8E0D4', margin: '32px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0 0 4px', lineHeight: '1.5' }
const footerLink = { color: '#B8943E', textDecoration: 'underline' }
