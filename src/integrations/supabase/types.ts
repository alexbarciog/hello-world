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
      ai_chat_messages: {
        Row: {
          attachment: Json | null
          content: string
          created_at: string
          criteria_snapshot: Json | null
          id: string
          quick_replies: Json | null
          role: string
          user_id: string
        }
        Insert: {
          attachment?: Json | null
          content: string
          created_at?: string
          criteria_snapshot?: Json | null
          id?: string
          quick_replies?: Json | null
          role: string
          user_id: string
        }
        Update: {
          attachment?: Json | null
          content?: string
          created_at?: string
          criteria_snapshot?: Json | null
          id?: string
          quick_replies?: Json | null
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          attendee_email: string | null
          contact_id: string | null
          created_at: string
          event_end: string | null
          event_start: string
          event_title: string | null
          id: string
          integration_id: string
          meeting_id: string | null
          pre_meeting_followup_sent: boolean
          provider_event_id: string
          user_id: string
        }
        Insert: {
          attendee_email?: string | null
          contact_id?: string | null
          created_at?: string
          event_end?: string | null
          event_start: string
          event_title?: string | null
          id?: string
          integration_id: string
          meeting_id?: string | null
          pre_meeting_followup_sent?: boolean
          provider_event_id: string
          user_id: string
        }
        Update: {
          attendee_email?: string | null
          contact_id?: string | null
          created_at?: string
          event_end?: string | null
          event_start?: string
          event_title?: string | null
          id?: string
          integration_id?: string
          meeting_id?: string | null
          pre_meeting_followup_sent?: boolean
          provider_event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_integration_id_fkey"
            columns: ["integration_id"]
            isOneToOne: false
            referencedRelation: "calendar_integrations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_events_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_integrations: {
        Row: {
          access_token: string | null
          calendar_email: string | null
          created_at: string
          id: string
          is_active: boolean
          provider: string
          refresh_token: string | null
          token_expires_at: string | null
          updated_at: string
          user_id: string
          webhook_id: string | null
        }
        Insert: {
          access_token?: string | null
          calendar_email?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
          webhook_id?: string | null
        }
        Update: {
          access_token?: string | null
          calendar_email?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          provider?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
          webhook_id?: string | null
        }
        Relationships: []
      }
      campaign_connection_requests: {
        Row: {
          accepted_at: string | null
          ai_replies_count: number
          campaign_id: string
          chat_id: string | null
          contact_id: string
          conversation_stopped: boolean
          created_at: string
          current_step: number
          id: string
          last_ai_reply_at: string | null
          last_incoming_message_at: string | null
          lead_status: string
          next_followup_at: string | null
          sent_at: string
          status: string
          step_completed_at: string | null
          unipile_request_id: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string | null
          ai_replies_count?: number
          campaign_id: string
          chat_id?: string | null
          contact_id: string
          conversation_stopped?: boolean
          created_at?: string
          current_step?: number
          id?: string
          last_ai_reply_at?: string | null
          last_incoming_message_at?: string | null
          lead_status?: string
          next_followup_at?: string | null
          sent_at?: string
          status?: string
          step_completed_at?: string | null
          unipile_request_id?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string | null
          ai_replies_count?: number
          campaign_id?: string
          chat_id?: string | null
          contact_id?: string
          conversation_stopped?: boolean
          created_at?: string
          current_step?: number
          id?: string
          last_ai_reply_at?: string | null
          last_incoming_message_at?: string | null
          lead_status?: string
          next_followup_at?: string | null
          sent_at?: string
          status?: string
          step_completed_at?: string | null
          unipile_request_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_connection_requests_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_connection_requests_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
        ]
      }
      campaigns: {
        Row: {
          campaign_goal: string | null
          company_name: string | null
          competitor_pages: string[] | null
          conversational_ai: boolean
          country: string | null
          created_at: string
          current_step: number | null
          custom_training: string | null
          daily_connect_limit: number
          description: string | null
          discovery_keywords: string[] | null
          engagement_keywords: string[] | null
          exclude_first_degree: boolean
          icp_company_sizes: string[] | null
          icp_company_types: string[] | null
          icp_exclude_keywords: string[] | null
          icp_industries: string[] | null
          icp_job_titles: string[] | null
          icp_locations: string[] | null
          icp_restricted_countries: string[] | null
          icp_restricted_roles: string[] | null
          id: string
          industry: string | null
          influencer_profiles: string[] | null
          invitations_accepted: number | null
          invitations_sent: number | null
          language: string | null
          linkedin_connection_type: string | null
          max_ai_replies: number
          message_tone: string | null
          messages_replied: number | null
          messages_sent: number | null
          pain_points: string[] | null
          precision_mode: string | null
          session_id: string | null
          source_agent_id: string | null
          source_list_id: string | null
          source_type: string | null
          status: string
          step_1_data: Json | null
          step_2_data: Json | null
          step_3_data: Json | null
          step_4_data: Json | null
          step_5_data: Json | null
          step_6_data: Json | null
          trigger_funded_companies: boolean | null
          trigger_job_changes: boolean | null
          trigger_top_active: boolean | null
          updated_at: string
          user_id: string | null
          value_proposition: string | null
          website: string | null
          workflow_steps: Json | null
        }
        Insert: {
          campaign_goal?: string | null
          company_name?: string | null
          competitor_pages?: string[] | null
          conversational_ai?: boolean
          country?: string | null
          created_at?: string
          current_step?: number | null
          custom_training?: string | null
          daily_connect_limit?: number
          description?: string | null
          discovery_keywords?: string[] | null
          engagement_keywords?: string[] | null
          exclude_first_degree?: boolean
          icp_company_sizes?: string[] | null
          icp_company_types?: string[] | null
          icp_exclude_keywords?: string[] | null
          icp_industries?: string[] | null
          icp_job_titles?: string[] | null
          icp_locations?: string[] | null
          icp_restricted_countries?: string[] | null
          icp_restricted_roles?: string[] | null
          id?: string
          industry?: string | null
          influencer_profiles?: string[] | null
          invitations_accepted?: number | null
          invitations_sent?: number | null
          language?: string | null
          linkedin_connection_type?: string | null
          max_ai_replies?: number
          message_tone?: string | null
          messages_replied?: number | null
          messages_sent?: number | null
          pain_points?: string[] | null
          precision_mode?: string | null
          session_id?: string | null
          source_agent_id?: string | null
          source_list_id?: string | null
          source_type?: string | null
          status?: string
          step_1_data?: Json | null
          step_2_data?: Json | null
          step_3_data?: Json | null
          step_4_data?: Json | null
          step_5_data?: Json | null
          step_6_data?: Json | null
          trigger_funded_companies?: boolean | null
          trigger_job_changes?: boolean | null
          trigger_top_active?: boolean | null
          updated_at?: string
          user_id?: string | null
          value_proposition?: string | null
          website?: string | null
          workflow_steps?: Json | null
        }
        Update: {
          campaign_goal?: string | null
          company_name?: string | null
          competitor_pages?: string[] | null
          conversational_ai?: boolean
          country?: string | null
          created_at?: string
          current_step?: number | null
          custom_training?: string | null
          daily_connect_limit?: number
          description?: string | null
          discovery_keywords?: string[] | null
          engagement_keywords?: string[] | null
          exclude_first_degree?: boolean
          icp_company_sizes?: string[] | null
          icp_company_types?: string[] | null
          icp_exclude_keywords?: string[] | null
          icp_industries?: string[] | null
          icp_job_titles?: string[] | null
          icp_locations?: string[] | null
          icp_restricted_countries?: string[] | null
          icp_restricted_roles?: string[] | null
          id?: string
          industry?: string | null
          influencer_profiles?: string[] | null
          invitations_accepted?: number | null
          invitations_sent?: number | null
          language?: string | null
          linkedin_connection_type?: string | null
          max_ai_replies?: number
          message_tone?: string | null
          messages_replied?: number | null
          messages_sent?: number | null
          pain_points?: string[] | null
          precision_mode?: string | null
          session_id?: string | null
          source_agent_id?: string | null
          source_list_id?: string | null
          source_type?: string | null
          status?: string
          step_1_data?: Json | null
          step_2_data?: Json | null
          step_3_data?: Json | null
          step_4_data?: Json | null
          step_5_data?: Json | null
          step_6_data?: Json | null
          trigger_funded_companies?: boolean | null
          trigger_job_changes?: boolean | null
          trigger_top_active?: boolean | null
          updated_at?: string
          user_id?: string | null
          value_proposition?: string | null
          website?: string | null
          workflow_steps?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_source_agent_id_fkey"
            columns: ["source_agent_id"]
            isOneToOne: false
            referencedRelation: "signal_agents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaigns_source_list_id_fkey"
            columns: ["source_list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_lists: {
        Row: {
          added_at: string
          contact_id: string
          id: string
          list_id: string
        }
        Insert: {
          added_at?: string
          contact_id: string
          id?: string
          list_id: string
        }
        Update: {
          added_at?: string
          contact_id?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_lists_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_lists_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          ai_score: number | null
          company: string | null
          company_icon_color: string | null
          email: string | null
          email_enriched: boolean | null
          first_name: string
          id: string
          imported_at: string
          industry: string | null
          intent_insights: Json | null
          intent_insights_generated_at: string | null
          last_name: string | null
          last_signal_at: string | null
          lead_status: string
          linkedin_profile_id: string | null
          linkedin_url: string | null
          list_name: string | null
          personality_generated_at: string | null
          personality_prediction: Json | null
          relevance_tier: string
          signal: string | null
          signal_a_hit: boolean | null
          signal_b_hit: boolean | null
          signal_c_hit: boolean | null
          signal_count: number
          signal_post_url: string | null
          source_campaign_id: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          ai_score?: number | null
          company?: string | null
          company_icon_color?: string | null
          email?: string | null
          email_enriched?: boolean | null
          first_name: string
          id?: string
          imported_at?: string
          industry?: string | null
          intent_insights?: Json | null
          intent_insights_generated_at?: string | null
          last_name?: string | null
          last_signal_at?: string | null
          lead_status?: string
          linkedin_profile_id?: string | null
          linkedin_url?: string | null
          list_name?: string | null
          personality_generated_at?: string | null
          personality_prediction?: Json | null
          relevance_tier?: string
          signal?: string | null
          signal_a_hit?: boolean | null
          signal_b_hit?: boolean | null
          signal_c_hit?: boolean | null
          signal_count?: number
          signal_post_url?: string | null
          source_campaign_id?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          ai_score?: number | null
          company?: string | null
          company_icon_color?: string | null
          email?: string | null
          email_enriched?: boolean | null
          first_name?: string
          id?: string
          imported_at?: string
          industry?: string | null
          intent_insights?: Json | null
          intent_insights_generated_at?: string | null
          last_name?: string | null
          last_signal_at?: string | null
          lead_status?: string
          linkedin_profile_id?: string | null
          linkedin_url?: string | null
          list_name?: string | null
          personality_generated_at?: string | null
          personality_prediction?: Json | null
          relevance_tier?: string
          signal?: string | null
          signal_a_hit?: boolean | null
          signal_b_hit?: boolean | null
          signal_c_hit?: boolean | null
          signal_count?: number
          signal_post_url?: string | null
          source_campaign_id?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      daily_scheduled_leads: {
        Row: {
          action_type: string
          campaign_id: string
          contact_id: string
          created_at: string
          id: string
          scheduled_date: string
          sent_at: string | null
          status: string
          step_index: number
          user_id: string
        }
        Insert: {
          action_type: string
          campaign_id: string
          contact_id: string
          created_at?: string
          id?: string
          scheduled_date?: string
          sent_at?: string | null
          status?: string
          step_index?: number
          user_id: string
        }
        Update: {
          action_type?: string
          campaign_id?: string
          contact_id?: string
          created_at?: string
          id?: string
          scheduled_date?: string
          sent_at?: string | null
          status?: string
          step_index?: number
          user_id?: string
        }
        Relationships: []
      }
      invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string | null
          inviter_name: string | null
          organization_name: string | null
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          inviter_name?: string | null
          organization_name?: string | null
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string | null
          inviter_name?: string | null
          organization_name?: string | null
          token?: string
        }
        Relationships: []
      }
      leads: {
        Row: {
          campaign_id: string
          company: string | null
          company_size: string | null
          created_at: string
          id: string
          industry: string | null
          location: string | null
          name: string
          precision_tier: string | null
          reason: string | null
          score: number | null
          signal_a_hit: boolean | null
          signal_b_hit: boolean | null
          signal_c_hit: boolean | null
          title: string | null
        }
        Insert: {
          campaign_id: string
          company?: string | null
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          name: string
          precision_tier?: string | null
          reason?: string | null
          score?: number | null
          signal_a_hit?: boolean | null
          signal_b_hit?: boolean | null
          signal_c_hit?: boolean | null
          title?: string | null
        }
        Update: {
          campaign_id?: string
          company?: string | null
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          name?: string
          precision_tier?: string | null
          reason?: string | null
          score?: number | null
          signal_a_hit?: boolean | null
          signal_b_hit?: boolean | null
          signal_c_hit?: boolean | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "leads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          source_agent_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          source_agent_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          source_agent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_source_agent_id_fkey"
            columns: ["source_agent_id"]
            isOneToOne: false
            referencedRelation: "signal_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          campaign_id: string | null
          contact_id: string
          created_at: string
          id: string
          notes: string | null
          prep_generated_at: string | null
          prep_research: Json | null
          scheduled_at: string
          status: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          contact_id: string
          created_at?: string
          id?: string
          notes?: string | null
          prep_generated_at?: string | null
          prep_research?: Json | null
          scheduled_at: string
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          contact_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          prep_generated_at?: string | null
          prep_research?: Json | null
          scheduled_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meetings_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "meetings_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
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
          read: boolean
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title: string
          type?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read?: boolean
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      password_reset_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          used: boolean
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          used?: boolean
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          free_trial_enabled: boolean
          id: string
          updated_at: string
        }
        Insert: {
          free_trial_enabled?: boolean
          id?: string
          updated_at?: string
        }
        Update: {
          free_trial_enabled?: boolean
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      processed_posts: {
        Row: {
          agent_id: string
          id: string
          processed_at: string
          social_id: string
        }
        Insert: {
          agent_id: string
          id?: string
          processed_at?: string
          social_id: string
        }
        Update: {
          agent_id?: string
          id?: string
          processed_at?: string
          social_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processed_posts_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "signal_agents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_chat_criteria: Json | null
          ai_chat_lead_status: Json | null
          created_at: string
          credits: number
          daily_connections_limit: number
          daily_messages_limit: number
          free_trial_enabled: boolean
          free_trial_limit: number
          id: string
          last_seen_at: string | null
          linkedin_display_name: string | null
          onboarding_complete: boolean
          unipile_account_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_chat_criteria?: Json | null
          ai_chat_lead_status?: Json | null
          created_at?: string
          credits?: number
          daily_connections_limit?: number
          daily_messages_limit?: number
          free_trial_enabled?: boolean
          free_trial_limit?: number
          id?: string
          last_seen_at?: string | null
          linkedin_display_name?: string | null
          onboarding_complete?: boolean
          unipile_account_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_chat_criteria?: Json | null
          ai_chat_lead_status?: Json | null
          created_at?: string
          credits?: number
          daily_connections_limit?: number
          daily_messages_limit?: number
          free_trial_enabled?: boolean
          free_trial_limit?: number
          id?: string
          last_seen_at?: string | null
          linkedin_display_name?: string | null
          onboarding_complete?: boolean
          unipile_account_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reddit_keywords: {
        Row: {
          active: boolean
          created_at: string
          id: string
          keyword: string
          last_polled_at: string | null
          subreddits: string[]
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          keyword: string
          last_polled_at?: string | null
          subreddits?: string[]
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          keyword?: string
          last_polled_at?: string | null
          subreddits?: string[]
          user_id?: string
        }
        Relationships: []
      }
      reddit_mentions: {
        Row: {
          author: string
          body: string | null
          dismissed: boolean
          found_at: string
          id: string
          keyword_id: string
          keyword_matched: string
          posted_at: string | null
          reddit_post_id: string
          relevance_score: number | null
          saved: boolean
          score: number | null
          subreddit: string
          title: string
          url: string
          user_id: string
        }
        Insert: {
          author: string
          body?: string | null
          dismissed?: boolean
          found_at?: string
          id?: string
          keyword_id: string
          keyword_matched: string
          posted_at?: string | null
          reddit_post_id: string
          relevance_score?: number | null
          saved?: boolean
          score?: number | null
          subreddit: string
          title: string
          url: string
          user_id: string
        }
        Update: {
          author?: string
          body?: string | null
          dismissed?: boolean
          found_at?: string
          id?: string
          keyword_id?: string
          keyword_matched?: string
          posted_at?: string | null
          reddit_post_id?: string
          relevance_score?: number | null
          saved?: boolean
          score?: number | null
          subreddit?: string
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reddit_mentions_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "reddit_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_messages: {
        Row: {
          campaign_id: string
          connection_request_id: string
          contact_id: string
          created_at: string
          edited_by_user: boolean
          generated_at: string
          id: string
          message: string
          scheduled_for: string
          sent_at: string | null
          status: string
          step_index: number
          user_id: string
        }
        Insert: {
          campaign_id: string
          connection_request_id: string
          contact_id: string
          created_at?: string
          edited_by_user?: boolean
          generated_at?: string
          id?: string
          message?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          step_index: number
          user_id: string
        }
        Update: {
          campaign_id?: string
          connection_request_id?: string
          contact_id?: string
          created_at?: string
          edited_by_user?: boolean
          generated_at?: string
          id?: string
          message?: string
          scheduled_for?: string
          sent_at?: string | null
          status?: string
          step_index?: number
          user_id?: string
        }
        Relationships: []
      }
      signal_agent_runs: {
        Row: {
          agent_id: string
          ai_suggestions: Json | null
          completed_at: string | null
          completed_tasks: number
          error: string | null
          id: string
          rejected_profiles_sample: Json
          started_at: string
          status: string
          suggestions_generated_at: string | null
          total_leads: number
          total_tasks: number
          user_id: string
        }
        Insert: {
          agent_id: string
          ai_suggestions?: Json | null
          completed_at?: string | null
          completed_tasks?: number
          error?: string | null
          id?: string
          rejected_profiles_sample?: Json
          started_at?: string
          status?: string
          suggestions_generated_at?: string | null
          total_leads?: number
          total_tasks?: number
          user_id: string
        }
        Update: {
          agent_id?: string
          ai_suggestions?: Json | null
          completed_at?: string | null
          completed_tasks?: number
          error?: string | null
          id?: string
          rejected_profiles_sample?: Json
          started_at?: string
          status?: string
          suggestions_generated_at?: string | null
          total_leads?: number
          total_tasks?: number
          user_id?: string
        }
        Relationships: []
      }
      signal_agent_tasks: {
        Row: {
          agent_id: string
          attempt_count: number
          available_at: string
          completed_at: string | null
          diagnostics: Json | null
          error: string | null
          id: string
          last_heartbeat_at: string | null
          leads_found: number
          lease_expires_at: string | null
          payload: Json | null
          rejected_profiles_sample: Json
          run_id: string
          signal_type: string
          started_at: string | null
          status: string
          task_key: string
        }
        Insert: {
          agent_id: string
          attempt_count?: number
          available_at?: string
          completed_at?: string | null
          diagnostics?: Json | null
          error?: string | null
          id?: string
          last_heartbeat_at?: string | null
          leads_found?: number
          lease_expires_at?: string | null
          payload?: Json | null
          rejected_profiles_sample?: Json
          run_id: string
          signal_type: string
          started_at?: string | null
          status?: string
          task_key?: string
        }
        Update: {
          agent_id?: string
          attempt_count?: number
          available_at?: string
          completed_at?: string | null
          diagnostics?: Json | null
          error?: string | null
          id?: string
          last_heartbeat_at?: string | null
          leads_found?: number
          lease_expires_at?: string | null
          payload?: Json | null
          rejected_profiles_sample?: Json
          run_id?: string
          signal_type?: string
          started_at?: string | null
          status?: string
          task_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "signal_agent_tasks_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "signal_agent_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      signal_agents: {
        Row: {
          agent_type: string
          created_at: string
          icp_company_sizes: string[] | null
          icp_company_types: string[] | null
          icp_exclude_keywords: string[] | null
          icp_industries: string[] | null
          icp_job_titles: string[] | null
          icp_locations: string[] | null
          icp_restricted_countries: string[] | null
          icp_restricted_roles: string[] | null
          id: string
          keywords: string[] | null
          last_launched_at: string | null
          leads_list_name: string | null
          name: string
          next_launch_at: string | null
          precision_mode: string | null
          results_count: number
          signals_config: Json | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          agent_type?: string
          created_at?: string
          icp_company_sizes?: string[] | null
          icp_company_types?: string[] | null
          icp_exclude_keywords?: string[] | null
          icp_industries?: string[] | null
          icp_job_titles?: string[] | null
          icp_locations?: string[] | null
          icp_restricted_countries?: string[] | null
          icp_restricted_roles?: string[] | null
          id?: string
          keywords?: string[] | null
          last_launched_at?: string | null
          leads_list_name?: string | null
          name?: string
          next_launch_at?: string | null
          precision_mode?: string | null
          results_count?: number
          signals_config?: Json | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string
          icp_company_sizes?: string[] | null
          icp_company_types?: string[] | null
          icp_exclude_keywords?: string[] | null
          icp_industries?: string[] | null
          icp_job_titles?: string[] | null
          icp_locations?: string[] | null
          icp_restricted_countries?: string[] | null
          icp_restricted_roles?: string[] | null
          id?: string
          keywords?: string[] | null
          last_launched_at?: string | null
          leads_list_name?: string | null
          name?: string
          next_launch_at?: string | null
          precision_mode?: string | null
          results_count?: number
          signals_config?: Json | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      x_keywords: {
        Row: {
          active: boolean
          created_at: string
          id: string
          keyword: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          keyword: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          keyword?: string
          user_id?: string
        }
        Relationships: []
      }
      x_mentions: {
        Row: {
          author: string
          author_name: string | null
          body: string | null
          dismissed: boolean
          found_at: string
          id: string
          keyword_id: string
          keyword_matched: string
          like_count: number | null
          posted_at: string | null
          reply_count: number | null
          retweet_count: number | null
          saved: boolean
          title: string
          url: string
          user_id: string
          x_post_id: string
        }
        Insert: {
          author: string
          author_name?: string | null
          body?: string | null
          dismissed?: boolean
          found_at?: string
          id?: string
          keyword_id: string
          keyword_matched: string
          like_count?: number | null
          posted_at?: string | null
          reply_count?: number | null
          retweet_count?: number | null
          saved?: boolean
          title: string
          url: string
          user_id: string
          x_post_id: string
        }
        Update: {
          author?: string
          author_name?: string | null
          body?: string | null
          dismissed?: boolean
          found_at?: string
          id?: string
          keyword_id?: string
          keyword_matched?: string
          like_count?: number | null
          posted_at?: string | null
          reply_count?: number | null
          retweet_count?: number | null
          saved?: boolean
          title?: string
          url?: string
          user_id?: string
          x_post_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "x_mentions_keyword_id_fkey"
            columns: ["keyword_id"]
            isOneToOne: false
            referencedRelation: "x_keywords"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
