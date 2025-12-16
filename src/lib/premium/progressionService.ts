import { ResultSummary } from '../results/schema';
import { CognitiveDomain } from './domainConfig';

export type Rank = 'Foundation' | 'Focused' | 'Advanced' | 'Peak';

export interface ProgressionState {
  xp: number;
  rank: Rank;
  streak: number;
  lastSessionDate?: string;
  sessionsToday: number;
}

const STORAGE_KEY = 'premium.progression';

function getStore(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

function loadState(): ProgressionState {
  const store = getStore();
  if (!store) return { xp: 0, rank: 'Foundation', streak: 0, sessionsToday: 0 };
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return { xp: 0, rank: 'Foundation', streak: 0, sessionsToday: 0 };
    return JSON.parse(raw) as ProgressionState;
  } catch (error) {
    console.warn('Failed to read progression state', error);
    return { xp: 0, rank: 'Foundation', streak: 0, sessionsToday: 0 };
  }
}

function saveState(state: ProgressionState): void {
  const store = getStore();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn('Failed to persist progression state', error);
  }
}

function resolveRank(xp: number): Rank {
  if (xp > 2500) return 'Peak';
  if (xp > 1500) return 'Advanced';
  if (xp > 600) return 'Focused';
  return 'Foundation';
}

export interface SessionAllowanceResult {
  allowed: boolean;
  reason?: string;
}

export function canStartSession(isPremium: boolean): SessionAllowanceResult {
  const state = loadState();
  const today = new Date().toDateString();
  const sessionsToday = state.lastSessionDate === today ? state.sessionsToday : 0;

  if (!isPremium && sessionsToday >= 2) {
    return { allowed: false, reason: 'Daily session limit reached for free access.' };
  }
  return { allowed: true };
}

export function recordSessionCompletion(params: {
  summary: ResultSummary;
  durationMs: number;
  domain?: CognitiveDomain;
  startedAt: string;
}): ProgressionState {
  const state = loadState();
  const today = new Date(params.startedAt).toDateString();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toDateString();

  const sessionsToday = state.lastSessionDate === today ? state.sessionsToday + 1 : 1;
  const streak = state.lastSessionDate === yesterday ? state.streak + 1 : 1;
  const xpEarned = Math.max(25, Math.round(params.summary.scoreTotal / 15));
  const nextXp = state.xp + xpEarned;

  const nextState: ProgressionState = {
    xp: nextXp,
    rank: resolveRank(nextXp),
    streak,
    lastSessionDate: today,
    sessionsToday,
  };

  saveState(nextState);
  return nextState;
}

export function getProgressionSnapshot(): ProgressionState {
  return loadState();
}
