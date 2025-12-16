import { z } from 'zod';

export const StandardScoreSchema = z.object({
  accuracy: z.number().min(0).max(1),
  timeMs: z.number().min(0),
  errors: z.number().min(0),
  scoreTotal: z.number(),
  extras: z.record(z.string(), z.any()).default({}),
});

export type StandardScore = z.infer<typeof StandardScoreSchema>;

export const TrialResultSchema = z.object({
  index: z.number().int().min(0),
  trialData: z.record(z.string(), z.any()),
  score: StandardScoreSchema,
});

export type TrialResult = z.infer<typeof TrialResultSchema>;

export const ResultSummarySchema = z.object({
  accuracyAvg: z.number().min(0).max(1),
  timeAvgMs: z.number().min(0),
  errorsTotal: z.number().min(0),
  scoreTotal: z.number(),
});

export type ResultSummary = z.infer<typeof ResultSummarySchema>;

export const ResultPayloadSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().uuid(),
  gameId: z.string(),
  startedAt: z.string().datetime(),
  endedAt: z.string().datetime(),
  durationMs: z.number().min(0),
  difficultyStart: z.number().nullable(),
  difficultyEnd: z.number().nullable(),
  summary: ResultSummarySchema,
  trials: z.array(TrialResultSchema),
  appVersion: z.string().optional().nullable(),
  gameVersion: z.string().optional().nullable(),
});

export type ResultPayload = z.infer<typeof ResultPayloadSchema>;
