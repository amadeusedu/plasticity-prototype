/**
 * plasticityBackend.ts
 * High-level helper functions for saving Plasticity game data to Supabase.
 */

import { getSupabaseClient } from './supabaseClient';
import { GameEventsRow, GameSessionsRow } from '../lib/supabase/types';

type NullableNumber = number | null;

export interface GameResult {
  gameId: string;
  sessionId: string;
  score: NullableNumber;
  accuracy: NullableNumber;
  numTrials?: NullableNumber;
  numErrors?: NullableNumber;
  avgReactionTimeMs?: NullableNumber;
  maxDifficultyReached?: NullableNumber;
  completed: boolean;
  extra?: Record<string, unknown> | null;
}

export interface GameEventPayload {
  type: string;
  [key: string]: unknown;
}

export interface GameResultMessage {
  type: 'GAME_RESULT';
  sessionId: string;
  gameId: string;
  result: GameResult;
  events?: GameEventPayload[];
}

function mapGameResultToUpdate(result: GameResult): Partial<GameSessionsRow> {
  return {
    score: result.score ?? null,
    accuracy: result.accuracy ?? null,
    completed: result.completed,
    extra: result.extra ?? null,
    finished_at: new Date().toISOString(),
  };
}

/**
 * Create a new game session row for a user and game.
 */
export async function createGameSession(params: {
  userId: string;
  gameId: string;
  difficultyLevel: number;
  variant?: string | null;
}): Promise<{ id: string }> {
  const { userId, gameId, difficultyLevel, variant = null } = params;
  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from('game_sessions')
    .insert({
      user_id: userId,
      game_id: gameId,
      difficulty_level: difficultyLevel,
      variant,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();

  if (error || !data) {
    console.error('createGameSession error', error);
    throw new Error('Failed to create game session');
  }

  return { id: data.id as string };
}

/**
 * Complete a game session with the final result.
 */
export async function completeGameSession(sessionId: string, result: GameResult): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('game_sessions')
    .update(mapGameResultToUpdate(result))
    .eq('id', sessionId);

  if (error) {
    console.error('completeGameSession error', error);
    throw new Error('Failed to complete game session');
  }
}

/**
 * Log a single game event (e.g., trial data) for a session.
 */
export async function logGameEvent(sessionId: string, event: GameEventPayload): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from('game_events')
    .insert({
      session_id: sessionId,
      event_type: event.type,
      payload: event as GameEventsRow['payload'],
    });

  if (error) {
    console.error('logGameEvent error', error);
    throw new Error('Failed to log game event');
  }
}

/**
 * Convenience function to save a GAME_RESULT-style message coming from an iframe.
 */
export async function saveGameResultAndEventsFromMessage(msg: GameResultMessage): Promise<void> {
  if (!msg || msg.type !== 'GAME_RESULT') {
    throw new Error('Invalid message type for saveGameResultAndEventsFromMessage');
  }

  await completeGameSession(msg.sessionId, msg.result);

  if (msg.events && msg.events.length > 0) {
    await Promise.all(msg.events.map((event) => logGameEvent(msg.sessionId, event)));
  }
}
