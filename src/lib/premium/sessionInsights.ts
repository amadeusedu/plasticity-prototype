import { ResultSummary } from '../results/schema';
import { CognitiveDomain, getDomainForGame } from './domainConfig';

export interface SessionInsight {
  sessionId: string;
  gameId: string;
  summary: ResultSummary;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  mode?: string;
  context?: { assessmentId?: string };
  domain?: CognitiveDomain;
}

const STORAGE_KEY = 'premium.sessionInsights';

function getStore(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

function loadFromStore(): SessionInsight[] {
  const store = getStore();
  if (!store) return [];
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SessionInsight[];
  } catch (error) {
    console.warn('Failed to read session insights', error);
    return [];
  }
}

function saveToStore(payload: SessionInsight[]): void {
  const store = getStore();
  if (!store) return;
  try {
    store.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn('Failed to persist session insights', error);
  }
}

let memoryCache: SessionInsight[] = loadFromStore();

export function recordSessionInsight(insight: SessionInsight): void {
  const resolvedDomain = insight.domain ?? getDomainForGame(insight.gameId);
  const next: SessionInsight = { ...insight, domain: resolvedDomain };
  memoryCache = [...memoryCache.filter((item) => item.sessionId !== next.sessionId), next];
  saveToStore(memoryCache);
}

export function listInsights(): SessionInsight[] {
  return [...memoryCache].sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
}

export function listInsightsForDate(dateIso: string): SessionInsight[] {
  const target = new Date(dateIso).toDateString();
  return listInsights().filter((insight) => new Date(insight.startedAt).toDateString() === target);
}

export function latestInsight(): SessionInsight | null {
  const [latest] = listInsights();
  return latest ?? null;
}

export function clearInsights(): void {
  memoryCache = [];
  saveToStore(memoryCache);
}
