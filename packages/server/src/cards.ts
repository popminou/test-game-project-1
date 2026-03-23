import type { CardDuration, CardPhase, CardType } from '@test-project/iso';

export const CARD_DEFINITIONS: { phases: CardPhase[]; type: CardType; name: string; description: string; duration: CardDuration }[] = [
  // Events
  { phases: ['action'], type: 'event', name: 'Forced March', description: 'Move all your armies on one territory to an adjacent territory at no action point cost.', duration: { type: 'instant' } },
  { phases: ['battle'], type: 'event', name: 'Ambush', description: 'Your armies strike first this battle — attacker loses an extra die this round.', duration: { type: 'turn-step', step: 'battle' } },
  { phases: ['preparation'], type: 'event', name: 'Conscription', description: 'Recruit two additional armies and place them on any territory you control.', duration: { type: 'instant' } },
  // Buildings
  { phases: ['action'], type: 'building', name: 'Watchtower', description: 'Place a watchtower on a territory you control; it cannot be attacked this turn.', duration: { type: 'turn-step', step: 'action' } },
  { phases: ['preparation'], type: 'building', name: 'Barracks', description: 'Increase your maximum army recruitment by one for the rest of the game.', duration: { type: 'permanent' } },
  { phases: ['upkeep'], type: 'building', name: 'Supply Depot', description: 'Recover one spent action point at the start of your next turn.', duration: { type: 'turns', count: 1 } },
  // Powers
  { phases: ['battle'], type: 'power', name: 'Iron Will', description: 'Re-roll all of your dice once during this battle round.', duration: { type: 'turn-step', step: 'battle' } },
  { phases: ['action'], type: 'power', name: 'Diplomacy', description: 'Negotiate a temporary truce — one enemy player cannot attack you this turn.', duration: { type: 'turn-step', step: 'action' } },
  { phases: ['upkeep'], type: 'power', name: 'Rally the Troops', description: 'Restore full action points to yourself immediately.', duration: { type: 'instant' } },
];
