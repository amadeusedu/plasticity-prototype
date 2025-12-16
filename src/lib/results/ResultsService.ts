import { getSupabaseClient, getSupabaseUserId } from '../supabase/client';
import { GameEventsRow, GameSessionsRow, GameTrialsRow } from '../supabase/types';
import {
  ResultPayload,
  ResultPayloadSchema,
  ResultSummary,
  ResultSummarySchema,
  StandardScore,
  StandardScoreSchema,
  TrialResult,
  TrialResultSchema,
} from './schema';

interface CreateSessionParams {
  gameId: string;
  difficultyStart: number | null;
  variant?: string | null;
  metadata?: Record<string, unknown> | null;
  appVersion?: string | null;
  gameVersion?: string | null;
  sessionId?: string;
  startedAt?: string;
  idempotencyKey?: string;
}

interface FinalizeSessionParams {
  sessionId: string;
  difficultyEnd: number | null;
  summary: ResultSummary;
  endedAt?: string;
  durationMs?: number;
  appVersion?: string | null;
  gameVersion?: string | null;
}

interface PendingCreateAction extends CreateSessionParams {
  sessionId: string;
  userId: string;
  startedAt: string;
}

interface PendingTrialAction {
  sessionId: string;
  userId: string;
  trial: TrialResult;
}

interface PendingFinalizeAction extends FinalizeSessionParams {
  userId: string;
}

type PendingAction =
  | { type: 'create'; payload: PendingCreateAction }
  | { type: 'trial'; payload: PendingTrialAction }
  | { type: 'finalize'; payload: PendingFinalizeAction };

interface QueueStorage {
  load(): Promise<PendingAction[]>;
  save(queue: PendingAction[]): Promise<void>;
}

class MemoryQueueStorage implements QueueStorage {
  private queue: PendingAction[] = [];

  async load(): Promise<PendingAction[]> {
    return [...this.queue];
  }

  async save(queue: PendingAction[]): Promise<void> {
    this.queue = [...queue];
  }
}

class LocalStorageQueue implements QueueStorage {
  private readonly key = 'resultsService.pendingQueue';

  async load(): Promise<PendingAction[]> {
    if (typeof localStorage === 'undefined') return [];
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return [];
      return JSON.parse(raw) as PendingAction[];
    } catch (error) {
      console.warn('Failed to load pending queue from localStorage', error);
      return [];
    }
  }

  async save(queue: PendingAction[]): Promise<void> {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(queue));
    } catch (error) {
      console.warn('Failed to persist pending queue to localStorage', error);
    }
  }
}

function isNetworkLikeError(error: unknown): boolean {
  const message = (error as Error)?.message?.toLowerCase?.() ?? '';
  return (
    message.includes('fetch') ||
    message.includes('network') ||
    message.includes('offline') ||
    message.includes('timeout') ||
    message.includes('auth session') ||
    message.includes('signed in')
  );
}

function isMissingRelationOrColumn(error: unknown): boolean {
  const message = (error as Error)?.message?.toLowerCase?.() ?? '';
  return message.includes('does not exist') || message.includes('column') || message.includes('relation');
}

function withFallbackExtras(existing: GameSessionsRow | null, extras: Record<string, unknown>): Record<string, unknown> {
  const priorExtra = existing?.extra ?? {};
  return { ...priorExtra, ...extras };
}

function generateId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`;
}

export function formatRlsHint(error: Error): string {
  const message = error.message || 'Unknown Supabase error';
  if (message.toLowerCase().includes('permission') || message.toLowerCase().includes('rls')) {
    return `${message} — Is the user authenticated? RLS policies require auth.uid().`;
  }
  if (message.toLowerCase().includes('auth uid') || message.toLowerCase().includes('jwt')) {
    return `${message} — Check that Supabase auth session is present before writing results.`;
  }
  return message;
}

export class ResultsService {
  private supabase: ReturnType<typeof getSupabaseClient> | null = null;
  private readonly queue: QueueStorage;
  private supportsTrialTable: boolean | null = null;
  private supportsSessionExtensions = true;
  private backoffMs = 1000;
  private readonly maxBackoffMs = 30_000;
  private flushTimer: ReturnType<typeof setTimeout> | null = null;
  private isFlushing = false;

  private get client() {
    if (!this.supabase) {
      this.supabase = getSupabaseClient();
    }
    return this.supabase;
  }

  constructor(storage?: QueueStorage) {
    this.queue = storage ?? (typeof localStorage === 'undefined' ? new MemoryQueueStorage() : new LocalStorageQueue());
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.scheduleFlush(250));
    }
    this.scheduleFlush();
  }

  async createSession(params: CreateSessionParams): Promise<{ id: string; startedAt: string; userId: string }> {
    const userId = await this.requireUserId();
    const sessionId = params.sessionId ?? generateId();
    const idempotencyKey = params.idempotencyKey ?? sessionId;
    const startedAt = params.startedAt ?? new Date().toISOString();

    const payload: GameSessionsRow & { id: string } = {
      id: sessionId,
      user_id: userId,
      game_id: params.gameId,
      difficulty_level: params.difficultyStart,
      difficulty_end: null,
      variant: params.variant ?? null,
      started_at: startedAt,
      finished_at: null,
      duration_ms: null,
      score: null,
      accuracy: null,
      completed: false,
      summary: null,
      extra: params.metadata ?? null,
      app_version: params.appVersion ?? null,
      game_version: params.gameVersion ?? null,
      metadata: { ...(params.metadata ?? {}), idempotencyKey },
      created_at: null,
    };

    const insertPromise = this.client
      .from('game_sessions')
      .upsert(payload, { onConflict: 'id' })
      .select('id, started_at, user_id')
      .single();
    const { data, error } = await insertPromise;

    if (error) {
      if (isNetworkLikeError(error)) {
        await this.enqueue({ type: 'create', payload: { ...params, idempotencyKey, sessionId, userId, startedAt } });
        return { id: sessionId, startedAt, userId };
      }

      if (isMissingRelationOrColumn(error) && this.supportsSessionExtensions) {
        this.supportsSessionExtensions = false;
        const minimalPayload = {
          id: sessionId,
          user_id: userId,
          game_id: params.gameId,
          difficulty_level: params.difficultyStart,
          variant: params.variant ?? null,
          started_at: startedAt,
          completed: false,
          extra: params.metadata ?? null,
        };
        const retry = await this.client.from('game_sessions').insert(minimalPayload).select('id, started_at, user_id').single();
        if (retry.error) {
          throw retry.error;
        }
        return { id: sessionId, startedAt, userId };
      }

      throw error;
    }

    return { id: data.id as string, startedAt: data.started_at, userId: data.user_id };
  }

  async appendTrial(sessionId: string, index: number, trialData: Record<string, unknown>, score: StandardScore): Promise<void> {
    const userId = await this.requireUserId();
    const normalizedScore: StandardScore = { ...score, extras: score.extras ?? {} };
    const trial: TrialResult = { index, trialData, score: normalizedScore };
    const parsed = TrialResultSchema.safeParse(trial);
    if (!parsed.success) {
      throw new Error(`Invalid trial payload: ${parsed.error.message}`);
    }

    const trialRow: GameTrialsRow = {
      id: generateId(),
      session_id: sessionId,
      trial_index: index,
      trial_data: trialData,
      score: normalizedScore,
      created_at: new Date().toISOString(),
    };

    const attempt = await this.client.from('game_trials').upsert(trialRow, { onConflict: 'session_id,trial_index' });
    if (attempt.error) {
      if (isNetworkLikeError(attempt.error)) {
        await this.enqueue({ type: 'trial', payload: { sessionId, userId, trial } });
        return;
      }

      if (isMissingRelationOrColumn(attempt.error)) {
        this.supportsTrialTable = false;
        await this.logTrialAsEvent(sessionId, trial);
        return;
      }

      throw attempt.error;
    }

    await this.logTrialAsEvent(sessionId, trial);
  }

  async finalizeSession(params: FinalizeSessionParams): Promise<ResultPayload> {
    const userId = await this.requireUserId();
    const session = await this.fetchSession(params.sessionId);
    if (!session) {
      throw new Error('Session not found for finalizeSession');
    }

    const trials = await this.fetchTrials(params.sessionId);
    const endedAt = params.endedAt ?? new Date().toISOString();
    const durationMs = params.durationMs ?? Math.max(0, new Date(endedAt).getTime() - new Date(session.started_at).getTime());

    const payload: ResultPayload = {
      sessionId: params.sessionId,
      userId,
      gameId: session.game_id,
      startedAt: session.started_at,
      endedAt,
      durationMs,
      difficultyStart: session.difficulty_level ?? null,
      difficultyEnd: params.difficultyEnd,
      summary: ResultSummarySchema.parse(params.summary),
      trials,
      appVersion: params.appVersion ?? session.app_version ?? null,
      gameVersion: params.gameVersion ?? session.game_version ?? null,
    };

    ResultPayloadSchema.parse(payload);

    const updatePayload: Partial<GameSessionsRow> = {
      difficulty_end: params.difficultyEnd,
      finished_at: endedAt,
      duration_ms: durationMs,
      summary: payload.summary,
      score: payload.summary.scoreTotal,
      accuracy: payload.summary.accuracyAvg,
      completed: true,
      extra: withFallbackExtras(session, { resultPayload: payload }),
      app_version: payload.appVersion ?? null,
      game_version: payload.gameVersion ?? null,
    };

    const { error } = await this.client.from('game_sessions').update(updatePayload).eq('id', params.sessionId);

    if (error) {
      if (isNetworkLikeError(error)) {
        await this.enqueue({ type: 'finalize', payload: { ...params, userId, endedAt, durationMs } });
        return payload;
      }

      if (isMissingRelationOrColumn(error) || !this.supportsSessionExtensions) {
        this.supportsSessionExtensions = false;
        const fallbackUpdate: Partial<GameSessionsRow> = {
          finished_at: endedAt,
          score: payload.summary.scoreTotal,
          accuracy: payload.summary.accuracyAvg,
          completed: true,
          extra: withFallbackExtras(session, {
            summary: payload.summary,
            difficultyEnd: params.difficultyEnd,
            durationMs,
            appVersion: payload.appVersion,
            gameVersion: payload.gameVersion,
          }),
        };
        const retry = await this.client.from('game_sessions').update(fallbackUpdate).eq('id', params.sessionId);
        if (retry.error) {
          throw retry.error;
        }
        return payload;
      }

      throw error;
    }

    return payload;
  }

  async getSessionWithTrials(sessionId: string): Promise<{ session: GameSessionsRow; trials: TrialResult[] }> {
    const session = await this.fetchSession(sessionId);
    if (!session) throw new Error('Session not found');
    const trials = await this.fetchTrials(sessionId);
    return { session, trials };
  }

  async runSelfTest(): Promise<{ sessionId: string; trials: TrialResult[]; summary: ResultSummary }> {
    const session = await this.createSession({
      gameId: 'dev-menu-self-test',
      difficultyStart: 1,
      metadata: { source: 'dev-menu-self-test' },
    });

    const score: StandardScore = { accuracy: 1, timeMs: 100, errors: 0, scoreTotal: 1, extras: { selfTest: true } };
    await this.appendTrial(session.id, 0, { kind: 'self-test' }, score);

    const summary: ResultSummary = { accuracyAvg: 1, timeAvgMs: 100, errorsTotal: 0, scoreTotal: 1 };
    await this.finalizeSession({ sessionId: session.id, difficultyEnd: 2, summary });

    const { trials } = await this.getSessionWithTrials(session.id);
    return { sessionId: session.id, trials, summary };
  }

  private async fetchSession(sessionId: string): Promise<GameSessionsRow | null> {
    const { data, error } = await this.client.from('game_sessions').select('*').eq('id', sessionId).maybeSingle();
    if (error) throw error;
    return data;
  }

  private async fetchTrials(sessionId: string): Promise<TrialResult[]> {
    if (this.supportsTrialTable === false) {
      return this.fetchTrialsFromEvents(sessionId);
    }

    const { data, error } = await this.client
      .from('game_trials')
      .select('trial_index, trial_data, score')
      .eq('session_id', sessionId)
      .order('trial_index', { ascending: true });

    if (error) {
      if (isMissingRelationOrColumn(error)) {
        this.supportsTrialTable = false;
        return this.fetchTrialsFromEvents(sessionId);
      }
      throw error;
    }

    const trials = (data ?? []).map((trial: any) => ({
      index: trial.trial_index,
      trialData: trial.trial_data,
      score: StandardScoreSchema.parse(trial.score),
    }));

    return trials;
  }

  private async fetchTrialsFromEvents(sessionId: string): Promise<TrialResult[]> {
    const { data, error } = await this.client
      .from('game_events')
      .select('event_type, payload')
      .eq('session_id', sessionId)
      .in('event_type', ['trial', 'TRIAL'])
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data ?? [])
      .map((event: any) => {
        const payload = event.payload as { index?: number; trialData?: Record<string, unknown>; score?: StandardScore };
        if (payload && payload.index !== undefined && payload.trialData && payload.score) {
          const normalizedScore = { ...payload.score, extras: payload.score?.extras ?? {} } as StandardScore;
          const parsed = TrialResultSchema.safeParse({ index: payload.index, trialData: payload.trialData, score: normalizedScore });
          if (parsed.success) {
            return parsed.data;
          }
        }
        return null;
      })
      .filter((value: TrialResult | null): value is TrialResult => value !== null);
  }

  private async logTrialAsEvent(sessionId: string, trial: TrialResult): Promise<void> {
    const payload: Partial<GameEventsRow> = {
      session_id: sessionId,
      event_type: 'trial',
      payload: trial as unknown as GameEventsRow['payload'],
    };

    const { error } = await this.client.from('game_events').insert(payload);
    if (error && !isMissingRelationOrColumn(error)) {
      console.warn('Failed to log trial as event', error);
    }
  }

  private async requireUserId(): Promise<string> {
    try {
      const userId = await getSupabaseUserId();
      if (!userId) {
        throw new Error('Session expired. Please sign in again to continue saving progress.');
      }
      return userId;
    } catch (error) {
      const message = (error as Error)?.message?.toLowerCase?.() ?? '';
      if (message.includes('token') || message.includes('auth')) {
        throw new Error('Session expired. Please sign in again to continue saving progress.');
      }
      throw error;
    }
  }

  private async enqueue(action: PendingAction): Promise<void> {
    const queue = await this.queue.load();
    queue.push(action);
    await this.queue.save(queue);
    this.scheduleFlush();
  }

  private scheduleFlush(delayMs = this.backoffMs): void {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(async () => {
      this.flushTimer = null;
      const success = await this.flushPendingQueue();
      if (!success) {
        this.backoffMs = Math.min(this.backoffMs * 2, this.maxBackoffMs);
        this.scheduleFlush(this.backoffMs);
      } else {
        this.backoffMs = 1000;
      }
    }, delayMs);
  }

  private async flushPendingQueue(): Promise<boolean> {
    if (this.isFlushing) return false;
    this.isFlushing = true;
    const queue = await this.queue.load();
    if (!queue.length) {
      this.isFlushing = false;
      return true;
    }

    const remaining: PendingAction[] = [];
    for (const action of queue) {
      try {
        if (action.type === 'create') {
          await this.createSession({
            gameId: action.payload.gameId,
            difficultyStart: action.payload.difficultyStart,
            metadata: action.payload.metadata,
            appVersion: action.payload.appVersion,
            gameVersion: action.payload.gameVersion,
            sessionId: action.payload.sessionId,
            variant: action.payload.variant,
            startedAt: action.payload.startedAt,
            idempotencyKey: action.payload.idempotencyKey,
          });
        } else if (action.type === 'trial') {
          await this.appendTrial(
            action.payload.sessionId,
            action.payload.trial.index,
            action.payload.trial.trialData,
            action.payload.trial.score
          );
        } else if (action.type === 'finalize') {
          await this.finalizeSession({
            sessionId: action.payload.sessionId,
            difficultyEnd: action.payload.difficultyEnd,
            summary: action.payload.summary,
            endedAt: action.payload.endedAt,
            durationMs: action.payload.durationMs,
            appVersion: action.payload.appVersion,
            gameVersion: action.payload.gameVersion,
          });
        }
      } catch (error) {
        if (isNetworkLikeError(error)) {
          remaining.push(action);
        } else {
          console.warn('Dropping pending action after repeated failure', error);
        }
      }
    }

    await this.queue.save(remaining);
    this.isFlushing = false;
    return remaining.length === 0;
  }
}

export const resultsService = new ResultsService();
