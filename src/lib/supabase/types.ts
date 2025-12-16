import type { Database } from './database.types';

export type GameSessionsRow = Database['public']['Tables']['game_sessions']['Row'];
export type GameEventsRow = Database['public']['Tables']['game_events']['Row'];
export type GameTrialsRow = Database['public']['Tables']['game_trials']['Row'];
export type CognitiveProfileRow = Database['public']['Tables']['cognitive_profiles']['Row'];

export type { Database };
