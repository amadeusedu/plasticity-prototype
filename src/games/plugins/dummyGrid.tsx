import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GridBoard, GridCell } from '../../ui/GridBoard';
import { PromptCard } from '../../ui/PromptCard';
import { colors, spacing, typography } from '../../ui/theme';
import { GamePlugin } from '../types';
import { mulberry32, summarizeScores } from '../utils';

interface DummyTrialData {
  gridSize: number;
  targetIndex: number;
  labels: string[];
}

function buildCells(data: DummyTrialData): GridCell[] {
  return data.labels.map((label, index) => ({
    id: `${label}-${index}`,
    label,
    accent: index === data.targetIndex,
  }));
}

export const dummyGridGame: GamePlugin<DummyTrialData, string> = {
  id: 'dummy-grid-memory',
  title: 'Pattern Pulse',
  description: 'Tap the highlighted cell as quickly as possible while the target hops around the grid.',
  category: 'Attention',
  version: '1.0.0',
  requiresPremium: false,
  session: { mode: 'fixed', trials: 8, defaultDifficulty: 1, countdownSeconds: 3 },
  getTutorialSteps() {
    return [
      {
        title: 'Focus',
        body: 'A single cell lights up. Tap it before it moves. Pace and accuracy both count.',
        demoConfig: { gridSize: 2 },
      },
      {
        title: 'Keep rhythm',
        body: 'Each round is a little faster. Stay calm and precise to keep your streak.',
      },
    ];
  },
  generateTrial(difficulty: number, seed: number) {
    const rng = mulberry32(seed + difficulty * 17);
    const gridSize = Math.min(5, 2 + Math.floor(difficulty / 2));
    const totalCells = gridSize * gridSize;
    const targetIndex = Math.floor(rng() * totalCells);
    const labels = Array.from({ length: totalCells }, (_, idx) => `${idx + 1}`);
    return { gridSize, targetIndex, labels } satisfies DummyTrialData;
  },
  renderTrial({ trialData, onInput, disabled }) {
    const data = trialData;
    const cells = buildCells(data);

    return (
      <View style={styles.container}>
        <PromptCard title="Tap the highlighted cell" body="Speed matters, but do not miss." />
        <View style={styles.boardWrapper}>
          <GridBoard size={data.gridSize} cells={cells} onSelect={(cell) => !disabled && onInput(cell.id)} />
        </View>
        <Text style={styles.hint}>Round adapts to your pace.</Text>
      </View>
    );
  },
  score({ trialData, input, timeMs }) {
    const data = trialData;
    const isCorrect = input === buildCells(data)[data.targetIndex].id;
    return {
      accuracy: isCorrect ? 1 : 0,
      timeMs,
      errors: isCorrect ? 0 : 1,
      scoreTotal: Math.max(0, (isCorrect ? 1200 : 200) - timeMs / 10),
      extras: { gridSize: data.gridSize },
    };
  },
  recommendNextDifficulty(lastNScores, currentDifficulty) {
    if (lastNScores.length < 2) return currentDifficulty;
    const accuracy = lastNScores.reduce((acc, score) => acc + score.accuracy, 0) / lastNScores.length;
    if (accuracy > 0.85) return Math.min(currentDifficulty + 1, 10);
    if (accuracy < 0.55) return Math.max(1, currentDifficulty - 1);
    return currentDifficulty;
  },
  buildSessionSummary(scores) {
    return summarizeScores(scores);
  },
};

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
  },
  boardWrapper: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: {
    ...typography.subtitle,
    textAlign: 'center',
  },
});
