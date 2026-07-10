/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Hr, Html, Img, Preview, Section, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

interface Props {
  inviteeName?: string
  inviterName?: string
  coupleNames?: string
  role?: string
  canEdit?: boolean
  inviteUrl?: string
}

const FamilyInviteEmail = ({ inviteeName, inviterName, coupleNames, role, canEdit, inviteUrl }: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to help with {coupleNames || 'a wedding'} on VowZ</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img src="https://qkjuywqrncsbxjzwtlzm.supabase.co/storage/v1/object/public/email-assets/vowz-logo.png" width="120" height="40" alt="VowZ" style={logo} />
        <Heading style={h1}>You're invited 💌</Heading>
        <Text style={text}>Hi {inviteeName?.trim() || 'there'},</Text>
        <Text style={text}>
          {inviterName || 'A family member'} has invited you to {canEdit ? 'help edit' : 'view'} the wedding site for
          {' '}<strong>{coupleNames || 'their wedding'}</strong>{role ? ` as ${role}` : ''}.
        </Text>
        <Section style={{ textAlign: 'center', margin: '28px 0' }}>
          <Button style={button} href={inviteUrl || 'https://vowz.me'}>{canEdit ? 'Open & edit' : 'View wedding site'}</Button>
        </Section>
        <Text style={hint}>This link is personal to you — please don't share it.</Text>
        <Hr style={divider} />
        <Text style={footer}>Sent with love via VowZ · beautiful wedding websites.</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: FamilyInviteEmail,
  subject: (d: Props) => `You're invited to ${d?.coupleNames || 'a wedding'} on VowZ`,
  displayName: 'Family Invite',
  previewData: { inviteeName: 'Aarav', inviterName: 'Priya', coupleNames: 'Priya & Rohan', role: 'Best Man', canEdit: true, inviteUrl: 'https://vowz.me/invite/xyz' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'Inter', Arial, sans-serif" }
const container = { padding: '40px 30px', maxWidth: '520px', margin: '0 auto' }
const logo = { margin: '0 0 24px' }
const h1 = { fontFamily: "'Playfair Display', Georgia, serif", fontSize: '24px', fontWeight: '700' as const, color: '#001F3F', margin: '0 0 20px' }
const text = { fontSize: '15px', color: '#4A6A8A', lineHeight: '1.6', margin: '0 0 16px' }
const hint = { fontSize: '12px', color: '#999999', margin: '8px 0 0', textAlign: 'center' as const }
const button = { backgroundColor: '#001F3F', color: '#F5F0E8', fontSize: '15px', fontWeight: '500' as const, borderRadius: '12px', padding: '14px 28px', textDecoration: 'none' }
const divider = { borderColor: '#E8E0D4', margin: '32px 0 16px' }
const footer = { fontSize: '12px', color: '#999999', margin: '0', lineHeight: '1.5', textAlign: 'center' as const }