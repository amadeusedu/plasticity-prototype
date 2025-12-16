export type Json = any;

export interface Database {
  public: {
    Tables: {
      cognitive_profiles: {
        Row: {
          user_id: string;
          profile: Json;
          computed_at: string;
          created_at: string | null;
        };
        Insert: {
          user_id: string;
          profile: Json;
          computed_at: string;
          created_at?: string | null;
        };
        Update: {
          user_id?: string;
          profile?: Json;
          computed_at?: string;
          created_at?: string | null;
        };
      };
      game_events: {
        Row: {
          id: string;
          session_id: string;
          event_type: string;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          event_type: string;
          payload: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          event_type?: string;
          payload?: Json;
          created_at?: string;
        };
      };
      game_sessions: {
        Row: {
          id: string;
          user_id: string;
          game_id: string;
          difficulty_level: number | null;
          difficulty_end: number | null;
          variant: string | null;
          started_at: string;
          finished_at: string | null;
          duration_ms: number | null;
          score: number | null;
          accuracy: number | null;
          completed: boolean;
          summary: Json | null;
          extra: Json | null;
          app_version: string | null;
          game_version: string | null;
          metadata: Json | null;
          created_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          game_id: string;
          difficulty_level?: number | null;
          difficulty_end?: number | null;
          variant?: string | null;
          started_at?: string;
          finished_at?: string | null;
          duration_ms?: number | null;
          score?: number | null;
          accuracy?: number | null;
          completed?: boolean;
          summary?: Json | null;
          extra?: Json | null;
          app_version?: string | null;
          game_version?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          game_id?: string;
          difficulty_level?: number | null;
          difficulty_end?: number | null;
          variant?: string | null;
          started_at?: string;
          finished_at?: string | null;
          duration_ms?: number | null;
          score?: number | null;
          accuracy?: number | null;
          completed?: boolean;
          summary?: Json | null;
          extra?: Json | null;
          app_version?: string | null;
          game_version?: string | null;
          metadata?: Json | null;
          created_at?: string | null;
        };
      };
      game_trials: {
        Row: {
          id: string;
          session_id: string;
          trial_index: number;
          trial_data: Json;
          score: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          trial_index: number;
          trial_data: Json;
          score: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          trial_index?: number;
          trial_data?: Json;
          score?: Json;
          created_at?: string;
        };
      };
    };
  };
}
