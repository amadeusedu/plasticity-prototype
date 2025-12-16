import { getSupabaseClient, getSupabaseUserId } from '../supabase/client';
import { ResultSummary } from '../results/schema';
import { CognitiveDomain, domains, getDomainForGame } from './domainConfig';
import { listInsights } from './sessionInsights';

export interface DomainScore {
  domain: CognitiveDomain;
  score: number;
  supportingSessions: number;
}

export interface CognitiveProfile {
  computedAt: string;
  domainScores: DomainScore[];
  weakestDomain: CognitiveDomain;
  strongestDomain: CognitiveDomain;
}

const PROFILE_CACHE_KEY = 'premium.cognitiveProfile';

function normalizeScore(summary: ResultSummary): number {
  const accuracyScore = summary.accuracyAvg * 100;
  const speedScore = Math.max(30, 100 - summary.timeAvgMs / 25);
  const composite = 0.6 * accuracyScore + 0.4 * speedScore;
  return Math.max(1, Math.min(100, composite));
}

function cacheProfile(profile: CognitiveProfile): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch (error) {
    console.warn('Failed to cache profile', error);
  }
}

export function loadCachedProfile(): CognitiveProfile | null {
  if (typeof localStorage === 'undefined') return null;
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CognitiveProfile;
  } catch (error) {
    console.warn('Failed to load cached profile', error);
    return null;
  }
}

async function persistProfile(profile: CognitiveProfile): Promise<void> {
  try {
    const supabase = getSupabaseClient();
    const userId = await getSupabaseUserId();
    if (!userId) return;
    await supabase.from('cognitive_profiles').upsert({
      user_id: userId,
      profile,
      computed_at: profile.computedAt,
    });
  } catch (error) {
    console.warn('Unable to persist cognitive profile; ensure table exists', error);
  }
}

export async function computeCognitiveProfile(): Promise<CognitiveProfile> {
  const insights = listInsights();
  const scores: Record<CognitiveDomain, number[]> = {
    Speed: [],
    Attention: [],
    Memory: [],
    Flexibility: [],
    Reasoning: [],
  };

  insights.forEach((insight) => {
    const domain = insight.domain ?? getDomainForGame(insight.gameId);
    if (!domain) return;
    scores[domain].push(normalizeScore(insight.summary));
  });

  const domainScores: DomainScore[] = domains.map((domain) => {
    const values = scores[domain.id];
    const score = values.length ? values.reduce((acc, value) => acc + value, 0) / values.length : 40;
    return { domain: domain.id, score: Math.round(score), supportingSessions: values.length };
  });

  const sorted = [...domainScores].sort((a, b) => b.score - a.score);
  const profile: CognitiveProfile = {
    computedAt: new Date().toISOString(),
    domainScores,
    strongestDomain: sorted[0]?.domain ?? 'Attention',
    weakestDomain: sorted[sorted.length - 1]?.domain ?? 'Memory',
  };

  cacheProfile(profile);
  await persistProfile(profile);
  return profile;
}
