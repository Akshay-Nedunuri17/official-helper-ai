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
      complaints: {
        Row: {
          address: string | null
          admin_response: string | null
          category: string
          created_at: string
          description: string
          id: string
          latitude: number | null
          longitude: number | null
          photo_url: string | null
          status: string
          title: string
          tracking_number: string
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          admin_response?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          status?: string
          title: string
          tracking_number?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          admin_response?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          latitude?: number | null
          longitude?: number | null
          photo_url?: string | null
          status?: string
          title?: string
          tracking_number?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          scheme_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          scheme_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          scheme_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      offices: {
        Row: {
          address: string
          city: string
          created_at: string
          department: string
          email: string | null
          hours: string | null
          id: string
          latitude: number | null
          longitude: number | null
          name: string
          phone: string | null
          pincode: string | null
          state: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          department: string
          email?: string | null
          hours?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name: string
          phone?: string | null
          pincode?: string | null
          state: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          department?: string
          email?: string | null
          hours?: string | null
          id?: string
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string | null
          pincode?: string | null
          state?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          preferred_language: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          preferred_language?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          preferred_language?: string
          updated_at?: string
        }
        Relationships: []
      }
      scheme_views: {
        Row: {
          created_at: string
          id: string
          scheme_id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          scheme_id: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          scheme_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scheme_views_scheme_id_fkey"
            columns: ["scheme_id"]
            isOneToOne: false
            referencedRelation: "schemes"
            referencedColumns: ["id"]
          },
        ]
      }
      schemes: {
        Row: {
          apply_url: string | null
          benefits_en: string | null
          benefits_te: string | null
          caste_categories: string[] | null
          category: string
          created_at: string
          description_en: string
          description_te: string | null
          district: string | null
          documents: string[]
          eligibility_en: string | null
          eligibility_te: string | null
          gender: string | null
          id: string
          income_limit: number | null
          is_trending: boolean
          last_updated: string | null
          max_age: number | null
          min_age: number | null
          ministry: string | null
          minority_only: boolean
          name_en: string
          name_te: string | null
          occupation: string | null
          official_url: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          benefits_en?: string | null
          benefits_te?: string | null
          caste_categories?: string[] | null
          category: string
          created_at?: string
          description_en: string
          description_te?: string | null
          district?: string | null
          documents?: string[]
          eligibility_en?: string | null
          eligibility_te?: string | null
          gender?: string | null
          id?: string
          income_limit?: number | null
          is_trending?: boolean
          last_updated?: string | null
          max_age?: number | null
          min_age?: number | null
          ministry?: string | null
          minority_only?: boolean
          name_en: string
          name_te?: string | null
          occupation?: string | null
          official_url?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          benefits_en?: string | null
          benefits_te?: string | null
          caste_categories?: string[] | null
          category?: string
          created_at?: string
          description_en?: string
          description_te?: string | null
          district?: string | null
          documents?: string[]
          eligibility_en?: string | null
          eligibility_te?: string | null
          gender?: string | null
          id?: string
          income_limit?: number | null
          is_trending?: boolean
          last_updated?: string | null
          max_age?: number | null
          min_age?: number | null
          ministry?: string | null
          minority_only?: boolean
          name_en?: string
          name_te?: string | null
          occupation?: string | null
          official_url?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      search_logs: {
        Row: {
          created_at: string
          id: string
          query: string
          results_count: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          query: string
          results_count?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          query?: string
          results_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      services: {
        Row: {
          created_at: string
          department: string | null
          description_en: string | null
          description_te: string | null
          documents: string[]
          fee: string | null
          id: string
          name_en: string
          name_te: string | null
          procedure_en: string | null
          procedure_te: string | null
          processing_time: string | null
        }
        Insert: {
          created_at?: string
          department?: string | null
          description_en?: string | null
          description_te?: string | null
          documents?: string[]
          fee?: string | null
          id?: string
          name_en: string
          name_te?: string | null
          procedure_en?: string | null
          procedure_te?: string | null
          processing_time?: string | null
        }
        Update: {
          created_at?: string
          department?: string | null
          description_en?: string | null
          description_te?: string | null
          documents?: string[]
          fee?: string | null
          id?: string
          name_en?: string
          name_te?: string | null
          procedure_en?: string | null
          procedure_te?: string | null
          processing_time?: string | null
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
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
