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
      campaigns: {
        Row: {
          campaign_goal: string | null
          company_name: string | null
          competitor_pages: string[] | null
          country: string | null
          created_at: string
          current_step: number
          description: string | null
          engagement_keywords: string[] | null
          icp_company_sizes: string[] | null
          icp_company_types: string[] | null
          icp_exclude_keywords: string[] | null
          icp_industries: string[] | null
          icp_job_titles: string[] | null
          icp_locations: string[] | null
          id: string
          industry: string | null
          influencer_profiles: string[] | null
          language: string | null
          linkedin_connection_type: string | null
          message_tone: string | null
          pain_points: string | null
          precision_mode: string | null
          session_id: string | null
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
          website: string | null
        }
        Insert: {
          campaign_goal?: string | null
          company_name?: string | null
          competitor_pages?: string[] | null
          country?: string | null
          created_at?: string
          current_step?: number
          description?: string | null
          engagement_keywords?: string[] | null
          icp_company_sizes?: string[] | null
          icp_company_types?: string[] | null
          icp_exclude_keywords?: string[] | null
          icp_industries?: string[] | null
          icp_job_titles?: string[] | null
          icp_locations?: string[] | null
          id?: string
          industry?: string | null
          influencer_profiles?: string[] | null
          language?: string | null
          linkedin_connection_type?: string | null
          message_tone?: string | null
          pain_points?: string | null
          precision_mode?: string | null
          session_id?: string | null
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
          website?: string | null
        }
        Update: {
          campaign_goal?: string | null
          company_name?: string | null
          competitor_pages?: string[] | null
          country?: string | null
          created_at?: string
          current_step?: number
          description?: string | null
          engagement_keywords?: string[] | null
          icp_company_sizes?: string[] | null
          icp_company_types?: string[] | null
          icp_exclude_keywords?: string[] | null
          icp_industries?: string[] | null
          icp_job_titles?: string[] | null
          icp_locations?: string[] | null
          id?: string
          industry?: string | null
          influencer_profiles?: string[] | null
          language?: string | null
          linkedin_connection_type?: string | null
          message_tone?: string | null
          pain_points?: string | null
          precision_mode?: string | null
          session_id?: string | null
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
          website?: string | null
        }
        Relationships: []
      }
      contacts: {
        Row: {
          ai_score: number
          company: string | null
          company_icon_color: string | null
          created_at: string
          email: string | null
          email_enriched: boolean
          first_name: string
          id: string
          imported_at: string
          last_name: string | null
          linkedin_url: string | null
          list_name: string | null
          signal: string | null
          signal_a_hit: boolean
          signal_b_hit: boolean
          signal_c_hit: boolean
          title: string | null
          user_id: string | null
        }
        Insert: {
          ai_score?: number
          company?: string | null
          company_icon_color?: string | null
          created_at?: string
          email?: string | null
          email_enriched?: boolean
          first_name: string
          id?: string
          imported_at?: string
          last_name?: string | null
          linkedin_url?: string | null
          list_name?: string | null
          signal?: string | null
          signal_a_hit?: boolean
          signal_b_hit?: boolean
          signal_c_hit?: boolean
          title?: string | null
          user_id?: string | null
        }
        Update: {
          ai_score?: number
          company?: string | null
          company_icon_color?: string | null
          created_at?: string
          email?: string | null
          email_enriched?: boolean
          first_name?: string
          id?: string
          imported_at?: string
          last_name?: string | null
          linkedin_url?: string | null
          list_name?: string | null
          signal?: string | null
          signal_a_hit?: boolean
          signal_b_hit?: boolean
          signal_c_hit?: boolean
          title?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          campaign_id: string
          company: string
          company_size: string | null
          created_at: string
          id: string
          industry: string | null
          location: string | null
          name: string
          precision_tier: string
          reason: string | null
          score: number
          signal_a_hit: boolean
          signal_b_hit: boolean
          signal_c_hit: boolean
          title: string
        }
        Insert: {
          campaign_id: string
          company: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          name: string
          precision_tier?: string
          reason?: string | null
          score?: number
          signal_a_hit?: boolean
          signal_b_hit?: boolean
          signal_c_hit?: boolean
          title: string
        }
        Update: {
          campaign_id?: string
          company?: string
          company_size?: string | null
          created_at?: string
          id?: string
          industry?: string | null
          location?: string | null
          name?: string
          precision_tier?: string
          reason?: string | null
          score?: number
          signal_a_hit?: boolean
          signal_b_hit?: boolean
          signal_c_hit?: boolean
          title?: string
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
      profiles: {
        Row: {
          created_at: string
          first_name: string | null
          id: string
          last_name: string | null
          onboarding_complete: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_complete?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          first_name?: string | null
          id?: string
          last_name?: string | null
          onboarding_complete?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
          user_id: string | null
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
          user_id?: string | null
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
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
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
