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
  Text,
} from 'npm:@react-email/components@0.0.22'

interface MagicLinkEmailProps {
  siteName: string
  confirmationUrl: string
}

export const MagicLinkEmail = ({
  siteName,
  confirmationUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your VowZ sign-in link</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src="https://qkjuywqrncsbxjzwtlzm.supabase.co/storage/v1/object/public/email-assets/vowz-logo.png"
          width="120"
          height="40"
          alt="VowZ"
          style={logo}
        />
        <Heading style={h1}>Your sign-in link</Heading>
        <Text style={text}>
          Click below to sign in to VowZ. This link will expire shortly for
          your security.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Sign in
        </Button>
        <Hr style={divider} />
        <Text style={footer}>
          If you didn't request this link, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '480px', margin: '0 auto' }
const logo = { margin: '0 0 24px' }
const h1 = {
  fontFamily: "'Playfair Display', Georgia, serif",
  fontSize: '24px',
  fontWeight: '700' as const,
  color: '#001F3F',
  margin: '0 0 20px',
}
const text = { fontSize: '15px', color: '#4A6A8A', lineHeight: '1.6', margin: '0 0 20px' }
const button = {
  backgroundColor: '#001F3F',
  color: '#F5F0E8',
  fontSize: '15px',
  fontWeight: '500' as const,
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
}
const divider = { borderColor: '#E8E0D4', margin: '32px 0' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5' }
