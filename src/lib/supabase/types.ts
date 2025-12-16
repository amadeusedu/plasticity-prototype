export interface GameSessionsRow {
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
  summary: Record<string, unknown> | null;
  extra: Record<string, unknown> | null;
  app_version: string | null;
  game_version: string | null;
  metadata: Record<string, unknown> | null;
}

export interface GameEventsRow {
  id: string;
  session_id: string;
  event_type: string;
  payload: Record<string, unknown>;
  created_at: string;
}

export interface GameTrialsRow {
  id: string;
  session_id: string;
  trial_index: number;
  trial_data: Record<string, unknown>;
  score: Record<string, unknown>;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      game_sessions: {
        Row: GameSessionsRow;
        Insert: Partial<GameSessionsRow> & {
          user_id: string;
          game_id: string;
        };
        Update: Partial<GameSessionsRow>;
      };
      game_events: {
        Row: GameEventsRow;
        Insert: Partial<GameEventsRow> & {
          session_id: string;
          event_type: string;
          payload: Record<string, unknown>;
        };
        Update: Partial<GameEventsRow>;
      };
      game_trials: {
        Row: GameTrialsRow;
        Insert: Partial<GameTrialsRow> & {
          session_id: string;
          trial_index: number;
          trial_data: Record<string, unknown>;
          score: Record<string, unknown>;
        };
        Update: Partial<GameTrialsRow>;
      };
    };
  };
}
