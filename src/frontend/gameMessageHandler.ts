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

  window.addEventListener('message', async (event: MessageEvent) => {
    const data: any = event.data;
    if (!data || data.type !== 'GAME_RESULT') return;

    const msg = data as GameResultMessage;

    try {
      await saveGameResultAndEventsFromMessage(msg);
      // Optional: emit some custom event or callback hook here for UI updates.
      // e.g., console.log('Game result saved', msg);
    } catch (error) {
      console.error('Error saving game result', error, data);
    }
  });
}
