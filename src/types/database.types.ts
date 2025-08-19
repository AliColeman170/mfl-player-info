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
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
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
      market_multiplier_updates: {
        Row: {
          combinations_added: number
          combinations_updated: number
          completed_at: string | null
          id: number
          sales_data_window_days: number
          started_at: string
          status: string | null
          total_combinations_analyzed: number
          total_sales_analyzed: number
          update_run_id: string
        }
        Insert: {
          combinations_added: number
          combinations_updated: number
          completed_at?: string | null
          id?: number
          sales_data_window_days: number
          started_at: string
          status?: string | null
          total_combinations_analyzed: number
          total_sales_analyzed: number
          update_run_id?: string
        }
        Update: {
          combinations_added?: number
          combinations_updated?: number
          completed_at?: string | null
          id?: number
          sales_data_window_days?: number
          started_at?: string
          status?: string | null
          total_combinations_analyzed?: number
          total_sales_analyzed?: number
          update_run_id?: string
        }
        Relationships: []
      }
      market_multipliers: {
        Row: {
          age_range: string
          avg_price: number
          confidence_score: number
          created_at: string | null
          id: number
          last_updated: string | null
          multiplier: number
          overall_range: string
          position: string
          sample_size: number
        }
        Insert: {
          age_range: string
          avg_price: number
          confidence_score: number
          created_at?: string | null
          id?: number
          last_updated?: string | null
          multiplier: number
          overall_range: string
          position: string
          sample_size: number
        }
        Update: {
          age_range?: string
          avg_price?: number
          confidence_score?: number
          created_at?: string | null
          id?: number
          last_updated?: string | null
          multiplier?: number
          overall_range?: string
          position?: string
          sample_size?: number
        }
        Relationships: []
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
      player_count: {
        Row: {
          count: number | null
        }
        Insert: {
          count?: number | null
        }
        Update: {
          count?: number | null
        }
        Relationships: []
      }
      players: {
        Row: {
          age: number | null
          auto_renewal: boolean | null
          base_value_estimate: number | null
          basic_data_synced_at: string | null
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
          is_burned: boolean | null
          is_retired: boolean | null
          last_name: string | null
          last_sale_date: number | null
          last_sale_price: number | null
          last_synced_at: string | null
          listing_created_date_time: number | null
          market_value_based_on: string | null
          market_value_calculated_at: string | null
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
          sync_stage: string | null
          sync_version: number | null
          total_revenue_share_locked: number | null
          updated_at: string | null
        }
        Insert: {
          age?: number | null
          auto_renewal?: boolean | null
          base_value_estimate?: number | null
          basic_data_synced_at?: string | null
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
          is_burned?: boolean | null
          is_retired?: boolean | null
          last_name?: string | null
          last_sale_date?: number | null
          last_sale_price?: number | null
          last_synced_at?: string | null
          listing_created_date_time?: number | null
          market_value_based_on?: string | null
          market_value_calculated_at?: string | null
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
          sync_stage?: string | null
          sync_version?: number | null
          total_revenue_share_locked?: number | null
          updated_at?: string | null
        }
        Update: {
          age?: number | null
          auto_renewal?: boolean | null
          base_value_estimate?: number | null
          basic_data_synced_at?: string | null
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
          is_burned?: boolean | null
          is_retired?: boolean | null
          last_name?: string | null
          last_sale_date?: number | null
          last_sale_price?: number | null
          last_synced_at?: string | null
          listing_created_date_time?: number | null
          market_value_based_on?: string | null
          market_value_calculated_at?: string | null
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
          sync_stage?: string | null
          sync_version?: number | null
          total_revenue_share_locked?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          buyer_wallet_address: string | null
          created_date_time: number
          imported_at: string | null
          listing_resource_id: number
          player_age: number | null
          player_id: number
          player_overall: number | null
          player_position: string | null
          price: number
          purchase_date_time: number | null
          seller_wallet_address: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_wallet_address?: string | null
          created_date_time: number
          imported_at?: string | null
          listing_resource_id: number
          player_age?: number | null
          player_id: number
          player_overall?: number | null
          player_position?: string | null
          price: number
          purchase_date_time?: number | null
          seller_wallet_address?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_wallet_address?: string | null
          created_date_time?: number
          imported_at?: string | null
          listing_resource_id?: number
          player_age?: number | null
          player_id?: number
          player_overall?: number | null
          player_position?: string | null
          price?: number
          purchase_date_time?: number | null
          seller_wallet_address?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_player_id_fkey"
            columns: ["player_id"]
            isOneToOne: false
            referencedRelation: "players"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_summary: {
        Row: {
          age_center: number
          age_range: number
          avg_price: number | null
          created_at: string | null
          id: number
          last_updated: string | null
          median_price: number | null
          overall_center: number
          overall_range: number
          position: string
          price_trend: number | null
          recent_sales_data: Json | null
          sample_count: number
        }
        Insert: {
          age_center: number
          age_range?: number
          avg_price?: number | null
          created_at?: string | null
          id?: number
          last_updated?: string | null
          median_price?: number | null
          overall_center: number
          overall_range?: number
          position: string
          price_trend?: number | null
          recent_sales_data?: Json | null
          sample_count?: number
        }
        Update: {
          age_center?: number
          age_range?: number
          avg_price?: number | null
          created_at?: string | null
          id?: number
          last_updated?: string | null
          median_price?: number | null
          overall_center?: number
          overall_range?: number
          position?: string
          price_trend?: number | null
          recent_sales_data?: Json | null
          sample_count?: number
        }
        Relationships: []
      }
      sync_config: {
        Row: {
          config_key: string
          config_value: string | null
          created_at: string | null
          description: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: string | null
          created_at?: string | null
          description?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      total_volume: {
        Row: {
          coalesce: number | null
        }
        Insert: {
          coalesce?: number | null
        }
        Update: {
          coalesce?: number | null
        }
        Relationships: []
      }
      upstash_workflow_executions: {
        Row: {
          completed_at: string | null
          completed_steps: number | null
          created_at: string | null
          error_message: string | null
          id: string
          progress: Json | null
          started_at: string | null
          status: string
          total_steps: number | null
          updated_at: string | null
          workflow_name: string
          workflow_run_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_steps?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          progress?: Json | null
          started_at?: string | null
          status?: string
          total_steps?: number | null
          updated_at?: string | null
          workflow_name: string
          workflow_run_id: string
        }
        Update: {
          completed_at?: string | null
          completed_steps?: number | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          progress?: Json | null
          started_at?: string | null
          status?: string
          total_steps?: number | null
          updated_at?: string | null
          workflow_name?: string
          workflow_run_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      analyze_multi_variable_pricing: {
        Args: { days_back?: number; min_sales?: number }
        Returns: {
          age_factor: number
          avg_price: number
          base_value_estimate: number
          overall_rating: number
          player_age: number
          player_position: string
          position_premium: number
          sale_count: number
          trimmed_avg_price: number
        }[]
      }
      calculate_base_player_value: {
        Args: { player_overall: number }
        Returns: number
      }
      calculate_comprehensive_player_value: {
        Args: {
          player_age: number
          player_overall: number
          player_position: string
        }
        Returns: number
      }
      calculate_ema_from_sales_data: {
        Args: { sales_data: Json }
        Returns: number
      }
      get_contract_stats_for_player: {
        Args: {
          age_max?: number
          age_min?: number
          overall_max?: number
          overall_min?: number
          player_id: number
          position_filter?: string
        }
        Returns: {
          avg_revenue_share: number
          division: number
          max_revenue_share: number
          min_revenue_share: number
          total_contracts: number
        }[]
      }
      get_favorite_players: {
        Args: { limit_count?: number }
        Returns: {
          age: number
          club_name: string
          favorite_count: number
          first_name: string
          id: number
          last_name: string
          market_value_estimate: number
          overall: number
          primary_position: string
        }[]
      }
      get_filter_counts: {
        Args: {
          age_max_filter?: number
          age_min_filter?: number
          applied_best_positions?: string[]
          applied_clubs?: string[]
          applied_nationalities?: string[]
          applied_owners?: string[]
          applied_positions?: string[]
          applied_preferred_foot?: string
          applied_secondary_positions?: string[]
          authenticated_wallet_address?: string
          best_overall_max_filter?: number
          best_overall_min_filter?: number
          defense_max_filter?: number
          defense_min_filter?: number
          dribbling_max_filter?: number
          dribbling_min_filter?: number
          favourites_filter?: string
          height_max_filter?: number
          height_min_filter?: number
          market_value_max_filter?: number
          market_value_min_filter?: number
          overall_max_filter?: number
          overall_min_filter?: number
          pace_max_filter?: number
          pace_min_filter?: number
          passing_max_filter?: number
          passing_min_filter?: number
          physical_max_filter?: number
          physical_min_filter?: number
          price_diff_max_filter?: number
          price_diff_min_filter?: number
          search_text?: string
          selected_tags?: string[]
          shooting_max_filter?: number
          shooting_min_filter?: number
          status_filter?: string[]
          tags_match_all?: boolean
          wallet_address_filter?: string
        }
        Returns: Json
      }
      get_filter_options: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_filter_options_paginated: {
        Args: {
          offset_value?: number
          option_type: string
          page_size?: number
          search_term?: string
        }
        Returns: Json
      }
      get_sales_price_vs_age_graph: {
        Args: { days_back?: number }
        Returns: {
          avg_price: number
          max_price: number
          min_price: number
          player_age: number
          sale_count: number
          trimmed_avg_price: number
          trimmed_sale_count: number
        }[]
      }
      get_sales_price_vs_overall_graph: {
        Args: { days_back?: number }
        Returns: {
          avg_price: number
          max_price: number
          min_price: number
          overall_rating: number
          sale_count: number
          trimmed_avg_price: number
          trimmed_sale_count: number
        }[]
      }
      get_sales_price_vs_position_graph: {
        Args: { days_back?: number }
        Returns: {
          avg_price: number
          max_price: number
          min_price: number
          player_position: string
          position_order: number
          sale_count: number
          trimmed_avg_price: number
          trimmed_sale_count: number
        }[]
      }
      get_top_owners: {
        Args: { limit_count?: number }
        Returns: {
          avg_overall: number
          owner_name: string
          owner_wallet_address: string
          player_count: number
          total_value: number
        }[]
      }
      get_total_sales_volume: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      test_pricing_model_accuracy: {
        Args: { days_back?: number; sample_size?: number }
        Returns: {
          accuracy_within_10_percent: number
          accuracy_within_20_percent: number
          accuracy_within_30_percent: number
          avg_absolute_error: number
          avg_actual_price: number
          avg_percentage_error: number
          avg_predicted_price: number
          median_percentage_error: number
          test_count: number
        }[]
      }
      update_all_player_base_values: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_all_players_market_values: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_player_market_value: {
        Args: { player_id: number }
        Returns: undefined
      }
      update_player_market_value_fast: {
        Args: { player_id: number }
        Returns: undefined
      }
      update_players_market_values_batch: {
        Args: { batch_size?: number; offset_val?: number }
        Returns: {
          error_count: number
          processed_count: number
          updated_count: number
        }[]
      }
      update_sales_summary: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      update_total_player_count: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_count: number
          updated_at: string
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

