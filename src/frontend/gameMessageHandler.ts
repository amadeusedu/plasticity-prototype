/**
 * gameMessageHandler.ts
 * Listens for GAME_RESULT messages from HTML game iframes and saves them via the backend helper.
 */

import { saveGameResultAndEventsFromMessage, GameResultMessage } from '../backend/plasticityBackend';

/**
 * Attach a single global postMessage listener for game results.
 */
export function attachGameMessageListener(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('message', async (event: MessageEvent<unknown>) => {
    const data = event.data;
    if (!data || (data as { type?: string }).type !== 'GAME_RESULT') return;

    const msg = data as GameResultMessage;

    try {
      await saveGameResultAndEventsFromMessage(msg);
    } catch (error) {
      console.error('Error saving game result', error, data);
    }
  });
}
