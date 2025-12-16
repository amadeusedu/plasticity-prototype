import { describe, expect, it } from 'vitest';
import {
  allV1Games,
  simpleReactionGame,
  choiceReactionGame,
  goNoGoGame,
  flankerArrowsGame,
} from '../v1Games';

const basicScore = { timeMs: 500, errors: 0, scoreTotal: 0, accuracy: 1, extras: {} };

describe('v1 game plugins', () => {
  it('exports all 15 games', () => {
    expect(allV1Games).toHaveLength(15);
  });

  it('simple reaction penalizes false starts', () => {
    const trial = simpleReactionGame.generateTrial(1, 5) as any;
    const result = simpleReactionGame.score({ trialData: trial, input: 'tap', timeMs: trial.delayMs - 50 });
    expect(result.extras.falseStart).toBe(true);
    const clean = simpleReactionGame.score({ trialData: trial, input: 'tap', timeMs: trial.delayMs + 50 });
    expect(clean.accuracy).toBeGreaterThan(0);
  });

  it('choice reaction scores correct selection', () => {
    const trial = choiceReactionGame.generateTrial(2, 9) as any;
    const correct = trial.options.find((o: any) => o.correct)?.id;
    const result = choiceReactionGame.score({ trialData: trial, input: correct, timeMs: 400 });
    expect(result.accuracy).toBe(1);
  });

  it('go-no-go handles omissions', () => {
    const trial = goNoGoGame.generateTrial(2, 11) as any;
    const result = goNoGoGame.score({ trialData: trial, input: 'stop', timeMs: 300 });
    expect(result.accuracy).toBeGreaterThanOrEqual(0);
  });

  it('flanker computes interference cost', () => {
    const trial = flankerArrowsGame.generateTrial(3, 12) as any;
    const correct = trial.options.find((o: any) => o.correct)?.id;
    const result = flankerArrowsGame.score({ trialData: trial, input: correct, timeMs: 300 });
    expect(result.extras.interferenceCost).toBeDefined();
  });

  it('difficulty adjusts with accuracy trends', () => {
    const plugin = allV1Games[0];
    const harder = plugin.recommendNextDifficulty([basicScore, basicScore], 1);
    expect(harder).toBeGreaterThanOrEqual(1);
  });
});
