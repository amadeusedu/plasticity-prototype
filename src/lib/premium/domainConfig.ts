export type CognitiveDomain = 'Speed' | 'Attention' | 'Memory' | 'Flexibility' | 'Reasoning';

export interface DomainConfig {
  id: CognitiveDomain;
  label: string;
  description: string;
}

export const domains: DomainConfig[] = [
  { id: 'Speed', label: 'Speed', description: 'Response timing and psychomotor pace.' },
  { id: 'Attention', label: 'Attention', description: 'Sustained focus and signal discrimination.' },
  { id: 'Memory', label: 'Memory', description: 'Working memory span and updating.' },
  { id: 'Flexibility', label: 'Flexibility', description: 'Task switching and set maintenance.' },
  { id: 'Reasoning', label: 'Reasoning', description: 'Spatial reasoning and pattern mapping.' },
];

export const domainByGame: Record<string, CognitiveDomain> = {
  'simple-reaction': 'Speed',
  'choice-reaction': 'Attention',
  'go-no-go': 'Attention',
  'flanker-arrows': 'Attention',
  stroop: 'Flexibility',
  'task-switching': 'Flexibility',
  'n-back': 'Memory',
  'mental-rotation-grid': 'Reasoning',
  'symbol-match-coding': 'Flexibility',
};

export function getDomainForGame(gameId: string): CognitiveDomain | undefined {
  return domainByGame[gameId];
}
