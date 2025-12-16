import React from 'react';
import { StyleSheet, View } from 'react-native';
import { ChoiceRow } from '../../ui/ChoiceRow';
import { GridBoard, GridCell } from '../../ui/GridBoard';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { PromptCard } from '../../ui/PromptCard';
import { colors, spacing, typography } from '../../ui/theme';
import { GamePlugin, SessionConfig } from '../types';
import { mulberry32, summarizeScores } from '../utils';

interface ChoiceTrial {
  prompt: string;
  options: { id: string; label: string; correct: boolean }[];
  stimulusType: string;
  difficulty: number;
}

function renderChoiceTrial({ trialData, onInput, disabled }: any): JSX.Element {
  const data = trialData as ChoiceTrial;
  return (
    <View style={styles.cardBody}>
      <PromptCard title={data.prompt} body={`Stimulus: ${data.stimulusType}`} />
      {data.options.map((opt) => (
        <ChoiceRow key={opt.id} label={opt.label} selected={false} onPress={() => !disabled && onInput(opt.id)} disabled={disabled} />
      ))}
    </View>
  );
}

function scoreChoice({ trialData, input, timeMs }: { trialData: ChoiceTrial; input: unknown; timeMs: number }) {
  const data = trialData as ChoiceTrial;
  const correctOption = data.options.find((opt) => opt.correct);
  const isCorrect = input === correctOption?.id;
  const scoreTotal = Math.max(0, (isCorrect ? 1200 : 400) - timeMs / 8);
  return { accuracy: isCorrect ? 1 : 0, timeMs, errors: isCorrect ? 0 : 1, scoreTotal, extras: { stimulus: data.stimulusType } };
}

function recommendDifficulty(lastNScores: any[], currentDifficulty: number) {
  if (!lastNScores.length) return currentDifficulty;
  const avg = lastNScores.reduce((acc, score) => acc + score.accuracy, 0) / lastNScores.length;
  if (avg > 0.85) return Math.min(10, currentDifficulty + 1);
  if (avg < 0.55) return Math.max(1, currentDifficulty - 1);
  return currentDifficulty;
}

function buildSummary(scores: any[]) {
  return summarizeScores(scores);
}

function buildGridTrial(seed: number, difficulty: number, gridSize: number) {
  const rng = mulberry32(seed + difficulty * 7);
  const totalCells = gridSize * gridSize;
  const target = Math.floor(rng() * totalCells);
  const labels = Array.from({ length: totalCells }, (_, idx) => `${idx + 1}`);
  const cells: GridCell[] = labels.map((label, idx) => ({ id: `${label}-${idx}`, label, accent: idx === target }));
  return { gridSize, cells, targetIndex: target };
}

function renderGridTrial({ trialData, onInput, disabled }: any): JSX.Element {
  const data = trialData as { gridSize: number; cells: GridCell[] };
  return (
    <View style={styles.cardBody}>
      <PromptCard title="Tap the highlighted cell" body="Accuracy beats speed." />
      <GridBoard size={data.gridSize} cells={data.cells} onSelect={(cell) => !disabled && onInput(cell.id)} />
    </View>
  );
}

function scoreGrid({ trialData, input, timeMs }: any) {
  const data = trialData as { cells: GridCell[]; targetIndex: number };
  const isCorrect = input === data.cells[data.targetIndex].id;
  return { accuracy: isCorrect ? 1 : 0, timeMs, errors: isCorrect ? 0 : 1, scoreTotal: isCorrect ? 1500 - timeMs / 6 : 100, extras: {} };
}

function makeTutorial(title: string) {
  return [
    { title: `${title} basics`, body: 'Follow the prompt and respond swiftly.', demoConfig: { practice: true } },
    { title: 'Keep focus', body: 'Rounds speed up as you improve.' },
    { title: 'Practice', body: 'Try a sample round before the real thing.' },
  ];
}

function fixedSession(trials: number, defaultDifficulty: number, countdownSeconds = 2): SessionConfig {
  return { mode: 'fixed', trials, defaultDifficulty, countdownSeconds };
}

function timedSession(durationSeconds: number, defaultDifficulty: number, maxTrials?: number): SessionConfig {
  return { mode: 'timed', durationSeconds, defaultDifficulty, maxTrials, countdownSeconds: 2 };
}

// Simple Reaction
export const simpleReactionGame: GamePlugin = {
  id: 'simple-reaction',
  title: 'Simple Reaction',
  description: 'Wait for GO then tap quickly without false starting.',
  category: 'Speed',
  version: '1.0.0',
  session: fixedSession(10, 1),
  getTutorialSteps() {
    return makeTutorial('Simple Reaction');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 11);
    const delayMs = 500 + Math.floor(rng() * 1500);
    return { delayMs, thresholdMs: 250 + difficulty * 20 };
  },
  renderTrial({ trialData, onInput, disabled }) {
    const data = trialData as { delayMs: number; thresholdMs: number };
    return (
      <View style={styles.cardBody}>
        <PromptCard title="Wait for GO" body={`Signal appears after ${Math.round(data.delayMs / 100) / 10}s`} />
        <PrimaryButton label="Tap when ready" onPress={() => !disabled && onInput('tap')} disabled={disabled} />
      </View>
    );
  },
  score({ trialData, timeMs }) {
    const data = trialData as { delayMs: number; thresholdMs: number };
    const falseStart = timeMs < data.delayMs;
    const reaction = Math.max(0, timeMs - data.delayMs);
    const accuracy = falseStart ? 0 : reaction <= data.thresholdMs ? 1 : 0.5;
    const errors = falseStart ? 1 : 0;
    const scoreTotal = falseStart ? 0 : Math.max(50, 1800 - reaction);
    return { accuracy, timeMs: reaction, errors, scoreTotal, extras: { falseStart, delay: data.delayMs } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Choice Reaction
export const choiceReactionGame: GamePlugin = {
  id: 'choice-reaction',
  title: 'Choice Reaction',
  description: 'Tap the matching symbol among several options.',
  category: 'Attention',
  version: '1.0.0',
  session: fixedSession(12, 2),
  getTutorialSteps() {
    return makeTutorial('Choice Reaction');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 3);
    const choices = 2 + (difficulty % 3);
    const target = Math.floor(rng() * choices);
    const options = Array.from({ length: choices }, (_, idx) => ({ id: `opt-${idx}`, label: `Symbol ${idx + 1}`, correct: idx === target }));
    return { prompt: 'Select the matching symbol', options, stimulusType: 'icons', difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score: scoreChoice,
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Go / No-go
export const goNoGoGame: GamePlugin = {
  id: 'go-no-go',
  title: 'Go / No-Go',
  description: 'Press for green targets, withhold for red.',
  category: 'Executive',
  version: '1.0.0',
  session: timedSession(45, 2, 24),
  getTutorialSteps() {
    return makeTutorial('Go / No-Go');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty);
    const isGo = rng() > 0.25;
    const prompt = isGo ? 'Press Go' : 'Do NOT press';
    return { prompt, options: [{ id: 'go', label: 'Go', correct: isGo }, { id: 'stop', label: 'No-Go', correct: !isGo }], stimulusType: isGo ? 'green' : 'red', difficulty } satisfies ChoiceTrial;
  },
  renderTrial({ trialData, onInput, disabled }) {
    const data = trialData as ChoiceTrial;
    return (
      <View style={styles.cardBody}>
        <PromptCard title={data.prompt} body={data.stimulusType === 'green' ? 'Tap Go quickly.' : 'Resist tapping to avoid errors.'} />
        <View style={styles.rowButtons}>
          <PrimaryButton label="Go" onPress={() => !disabled && onInput('go')} />
          <PrimaryButton label="No-Go" onPress={() => !disabled && onInput('stop')} variant="ghost" />
        </View>
      </View>
    );
  },
  score({ trialData, input, timeMs }) {
    const data = trialData as ChoiceTrial;
    const goTarget = data.options.find((opt) => opt.correct)?.id;
    const isCorrect = input === goTarget;
    const omission = input === 'stop' && data.options.find((opt) => opt.correct)?.id === 'go';
    const errors = isCorrect ? 0 : 1;
    const accuracy = isCorrect ? 1 : omission ? 0.5 : 0;
    const scoreTotal = isCorrect ? 1400 - timeMs / 6 : omission ? 200 : 50;
    return { accuracy, timeMs, errors, scoreTotal, extras: { omission } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Flanker Arrows
export const flankerArrowsGame: GamePlugin = {
  id: 'flanker-arrows',
  title: 'Flanker Arrows',
  description: 'Ignore flanking arrows and match the center.',
  category: 'Attention',
  version: '1.0.0',
  session: fixedSession(14, 3),
  getTutorialSteps() {
    return makeTutorial('Flanker Arrows');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 5);
    const incongruent = rng() > 0.4;
    const centerLeft = rng() > 0.5;
    const flank = incongruent ? !centerLeft : centerLeft;
    const stimulus = `${flank ? '<<' : '>>'} ${centerLeft ? '<' : '>'} ${flank ? '<<' : '>>'}`;
    const options = [
      { id: 'left', label: 'Left', correct: centerLeft },
      { id: 'right', label: 'Right', correct: !centerLeft },
    ];
    return { prompt: stimulus, options, stimulusType: incongruent ? 'conflict' : 'aligned', difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const data = trialData as ChoiceTrial;
    const base = scoreChoice({ trialData: data, input, timeMs });
    const cost = data.stimulusType === 'conflict' ? 0.05 : 0;
    return { ...base, scoreTotal: base.scoreTotal - cost * 500, extras: { ...base.extras, interferenceCost: cost } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Colour Word Conflict
export const colourWordConflictGame: GamePlugin = {
  id: 'colour-word-conflict',
  title: 'Colour Word Conflict',
  description: 'Name the ink colour, ignore the word.',
  category: 'Executive',
  version: '1.0.0',
  session: fixedSession(12, 2),
  getTutorialSteps() {
    return makeTutorial('Colour Conflict');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 9);
    const colours = ['Red', 'Blue', 'Green', 'Yellow'];
    const word = colours[Math.floor(rng() * colours.length)];
    const ink = colours[Math.floor(rng() * colours.length)];
    const congruent = rng() > 0.5;
    const actualInk = congruent ? word : ink;
    const options = colours.map((c) => ({ id: c.toLowerCase(), label: c, correct: c === actualInk }));
    return { prompt: `Word: ${word}`, options, stimulusType: actualInk, difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const base = scoreChoice({ trialData: trialData as ChoiceTrial, input, timeMs });
    const interferenceCost = base.accuracy === 1 && (trialData as ChoiceTrial).stimulusType ? 0.02 : 0;
    return { ...base, extras: { ...base.extras, interferenceCost } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Task Switching Taps
export const taskSwitchingTapsGame: GamePlugin = {
  id: 'task-switching-taps',
  title: 'Task Switching',
  description: 'Switch between tap rules when cues change.',
  category: 'Flexibility',
  version: '1.0.0',
  session: timedSession(60, 2, 28),
  getTutorialSteps() {
    return makeTutorial('Task Switching');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 4);
    const rule = rng() > 0.5 ? 'high' : 'low';
    const number = 1 + Math.floor(rng() * 9);
    const targetRule = rule === 'high' ? number > 4 : number < 6;
    const options = [
      { id: 'tap', label: 'Tap', correct: targetRule },
      { id: 'hold', label: 'Skip', correct: !targetRule },
    ];
    return { prompt: `${rule === 'high' ? 'High' : 'Low'} if number ${number}`, options, stimulusType: rule, difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const data = trialData as ChoiceTrial;
    const base = scoreChoice({ trialData: data, input, timeMs });
    const switchCost = data.stimulusType === 'high' ? 0.03 : 0.01;
    return { ...base, extras: { ...base.extras, switchCost } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Rule Switch Cards
export const ruleSwitchCardsGame: GamePlugin = {
  id: 'rule-switch-cards',
  title: 'Rule Switch Cards',
  description: 'Discover and adapt to changing card rules.',
  category: 'Flexibility',
  version: '1.0.0',
  session: fixedSession(16, 3),
  getTutorialSteps() {
    return makeTutorial('Rule Switch Cards');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 6);
    const rule = rng() > 0.5 ? 'shape' : 'colour';
    const shapes = ['Circle', 'Triangle', 'Square'];
    const colours = ['Red', 'Blue', 'Green'];
    const shape = shapes[Math.floor(rng() * shapes.length)];
    const colour = colours[Math.floor(rng() * colours.length)];
    const target = rule === 'shape' ? shape : colour;
    const options = [
      { id: 'shape', label: shape, correct: rule === 'shape' },
      { id: 'colour', label: colour, correct: rule === 'colour' },
    ];
    return { prompt: `Match by ${rule}`, options, stimulusType: target, difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const base = scoreChoice({ trialData: trialData as ChoiceTrial, input, timeMs });
    const perseveration = base.accuracy === 0 ? 1 : 0;
    return { ...base, extras: { ...base.extras, perseveration } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Symbol Match Coding
export const symbolMatchCodingGame: GamePlugin = {
  id: 'symbol-match-coding',
  title: 'Symbol Coding',
  description: 'Map symbols to digits quickly.',
  category: 'Speed',
  version: '1.0.0',
  session: timedSession(60, 3, 40),
  getTutorialSteps() {
    return makeTutorial('Symbol Coding');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 8);
    const pairs = 3 + (difficulty % 3);
    const mapping = Array.from({ length: pairs }, (_, idx) => ({ symbol: `◆${idx + 1}`, digit: `${idx + 1}` }));
    const target = mapping[Math.floor(rng() * mapping.length)];
    const options = mapping.map((pair) => ({ id: pair.digit, label: `${pair.symbol} = ${pair.digit}`, correct: pair.digit === target.digit }));
    return { prompt: `Select digit for ${target.symbol}`, options, stimulusType: 'symbol-digit', difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const base = scoreChoice({ trialData: trialData as ChoiceTrial, input, timeMs });
    return { ...base, extras: { ...base.extras, sprint: true } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Sequence Span
export const sequenceSpanGame: GamePlugin = {
  id: 'sequence-span',
  title: 'Sequence Span',
  description: 'Remember and replay growing sequences.',
  category: 'Memory',
  version: '1.0.0',
  session: fixedSession(8, 2),
  getTutorialSteps() {
    return makeTutorial('Sequence Span');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 7);
    const length = 3 + difficulty;
    const sequence = Array.from({ length }, () => Math.floor(rng() * 4));
    return { prompt: 'Repeat the sequence', options: sequence.map((val, idx) => ({ id: `${idx}-${val}`, label: `Step ${idx + 1}: ${val}` })), stimulusType: 'sequence', difficulty };
  },
  renderTrial({ trialData, onInput }) {
    const data = trialData as any;
    return (
      <View style={styles.cardBody}>
        <PromptCard title={data.prompt} body={`Length ${data.options.length}`} />
        <PrimaryButton label="Mark recalled" onPress={() => onInput(data.options.map((opt: any) => opt.id))} />
      </View>
    );
  },
  score({ trialData, input, timeMs }) {
    const expected = (trialData as any).options.map((opt: any) => opt.id).join('-');
    const provided = Array.isArray(input) ? (input as any[]).join('-') : `${input}`;
    const correct = expected === provided;
    return { accuracy: correct ? 1 : 0, timeMs, errors: correct ? 0 : 1, scoreTotal: correct ? 1600 - timeMs / 5 : 200, extras: { length: (trialData as any).options.length } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Spatial Span
export const spatialSpanGame: GamePlugin = {
  id: 'spatial-span',
  title: 'Spatial Span',
  description: 'Tap remembered block order.',
  category: 'Memory',
  version: '1.0.0',
  session: fixedSession(10, 2),
  getTutorialSteps() {
    return makeTutorial('Spatial Span');
  },
  generateTrial(difficulty, seed) {
    const gridSize = 3;
    const rng = mulberry32(seed + difficulty * 2);
    const length = 2 + difficulty;
    const cells = buildGridTrial(seed, difficulty, gridSize).cells;
    const sequence = Array.from({ length }, () => cells[Math.floor(rng() * cells.length)].id);
    return { gridSize, cells, sequence };
  },
  renderTrial({ trialData, onInput, disabled }) {
    const data = trialData as any;
    return (
      <View style={styles.cardBody}>
        <PromptCard title="Recall the order" body={`Sequence length ${data.sequence.length}`} />
        <GridBoard size={data.gridSize} cells={data.cells} onSelect={(cell) => !disabled && onInput([...data.sequence, cell.id])} />
      </View>
    );
  },
  score({ trialData, input, timeMs }) {
    const expected = (trialData as any).sequence.join('-');
    const provided = Array.isArray(input) ? (input as any[]).join('-') : `${input}`;
    const correct = expected === provided;
    return { accuracy: correct ? 1 : 0, timeMs, errors: correct ? 0 : 1, scoreTotal: correct ? 1700 - timeMs / 5 : 150, extras: { length: (trialData as any).sequence.length } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Spatial Memory Grid
export const spatialMemoryGridGame: GamePlugin = {
  id: 'spatial-memory-grid',
  title: 'Spatial Memory',
  description: 'Remember briefly shown tiles.',
  category: 'Spatial',
  version: '1.0.0',
  session: fixedSession(9, 2),
  getTutorialSteps() {
    return makeTutorial('Spatial Memory');
  },
  generateTrial(difficulty, seed) {
    const gridSize = 4;
    const rng = mulberry32(seed + difficulty * 5);
    const targetCount = 2 + difficulty;
    const base = buildGridTrial(seed, difficulty, gridSize);
    const targets = new Set<number>();
    while (targets.size < targetCount) targets.add(Math.floor(rng() * base.cells.length));
    return { gridSize, cells: base.cells, targets: Array.from(targets).map((idx) => base.cells[idx].id) };
  },
  renderTrial({ trialData, onInput, disabled }) {
    const data = trialData as any;
    return (
      <View style={styles.cardBody}>
        <PromptCard title="Recall the lit tiles" body={`${data.targets.length} tiles were shown`} />
        <GridBoard size={data.gridSize} cells={data.cells} onSelect={(cell) => !disabled && onInput(data.targets.includes(cell.id))} />
      </View>
    );
  },
  score({ input, timeMs, trialData }) {
    const correct = Boolean(input);
    return { accuracy: correct ? 1 : 0, timeMs, errors: correct ? 0 : 1, scoreTotal: correct ? 1500 - timeMs / 5 : 100, extras: { targets: (trialData as any).targets.length } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// N-back
export const nBackGame: GamePlugin = {
  id: 'n-back',
  title: 'N-Back',
  description: 'Respond when current item matches N steps back.',
  category: 'Memory',
  version: '1.0.0',
  session: timedSession(60, 2, 30),
  getTutorialSteps() {
    return makeTutorial('N-Back');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 4);
    const n = Math.min(3, 1 + Math.floor(difficulty / 2));
    const symbols = ['▲', '●', '■', '◆'];
    const symbol = symbols[Math.floor(rng() * symbols.length)];
    const match = rng() > 0.6;
    return { prompt: `Is this the same as ${n} back? ${symbol}`, options: [{ id: 'match', label: 'Match', correct: match }, { id: 'new', label: 'New', correct: !match }], stimulusType: `n-${n}`, difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const base = scoreChoice({ trialData: trialData as ChoiceTrial, input, timeMs });
    const dPrimeProxy = base.accuracy === 1 ? 1.2 : 0.2;
    return { ...base, extras: { ...base.extras, dPrimeProxy } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Mental Rotation Grid
export const mentalRotationGridGame: GamePlugin = {
  id: 'mental-rotation-grid',
  title: 'Mental Rotation',
  description: 'Judge rotated shapes in a grid.',
  category: 'Spatial',
  version: '1.0.0',
  session: fixedSession(10, 2),
  getTutorialSteps() {
    return makeTutorial('Mental Rotation');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 5);
    const angle = Math.floor(rng() * 180);
    const mirror = rng() > 0.5;
    const options = [
      { id: 'same', label: 'Same', correct: !mirror },
      { id: 'mirror', label: 'Mirror', correct: mirror },
    ];
    return { prompt: `Angle ${angle}°`, options, stimulusType: mirror ? 'mirror' : 'rotate', difficulty, angle } as ChoiceTrial & { angle: number };
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const data = trialData as any;
    const base = scoreChoice({ trialData: data, input, timeMs });
    const angleWeight = 1 + data.angle / 180;
    return { ...base, scoreTotal: base.scoreTotal * angleWeight, extras: { ...base.extras, angle: data.angle } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Multiple Object Tracking
export const multipleObjectTrackingGame: GamePlugin = {
  id: 'multiple-object-tracking',
  title: 'Object Tracking',
  description: 'Track moving targets among distractors.',
  category: 'Attention',
  version: '1.0.0',
  session: timedSession(50, 2, 24),
  getTutorialSteps() {
    return makeTutorial('Object Tracking');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 6);
    const targets = 2 + Math.floor(difficulty / 2);
    const total = targets + 2;
    const highlighted = new Set<number>();
    while (highlighted.size < targets) highlighted.add(Math.floor(rng() * total));
    const options = Array.from({ length: total }, (_, idx) => ({ id: `obj-${idx}`, label: highlighted.has(idx) ? 'Target' : 'Distractor', correct: highlighted.has(idx) }));
    return { prompt: 'Select tracked objects', options, stimulusType: 'moving', difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const data = trialData as ChoiceTrial;
    const correctIds = data.options.filter((opt) => opt.correct).map((o) => o.id);
    const provided = Array.isArray(input) ? (input as string[]) : [input as string];
    const hits = provided.filter((id) => correctIds.includes(id)).length;
    const accuracy = hits / correctIds.length;
    const errors = correctIds.length - hits;
    return { accuracy, timeMs, errors, scoreTotal: Math.max(0, 2000 * accuracy - timeMs / 4), extras: { load: correctIds.length } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

// Pattern Completion
export const patternCompletionGame: GamePlugin = {
  id: 'pattern-completion',
  title: 'Pattern Completion',
  description: 'Choose the tile that completes the pattern.',
  category: 'Executive',
  version: '1.0.0',
  session: fixedSession(10, 3),
  getTutorialSteps() {
    return makeTutorial('Pattern Completion');
  },
  generateTrial(difficulty, seed) {
    const rng = mulberry32(seed + difficulty * 10);
    const options = Array.from({ length: 4 }, (_, idx) => ({ id: `tile-${idx}`, label: `Tile ${idx + 1}`, correct: idx === Math.floor(rng() * 4) }));
    return { prompt: 'Select the missing tile', options, stimulusType: 'pattern', difficulty } satisfies ChoiceTrial;
  },
  renderTrial: renderChoiceTrial,
  score({ trialData, input, timeMs }) {
    const base = scoreChoice({ trialData: trialData as ChoiceTrial, input, timeMs });
    return { ...base, scoreTotal: base.scoreTotal + 100, extras: { ...base.extras, reasoning: true } };
  },
  recommendNextDifficulty: recommendDifficulty,
  buildSessionSummary: buildSummary,
};

export const allV1Games: GamePlugin[] = [
  simpleReactionGame,
  choiceReactionGame,
  goNoGoGame,
  flankerArrowsGame,
  colourWordConflictGame,
  taskSwitchingTapsGame,
  ruleSwitchCardsGame,
  symbolMatchCodingGame,
  sequenceSpanGame,
  spatialSpanGame,
  spatialMemoryGridGame,
  nBackGame,
  mentalRotationGridGame,
  multipleObjectTrackingGame,
  patternCompletionGame,
];

const styles = StyleSheet.create({
  cardBody: { gap: spacing.md },
  rowButtons: { flexDirection: 'row', gap: spacing.md },
  label: { ...typography.label, color: colors.text },
});
