# Plasticity HTML Game Contract

## Definitions
- **Game**: Single HTML file under `plasticity-games/games/`.
- **Shell**: React wrapper / iframe harness embedding the game.
- **Contract**: postMessage data format plus required result/event fields.

## INIT_CONFIG
- Games MUST listen for `postMessage` payloads shaped `{ type: "INIT_CONFIG", config }`.
- Inside `initGame(config)`, call `PlasticityGame.init(config)` exactly once per session.
- Required `config` fields: `gameId`, `sessionId`, `difficultyLevel`.
- Optional `config` fields: `timeLimitMs`, `variant` (do not assume presence).

### Debug auto-init
- Auto-start with a debug config ONLY when `window.parent === window && !window.ReactNativeWebView`.
- In iframe/harness mode, do not auto-start unless explicitly triggered by the shell.

## GAME_RESULT
- When the session ends (complete or aborted), call `PlasticityGame.end(result)` once.
- `PlasticityGame.end` MUST emit a `postMessage` to the shell:
  ```json
  {
    "type": "GAME_RESULT",
    "gameId": "<from config>",
    "sessionId": "<from config>",
    "result": { ... },
    "events": [ ... ]
  }
  ```

### Required `result` fields (minimum)
- `score` (number)
- `accuracy` (0–1)
- `numTrials` (number)
- `numErrors` (number) **OR** game-specific error counts (include `numErrors` when possible)
- `avgReactionTimeMs` (number | null) — use `null` if not meaningful
- `completed` (boolean)
- Additional game-specific metrics are allowed (never rename/remove existing fields).

## Event Logging
- Every trial MUST emit at least one `TRIAL` event via `PlasticityGame.logEvent`.
- Each `TRIAL` event MUST include:
  - `type`: "TRIAL"
  - `trialIndex`: 0- or 1-based (consistent within the game)
  - `responded`: boolean (if applicable)
  - `responseCorrect`: boolean | null
  - `rtMs`: number | null
  - Any game-specific fields relevant to the trial
- Additional event types are allowed, but do not change shapes of existing ones without coordinating shell + backend updates.

## Compatibility Rules
- No breaking changes to message shapes without updating all games and backend consumers.
- Prefer backwards compatibility: add new fields instead of renaming/removing.

## Pre-release Checklist
- [ ] Listens for `{ type: "INIT_CONFIG", config }` and calls `PlasticityGame.init(config)`.
- [ ] Uses required `config` fields (`gameId`, `sessionId`, `difficultyLevel`) and handles optional `timeLimitMs`, `variant`.
- [ ] Does NOT auto-start in iframe/harness; debug auto-init only when top-level and not ReactNative WebView.
- [ ] Emits `GAME_RESULT` via `PlasticityGame.end` with `gameId`, `sessionId`, `result`, and `events`.
- [ ] `result` includes required metrics (score, accuracy, numTrials, numErrors or equivalents, avgReactionTimeMs/null, completed).
- [ ] Logs a `TRIAL` event per trial with required fields (type, trialIndex, responded, responseCorrect, rtMs) plus game-specific fields.
- [ ] Any additional events/metrics keep existing message shapes intact.
