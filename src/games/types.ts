import React from 'react';
import { ResultSummary, StandardScore } from '../lib/results/schema';

export type GameCategory = 'Attention' | 'Memory' | 'Speed' | 'Flexibility' | 'Spatial' | 'Executive';

export type SessionMode = 'fixed' | 'timed';

export type SessionConfig =
  | {
      mode: 'fixed';
      trials: number;
      countdownSeconds?: number;
      defaultDifficulty: number;
    }
  | {
      mode: 'timed';
      durationSeconds: number;
      countdownSeconds?: number;
      maxTrials?: number;
      defaultDifficulty: number;
    };

export interface TutorialStep {
  title: string;
  body: string;
  demoConfig?: Record<string, unknown>;
}

export type GamePlugin<TTrial = unknown, TInput = unknown> = {
  id: string;
  title: string;
  description: string;
  category: GameCategory;
  version: string;
  session: SessionConfig;
  getTutorialSteps(): TutorialStep[];
  generateTrial(difficulty: number, seed: number): TTrial;
  renderTrial(params: { trialData: TTrial; onInput: (input: TInput) => void; disabled?: boolean }): JSX.Element;
  score(params: { trialData: TTrial; input: TInput; timeMs: number }): StandardScore;
  recommendNextDifficulty(lastNScores: StandardScore[], currentDifficulty: number): number;
  buildSessionSummary(scores: StandardScore[]): ResultSummary;
  requiresPremium?: boolean;
};

export type AnyGamePlugin = GamePlugin<any, any>;
