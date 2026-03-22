import type { CardPhase, CardType } from '@test-project/iso';

export const CARD_DEFINITIONS: { phases: CardPhase[]; type: CardType; name: string; description: string }[] = [
  // Events
  { phases: ['action'], type: 'event', name: 'Forced March', description: 'Move all your armies on one territory to an adjacent territory at no action point cost.' },
  { phases: ['battle'], type: 'event', name: 'Ambush', description: 'Your armies strike first this battle — attacker loses an extra die this round.' },
  { phases: ['preparation'], type: 'event', name: 'Conscription', description: 'Recruit two additional armies and place them on any territory you control.' },
  // Buildings
  { phases: ['action'], type: 'building', name: 'Watchtower', description: 'Place a watchtower on a territory you control; it cannot be attacked this turn.' },
  { phases: ['preparation'], type: 'building', name: 'Barracks', description: 'Increase your maximum army recruitment by one for the rest of the game.' },
  { phases: ['upkeep'], type: 'building', name: 'Supply Depot', description: 'Recover one spent action point at the start of your next turn.' },
  // Powers
  { phases: ['battle'], type: 'power', name: 'Iron Will', description: 'Re-roll all of your dice once during this battle round.' },
  { phases: ['action'], type: 'power', name: 'Diplomacy', description: 'Negotiate a temporary truce — one enemy player cannot attack you this turn.' },
  { phases: ['upkeep'], type: 'power', name: 'Rally the Troops', description: 'Restore full action points to yourself immediately.' },
];
