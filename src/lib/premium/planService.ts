import { getDomainForGame } from './domainConfig';
import { CognitiveProfile } from './profileService';

export interface PlanDay {
  dayIndex: number;
  date: string;
  focusDomain: string;
  anchorGame: string;
  supportGames: string[];
  minutes: number;
}

export interface TrainingPlan {
  createdAt: string;
  days: PlanDay[];
}

const PLAN_KEY = 'premium.trainingPlan';

function getStore(): Storage | null {
  if (typeof localStorage === 'undefined') return null;
  return localStorage;
}

function savePlan(plan: TrainingPlan): void {
  const store = getStore();
  if (!store) return;
  try {
    store.setItem(PLAN_KEY, JSON.stringify(plan));
  } catch (error) {
    console.warn('Failed to persist training plan', error);
  }
}

export function loadPlan(): TrainingPlan | null {
  const store = getStore();
  if (!store) return null;
  try {
    const raw = store.getItem(PLAN_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as TrainingPlan;
  } catch (error) {
    console.warn('Failed to read plan', error);
    return null;
  }
}

const domainAnchors: Record<string, string> = {
  Speed: 'simple-reaction',
  Attention: 'go-no-go',
  Memory: 'n-back',
  Flexibility: 'symbol-match-coding',
  Reasoning: 'mental-rotation-grid',
};

const supportPool = ['choice-reaction', 'flanker-arrows', 'stroop', 'task-switching'];

function rotateDomains(sortedDomains: string[]): string[] {
  const copy = [...sortedDomains];
  while (copy.length < 7) {
    copy.push(...sortedDomains);
  }
  return copy.slice(0, 7);
}

export function generatePlan(profile: CognitiveProfile): TrainingPlan {
  const sortedDomains = [...profile.domainScores].sort((a, b) => a.score - b.score).map((item) => item.domain);
  const rotation = rotateDomains(sortedDomains);
  const now = new Date();

  const days: PlanDay[] = rotation.map((domain, idx) => {
    const date = new Date(now.getTime() + idx * 24 * 60 * 60 * 1000);
    const anchorGame = domainAnchors[domain] ?? 'simple-reaction';
    const supportGames = supportPool.filter((id) => getDomainForGame(id) !== domain).slice(0, 2);
    return {
      dayIndex: idx + 1,
      date: date.toISOString(),
      focusDomain: domain,
      anchorGame,
      supportGames,
      minutes: 6 + (idx % 3),
    };
  });

  const plan: TrainingPlan = { createdAt: new Date().toISOString(), days };
  savePlan(plan);
  return plan;
}

export function upsertPlan(profile: CognitiveProfile): TrainingPlan {
  const current = loadPlan();
  if (current) return current;
  return generatePlan(profile);
}
