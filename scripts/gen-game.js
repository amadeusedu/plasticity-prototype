#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const id = process.argv[2];
if (!id) {
  console.error('Usage: yarn gen:game <id>');
  process.exit(1);
}

const toTitle = (slug) =>
  slug
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const pluginPath = path.join(__dirname, '..', 'src', 'games', 'plugins', `${id}.tsx`);
const testPath = path.join(__dirname, '..', 'src', 'games', 'plugins', '__tests__', `${id}.test.ts`);
const tutorialPath = path.join(__dirname, '..', 'docs', 'tutorials', `${id}.md`);

if (fs.existsSync(pluginPath)) {
  console.error(`Plugin already exists at ${pluginPath}`);
  process.exit(1);
}

const template = `import React from 'react';
import { View } from 'react-native';
import { PromptCard } from '../../ui/PromptCard';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { GamePlugin } from '../types';
import { summarizeScores, mulberry32 } from '../utils';

export const ${id.replace(/-([a-z])/g, (m, c) => c.toUpperCase())}Game: GamePlugin = {
  id: '${id}',
  title: '${toTitle(id)}',
  description: 'Replace with description.',
  category: 'Attention',
  version: '1.0.0',
  session: { mode: 'fixed', trials: 8, defaultDifficulty: 1 },
  getTutorialSteps() {
    return [
      { title: 'Overview', body: 'Explain the goal.' },
      { title: 'Controls', body: 'Explain how to respond.', demoConfig: { practice: true } },
    ];
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty);
    return { target: rng() > 0.5 ? 'A' : 'B' };
  },
  renderTrial({ trialData, onInput }) {
    return (
      <View>
        <PromptCard title="Demo" body={`Target: ${'${'}(trialData as any).target}`} />
        <PrimaryButton label="Respond" onPress={() => onInput((trialData as any).target)} />
      </View>
    );
  },
  score({ trialData, input, timeMs }) {
    const correct = input === (trialData as any).target;
    return { accuracy: correct ? 1 : 0, timeMs, errors: correct ? 0 : 1, scoreTotal: correct ? 1000 - timeMs : 0, extras: {} };
  },
  recommendNextDifficulty(scores, current) {
    if (!scores.length) return current;
    const avg = scores.reduce((a, s) => a + s.accuracy, 0) / scores.length;
    if (avg > 0.85) return current + 1;
    if (avg < 0.6) return Math.max(1, current - 1);
    return current;
  },
  buildSessionSummary(scores) {
    return summarizeScores(scores);
  },
};
`;

const testTemplate = `import { ${id.replace(/-([a-z])/g, (m, c) => c.toUpperCase())}Game as game } from '../${id}';

describe('${id} plugin', () => {
  it('scores a correct response', () => {
    const trial = game.generateTrial(1, 123);
    const result = game.score({ trialData: trial, input: (trial as any).target, timeMs: 500 });
    expect(result.accuracy).toBe(1);
  });

  it('adjusts difficulty based on accuracy', () => {
    const next = game.recommendNextDifficulty([{ accuracy: 1, timeMs: 300, errors: 0, scoreTotal: 10, extras: {} }], 1);
    expect(next).toBeGreaterThan(1);
  });
});
`;

const tutorialTemplate = `# ${toTitle(id)}

- Step 1: Overview
- Step 2: Controls
`;

fs.writeFileSync(pluginPath, template, 'utf8');
fs.writeFileSync(testPath, testTemplate, 'utf8');
fs.writeFileSync(tutorialPath, tutorialTemplate, 'utf8');

console.log(`Created plugin at ${pluginPath}`);
console.log(`Created test at ${testPath}`);
console.log(`Created tutorial copy at ${tutorialPath}`);
`;

fs.chmodSync(pluginPath, 0o644);
fs.chmodSync(testPath, 0o644);
fs.chmodSync(tutorialPath, 0o644);
