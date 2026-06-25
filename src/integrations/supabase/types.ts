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
    PostgrestVersion: "14.4"
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
          payout_paypal: string | null
          payout_upi: string | null
          pending_earnings: number
          phone: string | null
          referral_code: string
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
          payout_paypal?: string | null
          payout_upi?: string | null
          pending_earnings?: number
          phone?: string | null
          referral_code: string
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
          payout_paypal?: string | null
          payout_upi?: string | null
          pending_earnings?: number
          phone?: string | null
          referral_code?: string
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
          updated_at?: string
          wedding_date?: string | null
          wedding_location?: string | null
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
      rsvps: {
        Row: {
          attending: boolean
          created_at: string
          guest_count: number
          guest_email: string
          guest_name: string
          id: string
          meal_preference: string | null
          message: string | null
          selected_events: Json | null
          wedding_site_id: string
        }
        Insert: {
          attending?: boolean
          created_at?: string
          guest_count?: number
          guest_email: string
          guest_name: string
          id?: string
          meal_preference?: string | null
          message?: string | null
          selected_events?: Json | null
          wedding_site_id: string
        }
        Update: {
          attending?: boolean
          created_at?: string
          guest_count?: number
          guest_email?: string
          guest_name?: string
          id?: string
          meal_preference?: string | null
          message?: string | null
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
          template_slug: string
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          template_slug: string
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
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
          created_at: string
          cultural_background: string
          custom_domain: string | null
          domain_status: string | null
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
          created_at?: string
          cultural_background?: string
          custom_domain?: string | null
          domain_status?: string | null
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
          created_at?: string
          cultural_background?: string
          custom_domain?: string | null
          domain_status?: string | null
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
      check_slug_available: {
        Args: { _exclude_site_id?: string; _slug: string }
        Returns: boolean
      }
      create_family_member_token: {
        Args: { _member_id: string }
        Returns: string
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
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
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      site_has_password: { Args: { _site_id: string }; Returns: boolean }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
