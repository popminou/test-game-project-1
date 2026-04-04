import type { CardDuration, CardTarget, CardType, GameStep } from '@test-project/iso';

export const CARD_DEFINITIONS: { cardId: string; steps: GameStep[]; type: CardType; name: string; description: string; duration: CardDuration; target?: CardTarget }[] = [
  // Preparation — Events
{ cardId: 'conscription', steps: ['preparation'], type: 'event', name: 'Conscription', description: 'Recruit two armies and place them on any ONE territory you control.', duration: { type: 'instant' }, target: 'controlled-territory' },
  { cardId: 'forced-labor', steps: ['preparation'], type: 'event', name: 'Forced Labor', description: 'Play one Building card from your hand, paying the normal cost.', duration: { type: 'instant' } },
  { cardId: 'spy-mission', steps: ['preparation'], type: 'event', name: 'Spy Mission', description: 'Draw 2 cards.', duration: { type: 'instant' } },
  { cardId: 'diplomatic-agreement', steps: ['preparation'], type: 'event', name: 'Diplomatic Agreement', description: 'Negotiate a temporary truce — an enemy player and you cannot attack each other.', duration: { type: 'until-next-step', step: 'preparation' } },
  { cardId: 'logistics', steps: ['preparation'], type: 'event', name: 'Logistics', description: 'Increase your maximum Action Points by 1 this turn only.', duration: { type: 'instant' } },
  { cardId: 'supply-transports', steps: ['preparation'], type: 'event', name: 'Supply Transports', description: 'Gain 4 credits.', duration: { type: 'instant' } },
  // Action — Events
  { cardId: 'forced-march', steps: ['action'], type: 'event', name: 'Forced March', description: 'Move all your armies on one territory to an adjacent territory at no action point cost. Lose one army that was moved.', duration: { type: 'instant' } },
  { cardId: 'air-lift', steps: ['action'], type: 'event', name: 'Air Lift', description: 'Move up to 3 armies up to 2 territories away.', duration: { type: 'instant' } },
  { cardId: 'planted-intelligence', steps: ['action'], type: 'event', name: 'Planted Intelligence', description: 'Move 2 enemy armies from one territory to another territory.', duration: { type: 'instant' } },
  { cardId: 'ion-storm', steps: ['action'], type: 'event', name: 'Ion Storm', description: 'Choose a territory. No armies can move to or from the territory.', duration: { type: 'turns', count: 1 } },
  // Action — Buildings
  { cardId: 'bunker', steps: ['action'], type: 'building', name: 'Bunker', description: 'Build a Bunker on a territory you control. Remove one army from that territory.', duration: { type: 'instant' } },
  // Battle — Events
  { cardId: 'null-field-generator', steps: ['battle'], type: 'event', name: 'Null Field Generator', description: "Cancel or remove the opponent's battle card.", duration: { type: 'instant' } },
  { cardId: 'ambush', steps: ['battle'], type: 'event', name: 'Ambush', description: 'On the first round of battle, the enemy gets one less dice (minimum of 1 dice).', duration: { type: 'turn-step', step: 'battle' } },
  { cardId: 'maneuver', steps: ['battle'], type: 'event', name: 'Maneuver', description: 'Equal dice are considered as a success for you.', duration: { type: 'turn-step', step: 'battle' } },
  { cardId: 'snipers', steps: ['battle'], type: 'event', name: 'Snipers!', description: 'The enemy loses one army.', duration: { type: 'instant' } },
  { cardId: 'trenches', steps: ['battle'], type: 'event', name: 'Trenches', description: 'As a defender, you can have as many as 3 dice to defend (if you have enough armies), instead of the usual 2 dice.', duration: { type: 'instant' } },
  { cardId: 'plasma-weapons', steps: ['battle'], type: 'event', name: 'Plasma Weapons', description: 'All your dice rolls gain +1 (maximum value of 6).', duration: { type: 'turn-step', step: 'battle' } },
  { cardId: 'power-armor', steps: ['battle'], type: 'event', name: 'Power Armor', description: "All of your enemy's dice rolls gain -1 (minimum value of 1).", duration: { type: 'turn-step', step: 'battle' } },
  { cardId: 'iron-will', steps: ['battle'], type: 'event', name: 'Iron Will', description: 'Once this battle, re-roll all your dice.', duration: { type: 'turn-step', step: 'battle' } },
  { cardId: 'underground-tunnels', steps: ['battle'], type: 'event', name: 'Underground Tunnels', description: 'Flee the battle without losing any armies.', duration: { type: 'turn-step', step: 'battle' } },
  // Preparation — Powers (not included in the draw deck)
  { cardId: 'clones', steps: ['preparation'], type: 'power', name: 'Clones', description: 'Increase your army recruitment by one during the Preparation Step.', duration: { type: 'permanent' } },
  { cardId: 'slave-pits', steps: ['preparation'], type: 'power', name: 'Slave Pits', description: 'Increase your credit acquisition by 2 during the Preparation Step.', duration: { type: 'permanent' } },
  { cardId: 'recycling-nanobots', steps: ['preparation'], type: 'power', name: 'Recycling Nanobots', description: 'Whenever you draw from the draw pile, instead draw 2; keep one, and put the other one at the bottom of the pile.', duration: { type: 'permanent' } },
];

// Draw deck composition: [cardId, count]
export const DRAW_DECK: [string, number][] = [
  // Preparation
  ['conscription', 20],
  // ['forced-labor', 2],
  // ['spy-mission', 2],
  // ['diplomatic-agreement', 2],
  // ['logistics', 2],
  // ['supply-transports', 2],
  // // Action
  // ['forced-march', 2],
  // ['air-lift', 2],
  // ['planted-intelligence', 2],
  // ['ion-storm', 2],
  // ['bunker', 2],
  // // Battle
  // ['null-field-generator', 2],
  // ['ambush', 2],
  // ['maneuver', 2],
  // ['snipers', 2],
  // ['trenches', 2],
  // ['plasma-weapons', 2],
  // ['power-armor', 2],
  // ['iron-will', 2],
  // ['underground-tunnels', 2],
];
