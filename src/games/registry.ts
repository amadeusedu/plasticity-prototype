import { GameCategory, GamePlugin } from './types';
import { dummyGridGame } from './plugins/dummyGrid';

const plugins: Record<string, GamePlugin> = {
  [dummyGridGame.id]: dummyGridGame,
};

export function getGamePlugin(gameId: string): GamePlugin {
  const plugin = plugins[gameId];
  if (!plugin) {
    throw new Error(`Game plugin not found: ${gameId}`);
  }
  return plugin;
}

export function listGames(): GamePlugin[] {
  return Object.values(plugins);
}

export function listCategories(): GameCategory[] {
  const set = new Set<GameCategory>();
  Object.values(plugins).forEach((plugin) => set.add(plugin.category));
  return Array.from(set);
}
