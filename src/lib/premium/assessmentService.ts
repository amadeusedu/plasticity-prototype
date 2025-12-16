import { v4 as uuidv4 } from 'uuid';
import { GamePlugin } from '../../games/types';
import { computeCognitiveProfile, loadCachedProfile } from './profileService';
import { recordSessionInsight, SessionInsight, listInsights } from './sessionInsights';

export interface AssessmentRun {
  id: string;
  startedAt: string;
  completedGameIds: string[];
  requiredGameIds: string[];
  profile?: Awaited<ReturnType<typeof computeCognitiveProfile>>;
}

const STORAGE_KEY = 'premium.assessment';

function getStore(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

function loadRun(): AssessmentRun | null {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AssessmentRun;
  } catch (error) {
    console.warn('Failed to load assessment run', error);
    return null;
  }
}

function saveRun(run: AssessmentRun | null): void {
  const store = getStore();
  if (!store) return;
  try {
    if (!run) {
      store.removeItem(STORAGE_KEY);
      return;
    }
    store.setItem(STORAGE_KEY, JSON.stringify(run));
  } catch (error) {
    console.warn('Failed to save assessment run', error);
  }
}

export const baselineGameOrder = [
  'simple-reaction',
  'go-no-go',
  'n-back',
  'symbol-match-coding',
  'mental-rotation-grid',
];

export function getAssessmentRun(): AssessmentRun {
  const cached = loadRun();
  if (cached) return cached;
  const run: AssessmentRun = {
    id: uuidv4(),
    startedAt: new Date().toISOString(),
    completedGameIds: [],
    requiredGameIds: baselineGameOrder,
  };
  saveRun(run);
  return run;
}

export function markAssessmentCompletion(gameId: string): AssessmentRun {
  const current = getAssessmentRun();
  if (!current.completedGameIds.includes(gameId)) {
    current.completedGameIds.push(gameId);
    saveRun(current);
  }
  return current;
}

export function recordAssessmentInsight(insight: SessionInsight): AssessmentRun {
  recordSessionInsight(insight);
  markAssessmentCompletion(insight.gameId);
  return getAssessmentRun();
}

export function isAssessmentComplete(): boolean {
  const run = getAssessmentRun();
  return run.requiredGameIds.every((id) => run.completedGameIds.includes(id));
}

export function getShortConfigForAssessment(plugin: GamePlugin) {
  if (plugin.session.mode === 'fixed') {
    return { ...plugin.session, trials: Math.min(plugin.session.trials, 8), countdownSeconds: 2 };
  }
  return { ...plugin.session, durationSeconds: Math.min(plugin.session.durationSeconds, 60), maxTrials: 12 };
}

export async function finalizeAssessmentProfile(): Promise<ReturnType<typeof computeCognitiveProfile>> {
  const profile = await computeCognitiveProfile();
  const run = getAssessmentRun();
  saveRun({ ...run, profile });
  return profile;
}

export function getCachedProfile(): ReturnType<typeof loadCachedProfile> {
  return loadCachedProfile();
}

export function listAssessmentInsights(): SessionInsight[] {
  const run = getAssessmentRun();
  const insights = listInsights();
  return insights.filter((item) => run.requiredGameIds.includes(item.gameId));
}

export function buildAssessmentSummary(): { profile?: ReturnType<typeof loadCachedProfile>; coverage: number } {
  const profile = loadCachedProfile();
  const run = getAssessmentRun();
  const coverage = Math.round((run.completedGameIds.length / run.requiredGameIds.length) * 100);
  return { profile, coverage };
}
