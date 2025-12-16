export interface GameSessionsRow {
  id: string;
  user_id: string;
  game_id: string;
  difficulty_level: number | null;
  variant: string | null;
  started_at: string;
  finished_at: string | null;
  score: number | null;
  accuracy: number | null;
  completed: boolean;
  extra: Record<string, unknown> | null;
}

export interface GameEventsRow {
  id: string;
  session_id: string;
  event_type: string;
  payload: Record<string, unknown>;
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
    };
  };
}
