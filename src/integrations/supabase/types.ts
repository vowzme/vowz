export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      affiliate_qr_codes: {
        Row: {
          affiliate_id: string | null
          assigned_at: string | null
          assigned_by: string | null
          batch_label: string | null
          code: string
          created_at: string
          created_by: string | null
          design: string
          id: string
          last_scanned_at: string | null
          notes: string | null
          scan_count: number
          signup_count: number
          site_count: number
        }
        Insert: {
          affiliate_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          batch_label?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          design?: string
          id?: string
          last_scanned_at?: string | null
          notes?: string | null
          scan_count?: number
          signup_count?: number
          site_count?: number
        }
        Update: {
          affiliate_id?: string | null
          assigned_at?: string | null
          assigned_by?: string | null
          batch_label?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          design?: string
          id?: string
          last_scanned_at?: string | null
          notes?: string | null
          scan_count?: number
          signup_count?: number
          site_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_qr_codes_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_public_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_qr_codes_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_qr_codes_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "franchise_sub_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_id: string
          commission_amount: number
          commission_paid: boolean
          converted_at: string | null
          created_at: string
          id: string
          paid_at: string | null
          payout_status: string
          plan: string
          referred_email: string | null
          referred_user_id: string | null
          status: string
        }
        Insert: {
          affiliate_id: string
          commission_amount?: number
          commission_paid?: boolean
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payout_status?: string
          plan?: string
          referred_email?: string | null
          referred_user_id?: string | null
          status?: string
        }
        Update: {
          affiliate_id?: string
          commission_amount?: number
          commission_paid?: boolean
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          payout_status?: string
          plan?: string
          referred_email?: string | null
          referred_user_id?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_public_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "franchise_sub_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          created_at: string
          custom_coupon: string | null
          email: string
          franchise_approved: boolean
          franchise_id: string | null
          full_name: string
          id: string
          is_active: boolean
          is_franchise: boolean
          paid_earnings: number
          partner_type: string
          payout_paypal: string | null
          payout_upi: string | null
          pending_earnings: number
          phone: string | null
          referral_code: string
          shop_logo_url: string | null
          shop_name: string | null
          successful_referrals: number
          total_earnings: number
          total_referrals: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_coupon?: string | null
          email?: string
          franchise_approved?: boolean
          franchise_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_franchise?: boolean
          paid_earnings?: number
          partner_type?: string
          payout_paypal?: string | null
          payout_upi?: string | null
          pending_earnings?: number
          phone?: string | null
          referral_code: string
          shop_logo_url?: string | null
          shop_name?: string | null
          successful_referrals?: number
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_coupon?: string | null
          email?: string
          franchise_approved?: boolean
          franchise_id?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          is_franchise?: boolean
          paid_earnings?: number
          partner_type?: string
          payout_paypal?: string | null
          payout_upi?: string | null
          pending_earnings?: number
          phone?: string | null
          referral_code?: string
          shop_logo_url?: string | null
          shop_name?: string | null
          successful_referrals?: number
          total_earnings?: number
          total_referrals?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "affiliate_public_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchise_sub_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_log: {
        Row: {
          created_at: string
          function_name: string
          id: string
          model: string
          status: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          function_name: string
          id?: string
          model?: string
          status?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          function_name?: string
          id?: string
          model?: string
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      billing_terms: {
        Row: {
          id: number
          premium_months: number
          storage_months: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: number
          premium_months?: number
          storage_months?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: number
          premium_months?: number
          storage_months?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_name: string
          content: string
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          published_at: string | null
          slug: string
          status: string
          tags: Json
          title: string
          updated_at: string
        }
        Insert: {
          author_name?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string | null
          slug: string
          status?: string
          tags?: Json
          title: string
          updated_at?: string
        }
        Update: {
          author_name?: string
          content?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          published_at?: string | null
          slug?: string
          status?: string
          tags?: Json
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      card_templates: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          is_premium: boolean
          name: string
          slug: string
          sort_order: number
          thumbnail_url: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          is_premium?: boolean
          name: string
          slug: string
          sort_order?: number
          thumbnail_url?: string | null
          tier?: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          is_premium?: boolean
          name?: string
          slug?: string
          sort_order?: number
          thumbnail_url?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_id: string
          created_at: string
          currency: string
          discount_applied: number
          final_amount: number
          id: string
          original_amount: number
          user_id: string
        }
        Insert: {
          coupon_id: string
          created_at?: string
          currency?: string
          discount_applied?: number
          final_amount?: number
          id?: string
          original_amount?: number
          user_id: string
        }
        Update: {
          coupon_id?: string
          created_at?: string
          currency?: string
          discount_applied?: number
          final_amount?: number
          id?: string
          original_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          currency: string
          description: string | null
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          max_discount_cap: number | null
          max_uses: number | null
          min_order_value: number | null
          name: string
          notes: string | null
          scope: string
          status: string
          times_used: number
          updated_at: string
          usage_type: string
        }
        Insert: {
          code: string
          created_at?: string
          currency?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount_cap?: number | null
          max_uses?: number | null
          min_order_value?: number | null
          name?: string
          notes?: string | null
          scope?: string
          status?: string
          times_used?: number
          updated_at?: string
          usage_type?: string
        }
        Update: {
          code?: string
          created_at?: string
          currency?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          max_discount_cap?: number | null
          max_uses?: number | null
          min_order_value?: number | null
          name?: string
          notes?: string | null
          scope?: string
          status?: string
          times_used?: number
          updated_at?: string
          usage_type?: string
        }
        Relationships: []
      }
      dodo_webhook_events: {
        Row: {
          created_at: string
          event_id: string
          event_type: string | null
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
        }
        Insert: {
          created_at?: string
          event_id: string
          event_type?: string | null
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
        }
        Update: {
          created_at?: string
          event_id?: string
          event_type?: string | null
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
        }
        Relationships: []
      }
      email_ab_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          message_id: string
          template_name: string
          url: string | null
          user_id: string | null
          variant: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          message_id: string
          template_name: string
          url?: string | null
          user_id?: string | null
          variant: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          message_id?: string
          template_name?: string
          url?: string | null
          user_id?: string | null
          variant?: string
        }
        Relationships: []
      }
      email_branding: {
        Row: {
          accent_color: string
          button_text_color: string
          created_at: string
          footer_text: string
          from_name: string
          id: number
          logo_url: string
          primary_color: string
          updated_at: string
        }
        Insert: {
          accent_color?: string
          button_text_color?: string
          created_at?: string
          footer_text?: string
          from_name?: string
          id?: number
          logo_url?: string
          primary_color?: string
          updated_at?: string
        }
        Update: {
          accent_color?: string
          button_text_color?: string
          created_at?: string
          footer_text?: string
          from_name?: string
          id?: number
          logo_url?: string
          primary_color?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      feature_audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json
          feature_type: string
          id: string
          user_id: string
          wedding_site_id: string
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json
          feature_type: string
          id?: string
          user_id: string
          wedding_site_id: string
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json
          feature_type?: string
          id?: string
          user_id?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_audit_log_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_requests: {
        Row: {
          admin_reply: string | null
          created_at: string
          description: string
          id: string
          screenshot_url: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_reply?: string | null
          created_at?: string
          description?: string
          id?: string
          screenshot_url?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_reply?: string | null
          created_at?: string
          description?: string
          id?: string
          screenshot_url?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      franchise_commissions: {
        Row: {
          commission_amount: number
          created_at: string
          currency: string
          franchise_id: string
          id: string
          paid_at: string | null
          payout_status: string
          referral_id: string
          sub_affiliate_id: string
        }
        Insert: {
          commission_amount?: number
          created_at?: string
          currency?: string
          franchise_id: string
          id?: string
          paid_at?: string | null
          payout_status?: string
          referral_id: string
          sub_affiliate_id: string
        }
        Update: {
          commission_amount?: number
          created_at?: string
          currency?: string
          franchise_id?: string
          id?: string
          paid_at?: string | null
          payout_status?: string
          referral_id?: string
          sub_affiliate_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "franchise_commissions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "affiliate_public_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_commissions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_commissions_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchise_sub_affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "affiliate_referrals_for_affiliate"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_commissions_sub_affiliate_id_fkey"
            columns: ["sub_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_public_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_commissions_sub_affiliate_id_fkey"
            columns: ["sub_affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "franchise_commissions_sub_affiliate_id_fkey"
            columns: ["sub_affiliate_id"]
            isOneToOne: false
            referencedRelation: "franchise_sub_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_album_posts: {
        Row: {
          caption: string | null
          created_at: string
          guest_email: string | null
          guest_name: string
          id: string
          photo_url: string
          status: string
          wedding_site_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name: string
          id?: string
          photo_url: string
          status?: string
          wedding_site_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          guest_email?: string | null
          guest_name?: string
          id?: string
          photo_url?: string
          status?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_album_posts_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_album_reactions: {
        Row: {
          created_at: string
          guest_identifier: string
          id: string
          post_id: string
          reaction: string
        }
        Insert: {
          created_at?: string
          guest_identifier: string
          id?: string
          post_id: string
          reaction: string
        }
        Update: {
          created_at?: string
          guest_identifier?: string
          id?: string
          post_id?: string
          reaction?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_album_reactions_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "guest_album_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_blessings: {
        Row: {
          created_at: string
          guest_name: string
          id: string
          message: string
          owner_reply: string | null
          photo_url: string | null
          status: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          guest_name: string
          id?: string
          message: string
          owner_reply?: string | null
          photo_url?: string | null
          status?: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          guest_name?: string
          id?: string
          message?: string
          owner_reply?: string | null
          photo_url?: string | null
          status?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_blessings_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_invite_sends: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          id: string
          invite_id: string
          message_id: string | null
          recipient: string | null
          status: string
          wedding_site_id: string
        }
        Insert: {
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          invite_id: string
          message_id?: string | null
          recipient?: string | null
          status?: string
          wedding_site_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          invite_id?: string
          message_id?: string | null
          recipient?: string | null
          status?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_invite_sends_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "guest_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_invite_sends_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_invites: {
        Row: {
          created_at: string
          guest_email: string | null
          guest_group: string | null
          guest_name: string
          guest_phone: string | null
          id: string
          notes: string | null
          plus_ones_allowed: number
          rsvp_id: string | null
          tags: string[]
          token: string
          updated_at: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          guest_email?: string | null
          guest_group?: string | null
          guest_name: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          plus_ones_allowed?: number
          rsvp_id?: string | null
          tags?: string[]
          token?: string
          updated_at?: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          guest_email?: string | null
          guest_group?: string | null
          guest_name?: string
          guest_phone?: string | null
          id?: string
          notes?: string | null
          plus_ones_allowed?: number
          rsvp_id?: string | null
          tags?: string[]
          token?: string
          updated_at?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_invites_rsvp_id_fkey"
            columns: ["rsvp_id"]
            isOneToOne: false
            referencedRelation: "rsvps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guest_invites_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_moderation_events: {
        Row: {
          action: string
          actor_user_id: string | null
          created_at: string
          guest_email: string | null
          id: string
          message_id: string | null
          post_id: string | null
          wedding_site_id: string | null
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          created_at?: string
          guest_email?: string | null
          id?: string
          message_id?: string | null
          post_id?: string | null
          wedding_site_id?: string | null
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          created_at?: string
          guest_email?: string | null
          id?: string
          message_id?: string | null
          post_id?: string | null
          wedding_site_id?: string | null
        }
        Relationships: []
      }
      guest_moderation_templates: {
        Row: {
          action: string
          body_html: string | null
          created_at: string
          id: string
          subject: string | null
          updated_at: string
          wedding_site_id: string
        }
        Insert: {
          action: string
          body_html?: string | null
          created_at?: string
          id?: string
          subject?: string | null
          updated_at?: string
          wedding_site_id: string
        }
        Update: {
          action?: string
          body_html?: string | null
          created_at?: string
          id?: string
          subject?: string | null
          updated_at?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guest_moderation_templates_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      guest_notification_prefs: {
        Row: {
          created_at: string
          enabled: boolean
          id: string
          updated_at: string
          user_id: string
          wedding_site_id: string | null
        }
        Insert: {
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id: string
          wedding_site_id?: string | null
        }
        Update: {
          created_at?: string
          enabled?: boolean
          id?: string
          updated_at?: string
          user_id?: string
          wedding_site_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "guest_notification_prefs_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      guestbook: {
        Row: {
          created_at: string
          guest_name: string
          id: string
          message: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          guest_name: string
          id?: string
          message: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          guest_name?: string
          id?: string
          message?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "guestbook_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_card_variants: {
        Row: {
          created_at: string
          data: Json
          id: string
          name: string
          pages: Json
          photo_url: string | null
          reveal: string | null
          share_enabled: boolean
          share_token: string
          template_slug: string
          theme_overrides: Json
          updated_at: string
          user_id: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          pages?: Json
          photo_url?: string | null
          reveal?: string | null
          share_enabled?: boolean
          share_token?: string
          template_slug: string
          theme_overrides?: Json
          updated_at?: string
          user_id: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          name?: string
          pages?: Json
          photo_url?: string | null
          reveal?: string | null
          share_enabled?: boolean
          share_token?: string
          template_slug?: string
          theme_overrides?: Json
          updated_at?: string
          user_id?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_card_variants_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          milestone: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          milestone?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          milestone?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_config: {
        Row: {
          config: Json
          created_at: string
          id: string
          is_enabled: boolean
          provider: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          is_enabled?: boolean
          provider?: string
          updated_at?: string
        }
        Relationships: []
      }
      paypal_webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_id: string
          event_type: string
          id: string
          payload: Json
          processed: boolean
          processed_at: string | null
          resource_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_id: string
          event_type: string
          id?: string
          payload: Json
          processed?: boolean
          processed_at?: string | null
          resource_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          event_id?: string
          event_type?: string
          id?: string
          payload?: Json
          processed?: boolean
          processed_at?: string | null
          resource_id?: string | null
        }
        Relationships: []
      }
      platform_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          path: string | null
          referrer: string | null
          session_id: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
          visitor_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          path?: string | null
          referrer?: string | null
          session_id?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      poll_votes: {
        Row: {
          created_at: string
          id: string
          option_index: number
          poll_id: string
          voter_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_index: number
          poll_id: string
          voter_name?: string
        }
        Update: {
          created_at?: string
          id?: string
          option_index?: number
          poll_id?: string
          voter_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "wedding_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          partner_name: string
          preferred_body_font: string | null
          preferred_colors: string[] | null
          preferred_display_font: string | null
          preferred_theme: string | null
          updated_at: string
          wedding_date: string | null
          wedding_location: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id: string
          partner_name?: string
          preferred_body_font?: string | null
          preferred_colors?: string[] | null
          preferred_display_font?: string | null
          preferred_theme?: string | null
          updated_at?: string
          wedding_date?: string | null
          wedding_location?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          partner_name?: string
          preferred_body_font?: string | null
          preferred_colors?: string[] | null
          preferred_display_font?: string | null
          preferred_theme?: string | null
          updated_at?: string
          wedding_date?: string | null
          wedding_location?: string | null
        }
        Relationships: []
      }
      qr_attributions: {
        Row: {
          created_at: string
          qr_code: string
          site_created: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          qr_code: string
          site_created?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          qr_code?: string
          site_created?: boolean
          user_id?: string
        }
        Relationships: []
      }
      r2_cleanup_runs: {
        Row: {
          created_at: string
          dry_run: boolean
          error: string | null
          finished_at: string | null
          id: string
          per_user: Json
          started_at: string
          total_deleted: number
          total_freed_bytes: number
          users_scanned: number
        }
        Insert: {
          created_at?: string
          dry_run?: boolean
          error?: string | null
          finished_at?: string | null
          id?: string
          per_user?: Json
          started_at?: string
          total_deleted?: number
          total_freed_bytes?: number
          users_scanned?: number
        }
        Update: {
          created_at?: string
          dry_run?: boolean
          error?: string | null
          finished_at?: string | null
          id?: string
          per_user?: Json
          started_at?: string
          total_deleted?: number
          total_freed_bytes?: number
          users_scanned?: number
        }
        Relationships: []
      }
      r2_files: {
        Row: {
          content_type: string | null
          created_at: string
          id: string
          key: string
          sha256: string | null
          size_bytes: number
          url: string
          user_id: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          id?: string
          key: string
          sha256?: string | null
          size_bytes?: number
          url: string
          user_id: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          id?: string
          key?: string
          sha256?: string | null
          size_bytes?: number
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      r2_storage_usage: {
        Row: {
          file_count: number
          updated_at: string
          used_bytes: number
          user_id: string
        }
        Insert: {
          file_count?: number
          updated_at?: string
          used_bytes?: number
          user_id: string
        }
        Update: {
          file_count?: number
          updated_at?: string
          used_bytes?: number
          user_id?: string
        }
        Relationships: []
      }
      razorpay_refunds: {
        Row: {
          amount: number
          created_at: string
          currency: string
          error_code: string | null
          error_description: string | null
          id: string
          initiated_by: string | null
          notes: Json
          processed_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string
          razorpay_refund_id: string | null
          reason: string | null
          speed: string | null
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          error_code?: string | null
          error_description?: string | null
          id?: string
          initiated_by?: string | null
          notes?: Json
          processed_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id: string
          razorpay_refund_id?: string | null
          reason?: string | null
          speed?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          error_code?: string | null
          error_description?: string | null
          id?: string
          initiated_by?: string | null
          notes?: Json
          processed_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string
          razorpay_refund_id?: string | null
          reason?: string | null
          speed?: string | null
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "razorpay_refunds_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "user_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      razorpay_webhook_events: {
        Row: {
          error: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed: boolean
          razorpay_event_id: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          received_at: string
          signature_valid: boolean
          status_code: number
        }
        Insert: {
          error?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean
          razorpay_event_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          received_at?: string
          signature_valid: boolean
          status_code: number
        }
        Update: {
          error?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean
          razorpay_event_id?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          received_at?: string
          signature_valid?: boolean
          status_code?: number
        }
        Relationships: []
      }
      reminder_email_dlq: {
        Row: {
          attempts: number
          created_at: string
          id: string
          last_error: string | null
          message_id: string | null
          payload: Json | null
          recipient_email: string | null
          template_name: string | null
          variant: string | null
        }
        Insert: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          message_id?: string | null
          payload?: Json | null
          recipient_email?: string | null
          template_name?: string | null
          variant?: string | null
        }
        Update: {
          attempts?: number
          created_at?: string
          id?: string
          last_error?: string | null
          message_id?: string | null
          payload?: Json | null
          recipient_email?: string | null
          template_name?: string | null
          variant?: string | null
        }
        Relationships: []
      }
      reminder_preferences: {
        Row: {
          channel: string
          created_at: string
          id: string
          milestone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          id?: string
          milestone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          id?: string
          milestone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      rsvp_reminder_schedules: {
        Row: {
          body_override: string | null
          created_at: string
          enabled: boolean
          id: string
          last_run_at: string | null
          offsets_days: number[]
          send_hour: number
          subject_override: string | null
          updated_at: string
          wedding_date: string | null
          wedding_site_id: string
        }
        Insert: {
          body_override?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          offsets_days?: number[]
          send_hour?: number
          subject_override?: string | null
          updated_at?: string
          wedding_date?: string | null
          wedding_site_id: string
        }
        Update: {
          body_override?: string | null
          created_at?: string
          enabled?: boolean
          id?: string
          last_run_at?: string | null
          offsets_days?: number[]
          send_hour?: number
          subject_override?: string | null
          updated_at?: string
          wedding_date?: string | null
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_reminder_schedules_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: true
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvp_reminder_sends: {
        Row: {
          created_at: string
          error: string | null
          id: string
          invite_id: string
          message_id: string | null
          offset_day: number
          recipient: string
          status: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          invite_id: string
          message_id?: string | null
          offset_day: number
          recipient: string
          status?: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          invite_id?: string
          message_id?: string | null
          offset_day?: number
          recipient?: string
          status?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_reminder_sends_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "guest_invites"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_reminder_sends_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      rsvps: {
        Row: {
          attending: boolean
          created_at: string
          edit_token: string | null
          guest_count: number
          guest_email: string | null
          guest_name: string
          id: string
          meal_preference: string | null
          message: string | null
          plus_ones: Json
          selected_events: Json | null
          wedding_site_id: string
        }
        Insert: {
          attending?: boolean
          created_at?: string
          edit_token?: string | null
          guest_count?: number
          guest_email?: string | null
          guest_name: string
          id?: string
          meal_preference?: string | null
          message?: string | null
          plus_ones?: Json
          selected_events?: Json | null
          wedding_site_id: string
        }
        Update: {
          attending?: boolean
          created_at?: string
          edit_token?: string | null
          guest_count?: number
          guest_email?: string | null
          guest_name?: string
          id?: string
          meal_preference?: string | null
          message?: string | null
          plus_ones?: Json
          selected_events?: Json | null
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "rsvps_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      seating_charts: {
        Row: {
          created_at: string
          data: Json
          id: string
          is_public: boolean
          updated_at: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          is_public?: boolean
          updated_at?: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          is_public?: boolean
          updated_at?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seating_charts_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: true
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      site_analytics: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json | null
          visitor_id: string | null
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json | null
          visitor_id?: string | null
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          visitor_id?: string | null
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_analytics_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      slug_redirects: {
        Row: {
          created_at: string
          id: string
          old_slug: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          old_slug: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          id?: string
          old_slug?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "slug_redirects_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      template_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          meta: Json | null
          template_slug: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          meta?: Json | null
          template_slug: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          meta?: Json | null
          template_slug?: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: []
      }
      template_favorites: {
        Row: {
          created_at: string
          id: string
          template_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          template_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          template_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      user_luxe_unlocks: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          id: string
          payment_id: string | null
          payment_order_id: string | null
          provider: string
          purchased_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          currency?: string
          id?: string
          payment_id?: string | null
          payment_order_id?: string | null
          provider?: string
          purchased_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          id?: string
          payment_id?: string | null
          payment_order_id?: string | null
          provider?: string
          purchased_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_storage_addons: {
        Row: {
          amount_paid: number
          bytes_added: number
          created_at: string
          currency: string
          expires_at: string
          id: string
          payment_id: string | null
          payment_order_id: string | null
          purchased_at: string
          status: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          bytes_added?: number
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          payment_id?: string | null
          payment_order_id?: string | null
          purchased_at?: string
          status?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          bytes_added?: number
          created_at?: string
          currency?: string
          expires_at?: string
          id?: string
          payment_id?: string | null
          payment_order_id?: string | null
          purchased_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          amount_paid: number
          created_at: string
          currency: string
          duration_months: number
          expires_at: string | null
          id: string
          metadata: Json
          payment_id: string | null
          payment_order_id: string | null
          payment_signature: string | null
          plan: string
          provider: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          currency?: string
          duration_months?: number
          expires_at?: string | null
          id?: string
          metadata?: Json
          payment_id?: string | null
          payment_order_id?: string | null
          payment_signature?: string | null
          plan?: string
          provider?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          created_at?: string
          currency?: string
          duration_months?: number
          expires_at?: string | null
          id?: string
          metadata?: Json
          payment_id?: string | null
          payment_order_id?: string | null
          payment_signature?: string | null
          plan?: string
          provider?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vendor_enquiries: {
        Row: {
          created_at: string
          email: string | null
          event_date: string | null
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          event_date?: string | null
          id?: string
          message?: string
          name: string
          phone?: string | null
          status?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          event_date?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_enquiries_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_reviews: {
        Row: {
          comment: string
          created_at: string
          id: string
          rating: number
          user_id: string
          vendor_id: string
        }
        Insert: {
          comment?: string
          created_at?: string
          id?: string
          rating: number
          user_id: string
          vendor_id: string
        }
        Update: {
          comment?: string
          created_at?: string
          id?: string
          rating?: number
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          about: string
          business_name: string
          category: string
          city: string
          country: string
          cover_url: string | null
          created_at: string
          currency: string
          email: string | null
          gallery: Json
          hours: string
          id: string
          instagram: string | null
          is_featured: boolean
          logo_url: string | null
          phone: string | null
          price_from: number | null
          rating: number
          review_count: number
          service_areas: string[]
          services: Json
          slug: string
          state: string
          status: string
          tagline: string
          theme: Json
          updated_at: string
          user_id: string
          website: string | null
          whatsapp: string | null
        }
        Insert: {
          about?: string
          business_name: string
          category: string
          city?: string
          country?: string
          cover_url?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          gallery?: Json
          hours?: string
          id?: string
          instagram?: string | null
          is_featured?: boolean
          logo_url?: string | null
          phone?: string | null
          price_from?: number | null
          rating?: number
          review_count?: number
          service_areas?: string[]
          services?: Json
          slug: string
          state?: string
          status?: string
          tagline?: string
          theme?: Json
          updated_at?: string
          user_id: string
          website?: string | null
          whatsapp?: string | null
        }
        Update: {
          about?: string
          business_name?: string
          category?: string
          city?: string
          country?: string
          cover_url?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          gallery?: Json
          hours?: string
          id?: string
          instagram?: string | null
          is_featured?: boolean
          logo_url?: string | null
          phone?: string | null
          price_from?: number | null
          rating?: number
          review_count?: number
          service_areas?: string[]
          services?: Json
          slug?: string
          state?: string
          status?: string
          tagline?: string
          theme?: Json
          updated_at?: string
          user_id?: string
          website?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      wedding_budget: {
        Row: {
          created_at: string
          currency: string
          id: string
          total_budget: number
          updated_at: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          total_budget?: number
          updated_at?: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          total_budget?: number
          updated_at?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_budget_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: true
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_checklist: {
        Row: {
          category: string
          created_at: string
          due_date: string | null
          id: string
          is_completed: boolean
          notes: string | null
          reminder_flags: Json
          sort_order: number
          title: string
          wedding_site_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          reminder_flags?: Json
          sort_order?: number
          title: string
          wedding_site_id: string
        }
        Update: {
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          reminder_flags?: Json
          sort_order?: number
          title?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_checklist_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string
          due_date: string | null
          id: string
          notes: string | null
          paid: boolean
          title: string
          updated_at: string
          vendor_name: string | null
          wedding_site_id: string
        }
        Insert: {
          amount?: number
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid?: boolean
          title: string
          updated_at?: string
          vendor_name?: string | null
          wedding_site_id: string
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string
          due_date?: string | null
          id?: string
          notes?: string | null
          paid?: boolean
          title?: string
          updated_at?: string
          vendor_name?: string | null
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_expenses_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_family_members: {
        Row: {
          access_token_hash: string | null
          can_edit: boolean
          created_at: string
          email: string | null
          id: string
          name: string
          permissions: Json
          phone: string | null
          role: string
          wedding_site_id: string
        }
        Insert: {
          access_token_hash?: string | null
          can_edit?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name: string
          permissions?: Json
          phone?: string | null
          role?: string
          wedding_site_id: string
        }
        Update: {
          access_token_hash?: string | null
          can_edit?: boolean
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          permissions?: Json
          phone?: string | null
          role?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_family_members_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_polls: {
        Row: {
          created_at: string
          id: string
          options: Json
          question: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          options?: Json
          question: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          id?: string
          options?: Json
          question?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_polls_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_reminders: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_sent: boolean
          notify_family: boolean
          related_checklist_id: string | null
          related_expense_id: string | null
          remind_at: string
          reminder_type: string
          title: string
          wedding_site_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_sent?: boolean
          notify_family?: boolean
          related_checklist_id?: string | null
          related_expense_id?: string | null
          remind_at: string
          reminder_type?: string
          title: string
          wedding_site_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_sent?: boolean
          notify_family?: boolean
          related_checklist_id?: string | null
          related_expense_id?: string | null
          remind_at?: string
          reminder_type?: string
          title?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_reminders_related_checklist_id_fkey"
            columns: ["related_checklist_id"]
            isOneToOne: false
            referencedRelation: "wedding_checklist"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_reminders_related_expense_id_fkey"
            columns: ["related_expense_id"]
            isOneToOne: false
            referencedRelation: "wedding_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wedding_reminders_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: false
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_report_leads: {
        Row: {
          answers: Json
          budget: number | null
          city: string | null
          couple_name: string | null
          created_at: string
          currency: string
          email: string | null
          guest_count: number | null
          id: string
          phone: string | null
          report: Json
          score: number | null
          user_id: string | null
          visitor_id: string | null
          wedding_date: string | null
          weekly_optin: boolean
        }
        Insert: {
          answers?: Json
          budget?: number | null
          city?: string | null
          couple_name?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          guest_count?: number | null
          id?: string
          phone?: string | null
          report?: Json
          score?: number | null
          user_id?: string | null
          visitor_id?: string | null
          wedding_date?: string | null
          weekly_optin?: boolean
        }
        Update: {
          answers?: Json
          budget?: number | null
          city?: string | null
          couple_name?: string | null
          created_at?: string
          currency?: string
          email?: string | null
          guest_count?: number | null
          id?: string
          phone?: string | null
          report?: Json
          score?: number | null
          user_id?: string | null
          visitor_id?: string | null
          wedding_date?: string | null
          weekly_optin?: boolean
        }
        Relationships: []
      }
      wedding_site_passwords: {
        Row: {
          password: string
          updated_at: string
          wedding_site_id: string
        }
        Insert: {
          password: string
          updated_at?: string
          wedding_site_id: string
        }
        Update: {
          password?: string
          updated_at?: string
          wedding_site_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wedding_site_passwords_wedding_site_id_fkey"
            columns: ["wedding_site_id"]
            isOneToOne: true
            referencedRelation: "wedding_sites"
            referencedColumns: ["id"]
          },
        ]
      }
      wedding_sites: {
        Row: {
          body_font: string | null
          created_at: string
          cultural_background: string
          display_font: string | null
          how_we_met: string
          id: string
          is_published: boolean
          logo_url: string | null
          partner1: string
          partner2: string
          sections: Json
          site_language: string | null
          slug: string | null
          status: string
          suggested_colors: Json
          tagline: string
          theme: string
          translations: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          body_font?: string | null
          created_at?: string
          cultural_background?: string
          display_font?: string | null
          how_we_met?: string
          id?: string
          is_published?: boolean
          logo_url?: string | null
          partner1?: string
          partner2?: string
          sections?: Json
          site_language?: string | null
          slug?: string | null
          status?: string
          suggested_colors?: Json
          tagline?: string
          theme?: string
          translations?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          body_font?: string | null
          created_at?: string
          cultural_background?: string
          display_font?: string | null
          how_we_met?: string
          id?: string
          is_published?: boolean
          logo_url?: string | null
          partner1?: string
          partner2?: string
          sections?: Json
          site_language?: string | null
          slug?: string | null
          status?: string
          suggested_colors?: Json
          tagline?: string
          theme?: string
          translations?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wizard_drafts: {
        Row: {
          data: Json
          saved_at: string
          step: string
          updated_at: string
          user_id: string
        }
        Insert: {
          data?: Json
          saved_at?: string
          step?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          data?: Json
          saved_at?: string
          step?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      affiliate_public_lookup: {
        Row: {
          custom_coupon: string | null
          franchise_id: string | null
          id: string | null
          is_active: boolean | null
          is_franchise: boolean | null
          referral_code: string | null
        }
        Insert: {
          custom_coupon?: string | null
          franchise_id?: string | null
          id?: string | null
          is_active?: boolean | null
          is_franchise?: boolean | null
          referral_code?: string | null
        }
        Update: {
          custom_coupon?: string | null
          franchise_id?: string | null
          id?: string | null
          is_active?: boolean | null
          is_franchise?: boolean | null
          referral_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "affiliate_public_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchise_sub_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals_for_affiliate: {
        Row: {
          affiliate_id: string | null
          commission_amount: number | null
          commission_paid: boolean | null
          converted_at: string | null
          created_at: string | null
          id: string | null
          paid_at: string | null
          payout_status: string | null
          plan: string | null
          referred_email_masked: string | null
          referred_user_id: string | null
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          commission_amount?: number | null
          commission_paid?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string | null
          paid_at?: string | null
          payout_status?: string | null
          plan?: string | null
          referred_email_masked?: never
          referred_user_id?: string | null
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          commission_amount?: number | null
          commission_paid?: boolean | null
          converted_at?: string | null
          created_at?: string | null
          id?: string | null
          paid_at?: string | null
          payout_status?: string | null
          plan?: string | null
          referred_email_masked?: never
          referred_user_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliate_public_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "franchise_sub_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      franchise_sub_affiliates: {
        Row: {
          created_at: string | null
          email: string | null
          franchise_id: string | null
          full_name: string | null
          id: string | null
          is_active: boolean | null
          referral_code: string | null
          successful_referrals: number | null
          total_referrals: number | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          franchise_id?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          referral_code?: string | null
          successful_referrals?: number | null
          total_referrals?: number | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          franchise_id?: string | null
          full_name?: string | null
          id?: string | null
          is_active?: boolean | null
          referral_code?: string | null
          successful_referrals?: number | null
          total_referrals?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "affiliate_public_lookup"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "affiliates_franchise_id_fkey"
            columns: ["franchise_id"]
            isOneToOne: false
            referencedRelation: "franchise_sub_affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      check_ai_rate_limit: {
        Args: {
          _function_name: string
          _per_day?: number
          _per_hour?: number
          _user_id: string
        }
        Returns: {
          allowed: boolean
          day_count: number
          hour_count: number
          retry_after_seconds: number
        }[]
      }
      check_slug_available: {
        Args: { _exclude_site_id?: string; _slug: string }
        Returns: boolean
      }
      create_family_member_token: {
        Args: { _member_id: string }
        Returns: string
      }
      get_billing_terms: {
        Args: never
        Returns: {
          premium_months: number
          storage_months: number
        }[]
      }
      get_invite_by_token: {
        Args: { _token: string }
        Returns: {
          guest_email: string
          guest_name: string
          guest_phone: string
          invite_id: string
          plus_ones_allowed: number
          rsvp_attending: boolean
          rsvp_edit_token: string
          rsvp_guest_count: number
          rsvp_id: string
          rsvp_meal_preference: string
          rsvp_message: string
          rsvp_plus_ones: Json
          rsvp_selected_events: Json
          wedding_site_id: string
        }[]
      }
      get_my_site_permissions: {
        Args: { _site_id: string }
        Returns: {
          can_edit: boolean
          is_admin: boolean
          is_owner: boolean
          permissions: Json
        }[]
      }
      get_platform_funnel: {
        Args: { _days?: number }
        Returns: {
          auth_viewers: number
          pricing_viewers: number
          rsvp_form_views: number
          rsvp_page_visitors: number
          rsvp_submissions: number
          signups: number
          sites_created: number
          sites_published: number
          visitors: number
        }[]
      }
      get_poll_results: {
        Args: { _site_id: string }
        Returns: {
          option_index: number
          poll_id: string
          votes: number
        }[]
      }
      get_public_site: {
        Args: { _password?: string; _slug: string }
        Returns: {
          body_font: string | null
          created_at: string
          cultural_background: string
          display_font: string | null
          how_we_met: string
          id: string
          is_published: boolean
          logo_url: string | null
          partner1: string
          partner2: string
          sections: Json
          site_language: string | null
          slug: string | null
          status: string
          suggested_colors: Json
          tagline: string
          theme: string
          translations: Json | null
          updated_at: string
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "wedding_sites"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_shared_card: {
        Args: { _token: string }
        Returns: {
          data: Json
          id: string
          name: string
          pages: Json
          photo_url: string
          reveal: string
          site_slug: string
          template_slug: string
          theme_overrides: Json
        }[]
      }
      get_template_popularity: {
        Args: never
        Returns: {
          opens: number
          previews: number
          score: number
          template_slug: string
          uses: number
        }[]
      }
      get_themes_funnel: {
        Args: { _days: number }
        Returns: {
          creators: number
          pickers: number
          themes_visitors: number
        }[]
      }
      get_user_storage_quota: {
        Args: { _user_id: string }
        Returns: {
          addon_bytes: number
          base_quota_bytes: number
          file_count: number
          is_premium: boolean
          total_quota_bytes: number
          used_bytes: number
        }[]
      }
      has_site_permission: {
        Args: { _feature: string; _site_id: string; _user_id: string }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      lookup_affiliate_by_code: {
        Args: { _code: string }
        Returns: {
          custom_coupon: string
          franchise_id: string
          id: string
          is_active: boolean
          is_franchise: boolean
          referral_code: string
        }[]
      }
      my_album_reactions: {
        Args: { _guest_identifier: string; _site_id: string }
        Returns: {
          post_id: string
          reaction: string
        }[]
      }
      public_site_gate: {
        Args: { _slug: string }
        Returns: {
          found: boolean
          paused: boolean
          requires_password: boolean
        }[]
      }
      record_qr_signup: { Args: { _code: string }; Returns: boolean }
      resolve_affiliate_qr: { Args: { _code: string }; Returns: string }
      site_accepts_rsvp: { Args: { _site_id: string }; Returns: boolean }
      site_has_password: { Args: { _site_id: string }; Returns: boolean }
      submit_rsvp_by_invite: {
        Args: {
          _attending: boolean
          _guest_count: number
          _meal_preference: string
          _message: string
          _plus_ones?: Json
          _selected_events: Json
          _token: string
        }
        Returns: {
          edit_token: string
          rsvp_id: string
        }[]
      }
      update_rsvp_by_token: {
        Args: {
          _attending: boolean
          _edit_token: string
          _guest_count: number
          _meal_preference: string
          _message: string
          _plus_ones?: Json
          _rsvp_id: string
          _selected_events: Json
        }
        Returns: boolean
      }
      user_has_luxe: { Args: { _user_id: string }; Returns: boolean }
      user_has_premium: { Args: { _user_id: string }; Returns: boolean }
      validate_coupon_for_redemption: {
        Args: {
          _code: string
          _currency: string
          _order_amount: number
          _scope: string
        }
        Returns: {
          code: string
          coupon_id: string
          discount_type: string
          discount_value: number
          max_discount_cap: number
          message: string
          min_order_value: number
        }[]
      }
      verify_family_member_token: {
        Args: { _token: string }
        Returns: {
          can_edit: boolean
          member_id: string
          role: string
          wedding_site_id: string
        }[]
      }
      verify_site_password: {
        Args: { _password: string; _site_id: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
