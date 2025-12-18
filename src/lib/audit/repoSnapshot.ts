/**
 * Repo audit snapshot keeps a quick in-code overview of current flows.
 * This helps future contributors avoid breaking partially-built areas.
 */
export const repoAuditSnapshot = {
  navigation: 'AppNavigator gates on AuthProvider state; signed-out users see AuthScreen, signed-in users see Home + DEV_MENU (modal) stack.',
  authFlow:
    'AuthProvider wraps the app and wires Supabase email/password auth with AsyncStorage-backed session persistence.',
  supabase: {
    client:
      'src/lib/supabase/client.ts builds a singleton Supabase client using validated env variables (camelCase keys) and AsyncStorage auth storage.',
    tables: {
      game_sessions: {
        required: ['id', 'user_id', 'game_id', 'started_at', 'completed'],
        optional: [
          'difficulty_level',
          'difficulty_end',
          'variant',
          'finished_at',
          'duration_ms',
          'score',
          'accuracy',
          'summary',
          'extra',
          'app_version',
          'game_version',
          'metadata',
        ],
      },
      game_events: {
        required: ['id', 'session_id', 'event_type', 'payload', 'created_at'],
      },
      game_trials: {
        required: ['id', 'session_id', 'trial_index', 'trial_data', 'score', 'created_at'],
      },
    },
    resultFlow:
      'resultsService.createSession/appendTrial/finalizeSession is the canonical pathway, with plasticityBackend shims calling into it.',
  },
  games: [
    {
      id: 'choice-reaction',
      file: 'plasticity-games/games/choice-reaction.html',
      notes: 'Uses PlasticityGame.init + logEvent + end; sends dummy GAME_RESULT after a timeout.',
    },
    {
      id: 'mental-rotation-grid',
      file: 'plasticity-games/games/mental-rotation-grid.html',
      notes: 'Same harness pattern with PlasticityGame.logEvent TRIAL stub and GAME_RESULT payload.',
    },
    {
      id: 'spatial-memory-grid',
      file: 'plasticity-games/games/spatial-memory-grid.html',
      notes: 'Harness mirrors the other fundamentals and posts GAME_RESULT with dummy metrics.',
    },
  ],
  messageBridge:
    'src/frontend/gameMessageHandler.ts attaches a window message listener to persist GAME_RESULT payloads via plasticityBackend.',
};
