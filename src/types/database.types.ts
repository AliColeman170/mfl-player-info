export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      favourites: {
        Row: {
          is_favourite: boolean
          player_id: number
          tags: string[]
          wallet_address: string
        }
        Insert: {
          is_favourite?: boolean
          player_id: number
          tags?: string[]
          wallet_address: string
        }
        Update: {
          is_favourite?: boolean
          player_id?: number
          tags?: string[]
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "favourites_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      nonces: {
        Row: {
          expires: string
          id: string
        }
        Insert: {
          expires?: string
          id: string
        }
        Update: {
          expires?: string
          id?: string
        }
        Relationships: []
      }
      players: {
        Row: {
          age: number | null
          auto_renewal: boolean | null
          best_ovr: number | null
          best_position: string | null
          best_position_difference: number | null
          best_position_index: number | null
          best_position_rating: number | null
          clauses: Json | null
          club_city: string | null
          club_country: string | null
          club_division: number | null
          club_id: number | null
          club_logo_version: string | null
          club_main_color: string | null
          club_name: string | null
          club_name_lower: string | null
          club_secondary_color: string | null
          club_type: string | null
          contract_created_date_time: number | null
          contract_id: number | null
          contract_kind: string | null
          contract_status: string | null
          created_at: string | null
          current_listing_id: number | null
          current_listing_price: number | null
          current_listing_status: string | null
          data_hash: string | null
          defense: number | null
          dribbling: number | null
          energy: number | null
          first_name: string | null
          goalkeeping: number | null
          has_pre_contract: boolean | null
          height: number | null
          id: number
          last_name: string | null
          last_sale_date: number | null
          last_sale_price: number | null
          last_synced_at: string | null
          listing_created_date_time: number | null
          market_value_based_on: string | null
          market_value_confidence: string | null
          market_value_estimate: number | null
          market_value_high: number | null
          market_value_low: number | null
          market_value_method: string | null
          market_value_sample_size: number | null
          market_value_updated_at: string | null
          nationality: string | null
          nb_seasons: number | null
          offer_auto_accept: boolean | null
          offer_min_division: number | null
          offer_min_revenue_share: number | null
          offer_status: number | null
          overall: number | null
          ovr_difference: number | null
          owner_last_active: number | null
          owner_name: string | null
          owner_name_lower: string | null
          owner_twitter: string | null
          owner_wallet_address: string | null
          pace: number | null
          passing: number | null
          physical: number | null
          position_index: number | null
          position_ratings: Json | null
          preferred_foot: string | null
          price_difference: number | null
          primary_position: string | null
          resistance: number | null
          revenue_share: number | null
          search_text: string | null
          secondary_positions: string[] | null
          shooting: number | null
          start_season: number | null
          sync_version: number | null
          total_revenue_share_locked: number | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          auto_renewal?: boolean | null
          best_ovr?: number | null
          best_position?: string | null
          best_position_difference?: number | null
          best_position_index?: number | null
          best_position_rating?: number | null
          clauses?: Json | null
          club_city?: string | null
          club_country?: string | null
          club_division?: number | null
          club_id?: number | null
          club_logo_version?: string | null
          club_main_color?: string | null
          club_name?: string | null
          club_name_lower?: string | null
          club_secondary_color?: string | null
          club_type?: string | null
          contract_created_date_time?: number | null
          contract_id?: number | null
          contract_kind?: string | null
          contract_status?: string | null
          created_at?: string | null
          current_listing_id?: number | null
          current_listing_price?: number | null
          current_listing_status?: string | null
          data_hash?: string | null
          defense?: number | null
          dribbling?: number | null
          energy?: number | null
          first_name?: string | null
          goalkeeping?: number | null
          has_pre_contract?: boolean | null
          height?: number | null
          id: number
          last_name?: string | null
          last_sale_date?: number | null
          last_sale_price?: number | null
          last_synced_at?: string | null
          listing_created_date_time?: number | null
          market_value_based_on?: string | null
          market_value_confidence?: string | null
          market_value_estimate?: number | null
          market_value_high?: number | null
          market_value_low?: number | null
          market_value_method?: string | null
          market_value_sample_size?: number | null
          market_value_updated_at?: string | null
          nationality?: string | null
          nb_seasons?: number | null
          offer_auto_accept?: boolean | null
          offer_min_division?: number | null
          offer_min_revenue_share?: number | null
          offer_status?: number | null
          overall?: number | null
          ovr_difference?: number | null
          owner_last_active?: number | null
          owner_name?: string | null
          owner_name_lower?: string | null
          owner_twitter?: string | null
          owner_wallet_address?: string | null
          pace?: number | null
          passing?: number | null
          physical?: number | null
          position_index?: number | null
          position_ratings?: Json | null
          preferred_foot?: string | null
          price_difference?: number | null
          primary_position?: string | null
          resistance?: number | null
          revenue_share?: number | null
          search_text?: string | null
          secondary_positions?: string[] | null
          shooting?: number | null
          start_season?: number | null
          sync_version?: number | null
          total_revenue_share_locked?: number | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          auto_renewal?: boolean | null
          best_ovr?: number | null
          best_position?: string | null
          best_position_difference?: number | null
          best_position_index?: number | null
          best_position_rating?: number | null
          clauses?: Json | null
          club_city?: string | null
          club_country?: string | null
          club_division?: number | null
          club_id?: number | null
          club_logo_version?: string | null
          club_main_color?: string | null
          club_name?: string | null
          club_name_lower?: string | null
          club_secondary_color?: string | null
          club_type?: string | null
          contract_created_date_time?: number | null
          contract_id?: number | null
          contract_kind?: string | null
          contract_status?: string | null
          created_at?: string | null
          current_listing_id?: number | null
          current_listing_price?: number | null
          current_listing_status?: string | null
          data_hash?: string | null
          defense?: number | null
          dribbling?: number | null
          energy?: number | null
          first_name?: string | null
          goalkeeping?: number | null
          has_pre_contract?: boolean | null
          height?: number | null
          id?: number
          last_name?: string | null
          last_sale_date?: number | null
          last_sale_price?: number | null
          last_synced_at?: string | null
          listing_created_date_time?: number | null
          market_value_based_on?: string | null
          market_value_confidence?: string | null
          market_value_estimate?: number | null
          market_value_high?: number | null
          market_value_low?: number | null
          market_value_method?: string | null
          market_value_sample_size?: number | null
          market_value_updated_at?: string | null
          nationality?: string | null
          nb_seasons?: number | null
          offer_auto_accept?: boolean | null
          offer_min_division?: number | null
          offer_min_revenue_share?: number | null
          offer_status?: number | null
          overall?: number | null
          ovr_difference?: number | null
          owner_last_active?: number | null
          owner_name?: string | null
          owner_name_lower?: string | null
          owner_twitter?: string | null
          owner_wallet_address?: string | null
          pace?: number | null
          passing?: number | null
          physical?: number | null
          position_index?: number | null
          position_ratings?: Json | null
          preferred_foot?: string | null
          price_difference?: number | null
          primary_position?: string | null
          resistance?: number | null
          revenue_share?: number | null
          search_text?: string | null
          secondary_positions?: string[] | null
          shooting?: number | null
          start_season?: number | null
          sync_version?: number | null
          total_revenue_share_locked?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sync_status: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          failed_players: number | null
          id: number
          started_at: string | null
          status: string
          sync_type: string
          synced_players: number | null
          total_players: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_players?: number | null
          id?: number
          started_at?: string | null
          status: string
          sync_type: string
          synced_players?: number | null
          total_players?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          failed_players?: number | null
          id?: number
          started_at?: string | null
          status?: string
          sync_type?: string
          synced_players?: number | null
          total_players?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_contract_stats_for_player: {
        Args: {
          player_id: number
          age_min?: number
          age_max?: number
          overall_min?: number
          overall_max?: number
          position_filter?: string
        }
        Returns: {
          division: number
          total_contracts: number
          min_revenue_share: number
          max_revenue_share: number
          avg_revenue_share: number
        }[]
      }
      get_favorite_players: {
        Args: { limit_count?: number }
        Returns: {
          id: number
          first_name: string
          last_name: string
          overall: number
          primary_position: string
          market_value_estimate: number
          age: number
          club_name: string
          favorite_count: number
        }[]
      }
      get_filter_counts: {
        Args: {
          search_text?: string
          favourites_filter?: string
          selected_tags?: string[]
          tags_match_all?: boolean
          authenticated_wallet_address?: string
          wallet_address_filter?: string
          applied_nationalities?: string[]
          applied_positions?: string[]
          applied_secondary_positions?: string[]
          applied_owners?: string[]
          applied_clubs?: string[]
          applied_best_positions?: string[]
          applied_preferred_foot?: string
          age_min_filter?: number
          age_max_filter?: number
          height_min_filter?: number
          height_max_filter?: number
          overall_min_filter?: number
          overall_max_filter?: number
          pace_min_filter?: number
          pace_max_filter?: number
          shooting_min_filter?: number
          shooting_max_filter?: number
          passing_min_filter?: number
          passing_max_filter?: number
          dribbling_min_filter?: number
          dribbling_max_filter?: number
          defense_min_filter?: number
          defense_max_filter?: number
          physical_min_filter?: number
          physical_max_filter?: number
          best_overall_min_filter?: number
          best_overall_max_filter?: number
          market_value_min_filter?: number
          market_value_max_filter?: number
          price_diff_min_filter?: number
          price_diff_max_filter?: number
        }
        Returns: Json
      }
      get_filter_options: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_filter_options_paginated: {
        Args: {
          option_type: string
          page_size?: number
          offset_value?: number
          search_term?: string
        }
        Returns: Json
      }
      get_top_owners: {
        Args: { limit_count?: number }
        Returns: {
          owner_wallet_address: string
          owner_name: string
          player_count: number
          total_value: number
          avg_overall: number
        }[]
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const

