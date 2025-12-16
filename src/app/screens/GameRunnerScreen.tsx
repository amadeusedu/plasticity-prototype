import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { getGamePlugin } from '../../games/registry';
import { GamePlugin, SessionConfig } from '../../games/types';
import { PrimaryButton } from '../../ui/PrimaryButton';
import { colors, spacing, typography } from '../../ui/theme';
import { Countdown } from '../../ui/Countdown';
import { ProgressBar } from '../../ui/ProgressBar';
import { ToastFeedback } from '../../ui/ToastFeedback';
import { SlideUp } from '../../ui/Motion';
import { resultsService } from '../../lib/results/ResultsService';
import { ResultSummary, StandardScore } from '../../lib/results/schema';
import { summarizeScores } from '../../games/utils';
import { recordSessionInsight } from '../../lib/premium/sessionInsights';
import { recordAssessmentInsight } from '../../lib/premium/assessmentService';
import { getDomainForGame } from '../../lib/premium/domainConfig';
import { canStartSession, recordSessionCompletion } from '../../lib/premium/progressionService';
import { useAppContext } from '../providers/AppProvider';

interface SessionState {
  id: string;
  startedAt: string;
  userId: string;
}

type Phase = 'tutorial' | 'countdown' | 'running' | 'summary' | 'blocked';

type Props = NativeStackScreenProps<RootStackParamList, 'GameRunner'>;

export default function GameRunnerScreen({ route, navigation }: Props): JSX.Element {
  const { entitlements } = useAppContext();
  const { gameId, mode = 'normal', sessionOverride, runContext } = route.params;
  const plugin = useMemo<GamePlugin>(() => getGamePlugin(gameId), [gameId]);
  const sessionConfig = (sessionOverride as SessionConfig) ?? plugin.session;
  const tutorialSteps = plugin.getTutorialSteps();

  const [phase, setPhase] = useState<Phase>(mode === 'tutorial' && tutorialSteps.length > 0 ? 'tutorial' : 'countdown');
  const [currentStep, setCurrentStep] = useState(0);
  const [session, setSession] = useState<SessionState | null>(null);
  const [difficulty, setDifficulty] = useState(sessionConfig.defaultDifficulty);
  const [currentTrial, setCurrentTrial] = useState(0);
  const [trialData, setTrialData] = useState<Record<string, unknown> | null>(null);
  const [scores, setScores] = useState<StandardScore[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [summary, setSummary] = useState<ResultSummary | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isBackgrounded, setIsBackgrounded] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);

  const countdownSeconds = sessionConfig.countdownSeconds ?? 3;
  const isTimed = sessionConfig.mode === 'timed';
  const durationLimit = sessionConfig.mode === 'timed' ? sessionConfig.durationSeconds * 1000 : null;

  const sessionSeed = useRef<number>(Math.floor(Math.random() * 1000000));
  const trialStartedAt = useRef<number | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const pauseStartedAt = useRef<number | null>(null);

  const attachAppStateListener = useCallback(() => {
    const handler = (nextState: AppStateStatus) => {
      const backgrounded = nextState !== 'active';
      setIsBackgrounded(backgrounded);
      if (backgrounded) {
        setIsPaused((prev) => {
          if (!prev && trialStartedAt.current) {
            pauseStartedAt.current = Date.now();
          }
          return true;
        });
        setFeedback('Paused while app inactive');
      }
    };
    const sub = AppState.addEventListener('change', handler);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const teardown = attachAppStateListener();
    return teardown;
  }, [attachAppStateListener]);

  useEffect(() => {
    navigation.setOptions({ title: plugin.title });
  }, [navigation, plugin.title]);

  useEffect(() => {
    const allowance = canStartSession(entitlements?.isPremium ?? false);
    if (!allowance.allowed && mode !== 'assessment') {
      setBlockedReason(allowance.reason ?? 'Upgrade required');
      setPhase('blocked');
      return;
    }

    const create = async () => {
      try {
        const created = await resultsService.createSession({
          gameId: plugin.id,
          difficultyStart: sessionConfig.defaultDifficulty,
          gameVersion: plugin.version,
          metadata: { mode, assessmentId: runContext?.assessmentId },
        });
        setSession(created);
        setElapsedMs(0);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start session';
        setLastError(message);
      }
    };
    void create();
  }, [entitlements?.isPremium, mode, plugin.id, plugin.version, runContext?.assessmentId, sessionConfig.defaultDifficulty]);

  useEffect(() => {
    if (phase !== 'running' || isPaused || !isTimed) return;
    timerInterval.current && clearInterval(timerInterval.current);
    timerInterval.current = setInterval(() => {
      setElapsedMs((current) => current + 250);
    }, 250);
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
    };
  }, [phase, isPaused, isTimed]);

  useEffect(() => {
    if (durationLimit && elapsedMs >= durationLimit && phase === 'running') {
      void finalizeSession();
    }
  }, [durationLimit, elapsedMs, phase]);

  const startTrial = useCallback(
    (nextIndex: number) => {
      const seed = sessionSeed.current + nextIndex;
      const generated = plugin.generateTrial(difficulty, seed);
      setTrialData(generated);
      setCurrentTrial(nextIndex);
      trialStartedAt.current = Date.now();
    },
    [difficulty, plugin]
  );

  const beginRun = useCallback(() => {
    setPhase('running');
    setIsPaused(false);
    setElapsedMs(0);
    startTrial(0);
  }, [startTrial]);

  const handleTutorialNext = useCallback(() => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep((step) => step + 1);
    } else {
      setPhase('countdown');
    }
  }, [currentStep, tutorialSteps.length]);

  const handleTrialInput = useCallback(
    async (input: unknown) => {
      if (!trialData || trialStartedAt.current === null || !session) return;
      const timeMs = Date.now() - trialStartedAt.current;
      const score = plugin.score({ trialData, input, timeMs });
      const nextScores = [...scores, score];
      setScores(nextScores);
      setFeedback(score.accuracy >= 1 ? 'Sharp.' : 'Missed - refocus.');
      try {
        await resultsService.appendTrial(session.id, currentTrial, trialData, score);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to save trial';
        setLastError(message);
      }

      const nextDifficulty = plugin.recommendNextDifficulty(nextScores.slice(-3), difficulty);
      setDifficulty(nextDifficulty);

      const reachedTrialCap = sessionConfig.mode === 'fixed' ? nextScores.length >= sessionConfig.trials : false;
      const reachedTimeCap = durationLimit ? elapsedMs >= durationLimit : false;
      const reachedMaxTrials = sessionConfig.mode === 'timed' && sessionConfig.maxTrials ? nextScores.length >= sessionConfig.maxTrials : false;

      if (reachedTrialCap || reachedTimeCap || reachedMaxTrials) {
        await finalizeSession(nextScores, nextDifficulty);
      } else {
        startTrial(nextScores.length);
      }
    },
    [currentTrial, difficulty, durationLimit, elapsedMs, plugin, scores, session, startTrial, trialData]
  );

  const finalizeSession = useCallback(
    async (finalScores: StandardScore[] = scores, difficultyEnd = difficulty) => {
      if (!session) return;
      const runtimeMs = Math.max(elapsedMs, Date.now() - new Date(session.startedAt).getTime());
      const computedSummary = plugin.buildSessionSummary(finalScores);
      setSummary(computedSummary);
      const endedAt = new Date().toISOString();
      try {
        await resultsService.finalizeSession({
          sessionId: session.id,
          difficultyEnd,
          summary: computedSummary,
          durationMs: runtimeMs,
          gameVersion: plugin.version,
          endedAt,
        });
        const insight = {
          sessionId: session.id,
          gameId: plugin.id,
          summary: computedSummary,
          durationMs: runtimeMs,
          startedAt: session.startedAt,
          endedAt,
          mode,
          context: runContext,
          domain: getDomainForGame(plugin.id),
        };
        if (runContext?.assessmentId) {
          recordAssessmentInsight(insight);
        } else {
          recordSessionInsight(insight);
        }
        recordSessionCompletion({ summary: computedSummary, durationMs: runtimeMs, domain: getDomainForGame(plugin.id), startedAt: session.startedAt });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to finalize';
        setLastError(message);
      }
      setPhase('summary');
    },
    [difficulty, elapsedMs, mode, plugin, runContext, scores, session]
  );

  const handlePauseToggle = useCallback(() => {
    setIsPaused((value) => {
      if (value) {
        if (pauseStartedAt.current && trialStartedAt.current) {
          const pausedDuration = Date.now() - pauseStartedAt.current;
          trialStartedAt.current += pausedDuration;
          pauseStartedAt.current = null;
        }
        return false;
      }
      pauseStartedAt.current = Date.now();
      return true;
    });
  }, []);

  const handleExit = useCallback(() => {
    void finalizeSession();
  }, [finalizeSession]);

  const topBar = useMemo(() => {
    const progress = sessionConfig.mode === 'fixed'
      ? Math.min(1, scores.length / sessionConfig.trials)
      : durationLimit
        ? Math.min(1, elapsedMs / durationLimit)
        : 0;

    const statusLabel = sessionConfig.mode === 'fixed'
      ? `Trial ${Math.min(scores.length + 1, sessionConfig.trials)} / ${sessionConfig.trials}`
      : durationLimit
        ? `Time ${Math.max(0, Math.round((durationLimit - elapsedMs) / 1000))}s`
        : 'Timed';

    return (
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <Text style={styles.gameTitle}>{plugin.title}</Text>
          <Text style={styles.meta}>Difficulty {difficulty}</Text>
        </View>
        <View style={styles.progressBlock}>
          <Text style={styles.meta}>{statusLabel}</Text>
          <ProgressBar progress={progress} />
        </View>
      </View>
    );
  }, [difficulty, durationLimit, elapsedMs, plugin.title, scores.length, sessionConfig.mode, sessionConfig.trials]);

  const renderTutorial = useCallback(() => {
    const step = tutorialSteps[currentStep];
    return (
      <SlideUp>
        <View style={styles.card}>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.body}>{step.body}</Text>
          <PrimaryButton label={currentStep === tutorialSteps.length - 1 ? 'Begin' : 'Next'} onPress={handleTutorialNext} />
        </View>
      </SlideUp>
    );
  }, [currentStep, handleTutorialNext, tutorialSteps]);

  const renderCountdown = useCallback(
    () => (
      <SlideUp>
        <View style={styles.card}>
          <Countdown seconds={countdownSeconds} onComplete={beginRun} />
        </View>
      </SlideUp>
    ),
    [beginRun, countdownSeconds]
  );

  const renderTrial = useCallback(() => {
    if (!trialData) return null;
    return (
      <SlideUp>
        <View style={styles.card}>{plugin.renderTrial({ trialData, onInput: handleTrialInput, disabled: isPaused || phase !== 'running' })}</View>
      </SlideUp>
    );
  }, [handleTrialInput, isPaused, phase, plugin, trialData]);

  const renderSummary = useCallback(
    () => (
      <SlideUp>
        <View style={styles.card}>
          <Text style={styles.title}>Session complete</Text>
          <Text style={styles.body}>Accuracy: {(summary ?? summarizeScores(scores)).accuracyAvg.toFixed(2)}</Text>
          <Text style={styles.body}>Average time: {(summary ?? summarizeScores(scores)).timeAvgMs.toFixed(0)} ms</Text>
          <Text style={styles.body}>Total score: {(summary ?? summarizeScores(scores)).scoreTotal.toFixed(0)}</Text>
          <PrimaryButton label="Back to games" onPress={() => navigation.popToTop()} />
        </View>
      </SlideUp>
    ),
    [navigation, scores, summary]
  );

  const renderBlocked = useCallback(
    () => (
      <SlideUp>
        <View style={styles.card}>
          <Text style={styles.title}>Session locked</Text>
          <Text style={styles.body}>{blockedReason ?? 'Premium required for additional sessions today.'}</Text>
          <PrimaryButton label="Back" onPress={() => navigation.popToTop()} />
        </View>
      </SlideUp>
    ),
    [blockedReason, navigation]
  );

  const bodyContent = useMemo(() => {
    if (phase === 'blocked') return renderBlocked();
    if (!session && phase !== 'summary') {
      return (
        <View style={styles.card}>
          <Text style={styles.title}>Preparing session…</Text>
          <Text style={styles.body}>Connecting to ResultsService.</Text>
        </View>
      );
    }
    if (phase === 'tutorial') return renderTutorial();
    if (phase === 'countdown') return renderCountdown();
    if (phase === 'running') return renderTrial();
    if (phase === 'summary') return renderSummary();
    return null;
  }, [phase, renderBlocked, renderCountdown, renderSummary, renderTrial, renderTutorial, session]);

  const canPause = phase === 'running';
  const canExit = phase === 'running' || phase === 'summary';

  return (
    <View style={styles.container}>
      {topBar}
      <ScrollView contentContainerStyle={styles.scroll}>{bodyContent}</ScrollView>
      <View style={styles.footer}>
        {canPause ? (
          <PrimaryButton label={isPaused ? 'Resume' : 'Pause'} onPress={handlePauseToggle} variant="ghost" />
        ) : null}
        {canExit ? <PrimaryButton label="End session" onPress={handleExit} /> : null}
      </View>
      <ToastFeedback message={feedback} tone="neutral" />
      {lastError ? <ToastFeedback message={lastError} tone="warning" durationMs={4000} /> : null}
      {isPaused && phase === 'running' ? (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            <Text style={styles.title}>Paused</Text>
            <Text style={styles.body}>{isBackgrounded ? 'Resume when you are back.' : 'Take a quick breath.'}</Text>
            <PrimaryButton label="Resume" onPress={handlePauseToggle} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  scroll: {
    flexGrow: 1,
    paddingVertical: spacing.md,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  gameTitle: {
    ...typography.title,
  },
  meta: {
    ...typography.subtitle,
  },
  progressBlock: {
    flex: 1,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
  title: {
    ...typography.title,
  },
  body: {
    ...typography.body,
    color: colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(11, 18, 36, 0.8)',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  overlayCard: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 16,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
  },
});
