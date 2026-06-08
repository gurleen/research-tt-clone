export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      evt_content_link_click: {
        Row: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          latency_ms: number;
          server_received_at: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp_click: string;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Insert: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          latency_ms: number;
          server_received_at?: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp_click: string;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Update: {
          community?: Database["public"]["Enums"]["community"];
          event_id?: string;
          latency_ms?: number;
          server_received_at?: string;
          session_id?: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          timestamp_click?: string;
          video_id?: string;
          video_type?: Database["public"]["Enums"]["video_type"];
        };
        Relationships: [
          {
            foreignKeyName: "evt_content_link_click_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "evt_content_link_click_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["video_id"];
          },
        ];
      };
      evt_content_link_display: {
        Row: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          server_received_at: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp_display: string;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Insert: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          server_received_at?: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp_display: string;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Update: {
          community?: Database["public"]["Enums"]["community"];
          event_id?: string;
          server_received_at?: string;
          session_id?: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          timestamp_display?: string;
          video_id?: string;
          video_type?: Database["public"]["Enums"]["video_type"];
        };
        Relationships: [
          {
            foreignKeyName: "evt_content_link_display_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "evt_content_link_display_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["video_id"];
          },
        ];
      };
      evt_content_stub_exit: {
        Row: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          server_received_at: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          time_on_stub_ms: number;
          timestamp_exit: string;
          video_id: string;
        };
        Insert: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          server_received_at?: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          time_on_stub_ms: number;
          timestamp_exit: string;
          video_id: string;
        };
        Update: {
          community?: Database["public"]["Enums"]["community"];
          event_id?: string;
          server_received_at?: string;
          session_id?: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          time_on_stub_ms?: number;
          timestamp_exit?: string;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evt_content_stub_exit_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "evt_content_stub_exit_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["video_id"];
          },
        ];
      };
      evt_familiarity_response: {
        Row: {
          account_id: string;
          event_id: string;
          position: number;
          rating: number;
          server_received_at: string;
          session_id: string;
          timestamp: string;
        };
        Insert: {
          account_id: string;
          event_id: string;
          position: number;
          rating: number;
          server_received_at?: string;
          session_id: string;
          timestamp: string;
        };
        Update: {
          account_id?: string;
          event_id?: string;
          position?: number;
          rating?: number;
          server_received_at?: string;
          session_id?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evt_familiarity_response_account_id_fkey";
            columns: ["account_id"];
            isOneToOne: false;
            referencedRelation: "familiarity_accounts";
            referencedColumns: ["account_id"];
          },
          {
            foreignKeyName: "evt_familiarity_response_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
        ];
      };
      evt_interest_prompt_display: {
        Row: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          server_received_at: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp_display: string;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Insert: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          server_received_at?: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp_display: string;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Update: {
          community?: Database["public"]["Enums"]["community"];
          event_id?: string;
          server_received_at?: string;
          session_id?: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          timestamp_display?: string;
          video_id?: string;
          video_type?: Database["public"]["Enums"]["video_type"];
        };
        Relationships: [
          {
            foreignKeyName: "evt_interest_prompt_display_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "evt_interest_prompt_display_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["video_id"];
          },
        ];
      };
      evt_interest_response: {
        Row: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          latency_ms: number;
          response: boolean;
          server_received_at: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp_response: string;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Insert: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          latency_ms: number;
          response: boolean;
          server_received_at?: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp_response: string;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Update: {
          community?: Database["public"]["Enums"]["community"];
          event_id?: string;
          latency_ms?: number;
          response?: boolean;
          server_received_at?: string;
          session_id?: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          timestamp_response?: string;
          video_id?: string;
          video_type?: Database["public"]["Enums"]["video_type"];
        };
        Relationships: [
          {
            foreignKeyName: "evt_interest_response_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "evt_interest_response_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["video_id"];
          },
        ];
      };
      evt_playlist_complete: {
        Row: {
          event_id: string;
          server_received_at: string;
          session_id: string;
          timestamp: string;
        };
        Insert: {
          event_id: string;
          server_received_at?: string;
          session_id: string;
          timestamp: string;
        };
        Update: {
          event_id?: string;
          server_received_at?: string;
          session_id?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evt_playlist_complete_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
        ];
      };
      evt_session_start: {
        Row: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          server_received_at: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp: string;
        };
        Insert: {
          community: Database["public"]["Enums"]["community"];
          event_id: string;
          server_received_at?: string;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          timestamp: string;
        };
        Update: {
          community?: Database["public"]["Enums"]["community"];
          event_id?: string;
          server_received_at?: string;
          session_id?: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evt_session_start_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
        ];
      };
      evt_survey_complete: {
        Row: {
          event_id: string;
          server_received_at: string;
          session_id: string;
          timestamp: string;
        };
        Insert: {
          event_id: string;
          server_received_at?: string;
          session_id: string;
          timestamp: string;
        };
        Update: {
          event_id?: string;
          server_received_at?: string;
          session_id?: string;
          timestamp?: string;
        };
        Relationships: [
          {
            foreignKeyName: "evt_survey_complete_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: true;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
        ];
      };
      experiment_config: {
        Row: {
          community: Database["public"]["Enums"]["community"];
          filler_count_max: number;
          filler_count_min: number;
          ingroup_count_max: number;
          ingroup_count_min: number;
          prompt_min_spacing: number;
          prompt_probability: number;
          updated_at: string;
        };
        Insert: {
          community: Database["public"]["Enums"]["community"];
          filler_count_max: number;
          filler_count_min: number;
          ingroup_count_max: number;
          ingroup_count_min: number;
          prompt_min_spacing?: number;
          prompt_probability?: number;
          updated_at?: string;
        };
        Update: {
          community?: Database["public"]["Enums"]["community"];
          filler_count_max?: number;
          filler_count_min?: number;
          ingroup_count_max?: number;
          ingroup_count_min?: number;
          prompt_min_spacing?: number;
          prompt_probability?: number;
          updated_at?: string;
        };
        Relationships: [];
      };
      familiarity_accounts: {
        Row: {
          account_handle: string;
          account_id: string;
          account_name: string;
          community: Database["public"]["Enums"]["community"] | null;
          is_stimulus: boolean;
          profile_thumbnail_url: string | null;
        };
        Insert: {
          account_handle: string;
          account_id: string;
          account_name: string;
          community?: Database["public"]["Enums"]["community"] | null;
          is_stimulus: boolean;
          profile_thumbnail_url?: string | null;
        };
        Update: {
          account_handle?: string;
          account_id?: string;
          account_name?: string;
          community?: Database["public"]["Enums"]["community"] | null;
          is_stimulus?: boolean;
          profile_thumbnail_url?: string | null;
        };
        Relationships: [];
      };
      platform_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: string;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: string;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: string;
        };
        Relationships: [];
      };
      session_videos: {
        Row: {
          position: number;
          session_id: string;
          show_interest_prompt: boolean;
          video_id: string;
        };
        Insert: {
          position: number;
          session_id: string;
          show_interest_prompt?: boolean;
          video_id: string;
        };
        Update: {
          position?: number;
          session_id?: string;
          show_interest_prompt?: boolean;
          video_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "session_videos_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "sessions";
            referencedColumns: ["session_id"];
          },
          {
            foreignKeyName: "session_videos_video_id_fkey";
            columns: ["video_id"];
            isOneToOne: false;
            referencedRelation: "videos";
            referencedColumns: ["video_id"];
          },
        ];
      };
      sessions: {
        Row: {
          assigned_at: string;
          community: Database["public"]["Enums"]["community"];
          created_at: string;
          current_position: number;
          session_id: string;
          source_type: Database["public"]["Enums"]["source_type"];
          status: string;
        };
        Insert: {
          assigned_at?: string;
          community: Database["public"]["Enums"]["community"];
          created_at?: string;
          current_position?: number;
          session_id?: string;
          source_type: Database["public"]["Enums"]["source_type"];
          status?: string;
        };
        Update: {
          assigned_at?: string;
          community?: Database["public"]["Enums"]["community"];
          created_at?: string;
          current_position?: number;
          session_id?: string;
          source_type?: Database["public"]["Enums"]["source_type"];
          status?: string;
        };
        Relationships: [];
      };
      stub_content: {
        Row: {
          body: string | null;
          community: Database["public"]["Enums"]["community"];
          updated_at: string;
        };
        Insert: {
          body?: string | null;
          community: Database["public"]["Enums"]["community"];
          updated_at?: string;
        };
        Update: {
          body?: string | null;
          community?: Database["public"]["Enums"]["community"];
          updated_at?: string;
        };
        Relationships: [];
      };
      videos: {
        Row: {
          account_handle: string;
          account_name: string;
          active: boolean;
          central_issue: string | null;
          community: Database["public"]["Enums"]["community"] | null;
          created_at: string;
          duration_ms: number | null;
          media_url: string;
          profile_thumbnail_url: string;
          source_type: Database["public"]["Enums"]["source_type"] | null;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Insert: {
          account_handle: string;
          account_name: string;
          active?: boolean;
          central_issue?: string | null;
          community?: Database["public"]["Enums"]["community"] | null;
          created_at?: string;
          duration_ms?: number | null;
          media_url: string;
          profile_thumbnail_url: string;
          source_type?: Database["public"]["Enums"]["source_type"] | null;
          video_id: string;
          video_type: Database["public"]["Enums"]["video_type"];
        };
        Update: {
          account_handle?: string;
          account_name?: string;
          active?: boolean;
          central_issue?: string | null;
          community?: Database["public"]["Enums"]["community"] | null;
          created_at?: string;
          duration_ms?: number | null;
          media_url?: string;
          profile_thumbnail_url?: string;
          source_type?: Database["public"]["Enums"]["source_type"] | null;
          video_id?: string;
          video_type?: Database["public"]["Enums"]["video_type"];
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      is_admin: { Args: never; Returns: boolean };
    };
    Enums: {
      community: "armenian" | "sikh" | "iranian";
      source_type: "micro_influencer" | "institutional";
      video_type: "ingroup" | "filler";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      community: ["armenian", "sikh", "iranian"],
      source_type: ["micro_influencer", "institutional"],
      video_type: ["ingroup", "filler"],
    },
  },
} as const;
