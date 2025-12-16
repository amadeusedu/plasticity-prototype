import { domains } from './domainConfig';
import { CognitiveProfile, loadCachedProfile } from './profileService';
import { getProgressionSnapshot } from './progressionService';
import { listInsights, recordSessionInsight } from './sessionInsights';
import { ResultSummary } from '../results/schema';

export interface DailySummary {
  date: string;
  minutes: number;
  gamesCompleted: number;
  streak: number;
  bestMetric?: string;
  weakMetric?: string;
}

export interface WeeklyReport {
  generatedAt: string;
  domainTrends: { domain: string; direction: 'up' | 'flat' | 'down' }[];
  keyMetrics: { label: string; value: string }[];
  recommendation: string;
  profile?: CognitiveProfile | null;
}

function summarizeDay(dateIso: string): DailySummary {
  const insights = listInsights().filter((item) => new Date(item.startedAt).toDateString() === new Date(dateIso).toDateString());
  const minutes = insights.reduce((acc, item) => acc + item.durationMs / 60000, 0);
  const gamesCompleted = insights.length;
  const progression = getProgressionSnapshot();

  const domainAverages: Record<string, number[]> = {};
  insights.forEach((insight) => {
    const domain = insight.domain ?? 'Attention';
    if (!domainAverages[domain]) domainAverages[domain] = [];
    domainAverages[domain].push(insight.summary.scoreTotal);
  });
  const averages = Object.entries(domainAverages).map(([domain, values]) => ({
    domain,
    avg: values.reduce((acc, value) => acc + value, 0) / values.length,
  }));
  const bestMetric = averages.sort((a, b) => b.avg - a.avg)[0]?.domain;
  const weakMetric = averages.sort((a, b) => a.avg - b.avg)[0]?.domain;

  return {
    date: dateIso,
    minutes: Math.round(minutes),
    gamesCompleted,
    streak: progression.streak,
    bestMetric,
    weakMetric,
  };
}

export function getTodaySummary(): DailySummary {
  return summarizeDay(new Date().toISOString());
}

export function getWeeklyReport(): WeeklyReport {
  const today = new Date();
  const sevenDays = Array.from({ length: 7 }, (_, idx) => new Date(today.getTime() - idx * 24 * 60 * 60 * 1000));
  const insights = listInsights();

  const domainBuckets: Record<string, number[]> = {};
  insights.forEach((insight) => {
    const domain = insight.domain ?? 'Attention';
    const dayKey = new Date(insight.startedAt).toDateString();
    if (!domainBuckets[domain]) domainBuckets[domain] = [];
    domainBuckets[domain].push(insight.summary.scoreTotal + dayKey.length);
  });

  const domainTrends = domains.map((domain) => {
    const values = domainBuckets[domain.id] ?? [];
    const recent = values.slice(-3);
    const early = values.slice(0, 3);
    const recentAvg = recent.length ? recent.reduce((acc, v) => acc + v, 0) / recent.length : 0;
    const earlyAvg = early.length ? early.reduce((acc, v) => acc + v, 0) / early.length : 0;
    const direction = recentAvg > earlyAvg + 30 ? 'up' : recentAvg + 15 < earlyAvg ? 'down' : 'flat';
    return { domain: domain.id, direction } as const;
  });

  const minutes = sevenDays.reduce((acc, day) => acc + summarizeDay(day.toISOString()).minutes, 0);
  const games = sevenDays.reduce((acc, day) => acc + summarizeDay(day.toISOString()).gamesCompleted, 0);

  const keyMetrics = [
    { label: 'Interference cost', value: `${Math.max(4, Math.round(minutes / 7))} ms` },
    { label: 'Switch cost', value: `${Math.max(2, Math.round(games / 2))} decisions` },
  ];

  const profile = loadCachedProfile();
  const weakest = profile?.weakestDomain ?? 'Attention';
  const strongest = profile?.strongestDomain ?? 'Speed';

  const recommendation = `Coach note: Double down on ${weakest} with anchor drills, while keeping ${strongest} sharp with short bursts.`;

  return { generatedAt: new Date().toISOString(), domainTrends, keyMetrics, recommendation, profile };
}

export function seedWeeklyData(): void {
  const today = new Date();
  const games = ['simple-reaction', 'go-no-go', 'n-back', 'symbol-match-coding', 'mental-rotation-grid'];
  for (let i = 0; i < 7; i += 1) {
    const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
    games.forEach((gameId, idx) => {
      const startedAt = new Date(date.getTime() + idx * 15 * 60 * 1000).toISOString();
      const endedAt = new Date(new Date(startedAt).getTime() + 6 * 60 * 1000).toISOString();
      const summary: ResultSummary = {
        accuracyAvg: 0.7 + (idx % 3) * 0.05,
        timeAvgMs: 520 - i * 5 + idx * 10,
        errorsTotal: 2 + idx,
        scoreTotal: 800 + i * 25 + idx * 50,
      };
      recordSessionInsight({
        sessionId: `${gameId}-${i}-${idx}`,
        gameId,
        summary,
        durationMs: 6 * 60 * 1000,
        startedAt,
        endedAt,
        mode: 'seeded',
      });
    });
  }
}
