# Release checklist for V1

## Environment
- Verify `.env` contains `SUPABASE_URL` and `SUPABASE_ANON_KEY` and they are valid for production.
- Confirm `ENVIRONMENT=production` for the production build and `ENVIRONMENT=preview` for staging builds.
- Ensure any feature flags for premium entitlements are explicitly set for launch tenants.

## Supabase
- RLS policies enabled for `game_sessions`, `game_trials`, and `game_events` with auth-based access.
- Confirm service role keys are NOT bundled with the client; only the anon key ships with the app.
- Run the Dev Menu RLS self-test on a production-like project to validate writes, trials, and finalization.

## Build commands
- Install deps: `npm install`
- Smoke validation: `npm run smoke`
- Start local preview: `npm run dev`
- Production bundle (Expo EAS or equivalent): `npm run build`

## Store preparation
- Upload latest app icon and screenshots for iOS/Android stores.
- Confirm app privacy labels and data collection disclosures match current telemetry (analytics only).
- Verify store listing links to the privacy policy and support email.
- Enable background recovery testing notes for QA (background/foreground resilience during games).

## Privacy and data
- Confirm crash/error reporting strips PII and only includes session IDs and stack traces.
- Validate local caches (session insights, queued writes) are stored using secure storage where available.
- Document data retention for Supabase tables and set backups prior to rollout.
- Re-run reports with seeded 14-day data to ensure missing-data paths render safely.
