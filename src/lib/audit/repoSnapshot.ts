/**
 * Repo audit snapshot keeps a quick in-code overview of current flows.
 * This helps future contributors avoid breaking partially-built areas.
 */
export const repoAuditSnapshot = {
  navigation: 'AppNavigator uses a stack with Home and DEV_MENU (modal) screens.',
  authFlow:
    'Supabase auth not wired in UI yet; backend helpers assume authenticated user_id is provided when creating sessions.',
  supabase: {
    client: 'src/backend/supabaseClient.ts builds a singleton Supabase client using validated env variables.',
    tables: {
      game_sessions: {
        required: ['id', 'user_id', 'game_id', 'started_at', 'completed'],
        optional: ['difficulty_level', 'variant', 'finished_at', 'score', 'accuracy', 'extra'],
      },
      game_events: {
        required: ['id', 'session_id', 'event_type', 'payload', 'created_at'],
      },
    },
    resultFlow: 'createGameSession, completeGameSession, and logGameEvent orchestrate writes to Supabase tables.',
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
