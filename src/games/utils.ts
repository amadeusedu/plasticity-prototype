import { ResultSummary, StandardScore } from '../lib/results/schema';

export function mulberry32(seed: number): () => number {
  let a = seed + 0x6d2b79f5;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function summarizeScores(scores: StandardScore[]): ResultSummary {
  if (scores.length === 0) {
    return { accuracyAvg: 0, timeAvgMs: 0, errorsTotal: 0, scoreTotal: 0 };
  }
  const totals = scores.reduce(
    (acc, score) => {
      acc.accuracy += score.accuracy;
      acc.timeMs += score.timeMs;
      acc.errors += score.errors;
      acc.score += score.scoreTotal;
      return acc;
    },
    { accuracy: 0, timeMs: 0, errors: 0, score: 0 }
  );

  return {
    accuracyAvg: totals.accuracy / scores.length,
    timeAvgMs: totals.timeMs / scores.length,
    errorsTotal: totals.errors,
    scoreTotal: totals.score,
  };
}
