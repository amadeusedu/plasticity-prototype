/**
 * plasticityBackend.ts
 * High-level helper functions for saving Plasticity game data to Supabase.
 */

import { resultsService } from '../lib/results/ResultsService';
import { ResultSummary } from '../lib/results/schema';
import { getSupabaseClient } from '../lib/supabase/client';
import { GameEventsRow } from '../lib/supabase/types';

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

/**
 * Create a new game session row for a user and game.
 */
export async function createGameSession(params: {
  userId: string;
  gameId: string;
  difficultyLevel: number;
  variant?: string | null;
}): Promise<{ id: string }> {
  const { gameId, difficultyLevel, variant = null } = params;
  const { id } = await resultsService.createSession({
    gameId,
    difficultyStart: difficultyLevel,
    variant,
    metadata: variant ? { variant } : null,
  });

  return { id };
}

/**
 * Complete a game session with the final result.
 */
export async function completeGameSession(sessionId: string, result: GameResult): Promise<void> {
  const summary: ResultSummary = {
    accuracyAvg: result.accuracy ?? 0,
    timeAvgMs: result.avgReactionTimeMs ?? 0,
    errorsTotal: result.numErrors ?? 0,
    scoreTotal: result.score ?? 0,
  };

  await resultsService.finalizeSession({
    sessionId,
    difficultyEnd: result.maxDifficultyReached ?? null,
    summary,
  });
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
