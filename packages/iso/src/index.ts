export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

export interface HealthStatus {
  status: 'ok' | 'error';
  timestamp: string;
}

export const API_ROUTES = {
  health: '/api/health',
} as const;

// ---- Game Types ----

export type CardType = 'reinforce' | 'fortify' | 'raid' | 'diplomacy';

export interface Card {
  id: string;
  type: CardType;
  name: string;
  description: string;
}

export type PlayerColor = 'red' | 'blue' | 'green' | 'yellow';

export const PLAYER_COLOR_VALUES: Record<PlayerColor, string> = {
  red: '#c0392b',
  blue: '#2980b9',
  green: '#27ae60',
  yellow: '#d4a017',
};

export const PLAYER_COLOR_ORDER: PlayerColor[] = ['red', 'blue', 'green', 'yellow'];

export interface Player {
  id: string;
  name: string;
  color: PlayerColor;
  victoryPoints: number;
  maxActionPoints: number;
  currentActionPoints: number;
  hand: Card[];
}

export type GamePhase = 'lobby' | 'playing' | 'ended';

export interface TerritoryState {
  id: string;
  ownerId: string | null;
}

export interface Army {
  id: string;
  playerId: string;
  territoryId: string;
}

export interface ActiveBattle {
  attackerPlayerId: string;
  defenderPlayerId: string;
  territoryId: string;
  attackerDice: number[] | null;
  defenderDice: number[] | null;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  territories: TerritoryState[];
  territoryConnections: TerritoryConnection[];
  armies: Army[];
  currentPlayerIndex: number;
  turnNumber: number;
  deck: Card[];
  playedCards: Card[];
  activeBattle: ActiveBattle | null;
}

export interface ArmyMovePayload {
  armyIds: string[];
  toTerritoryId: string;
}

export interface BattleStartPayload {
  territoryId: string;
  defenderPlayerId: string;
}

export interface BattleRetreatPayload {
  territoryId: string;
}

export interface BattleResolvePayload {
  armyIds: string[];
}

export interface BattleRollPayload {
  attackerDice: number[];
  defenderDice: number[];
}

export interface CardPlayPayload {
  cardId: string;
}

export interface CardDiscardPayload {
  cardId: string;
}

// ---- Socket Event Types ----

export interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:error': (message: string) => void;
}

export interface ClientToServerEvents {
  'player:join': (
    name: string,
    callback: (response: { success: boolean; playerId?: string; error?: string }) => void,
  ) => void;
  'game:start': () => void;
  'turn:end': () => void;
  'army:move': (
    payload: ArmyMovePayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  'card:play': (
    payload: CardPlayPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  'card:discard': (
    payload: CardDiscardPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  'card:draw': (
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  'battle:start': (
    payload: BattleStartPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  'battle:retreat': (
    payload: BattleRetreatPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  'battle:resolve': (
    payload: BattleResolvePayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  'battle:roll': (
    payload: BattleRollPayload,
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
  'battle:end': (
    callback: (response: { success: boolean; error?: string }) => void,
  ) => void;
}

// ---- Static Map Definition ----

export interface TerritoryDef {
  id: string;
  name: string;
  /** SVG polygon points */
  points: [number, number][];
  /** Center position for the name label */
  labelPos: [number, number];
}

export interface TerritoryConnection {
  fromId: string;
  toId: string;
  type: 'primary' | 'secondary';
}

/** Maps territory id to [col, row] position in the 3×4 grid */
export const TERRITORY_GRID: Record<string, [number, number]> = {
  t1: [0, 0], t2: [1, 0], t3: [2, 0],
  t4: [0, 1], t5: [1, 1], t6: [2, 1],
  t7: [0, 2], t8: [1, 2], t9: [2, 2],
  t10: [0, 3], t11: [1, 3], t12: [2, 3],
};

export function generateTerritoryConnections(): TerritoryConnection[] {
  const ids = Object.keys(TERRITORY_GRID);
  const connections: TerritoryConnection[] = [];

  for (let i = 0; i < ids.length; i++) {
    for (let j = i + 1; j < ids.length; j++) {
      const [ac, ar] = TERRITORY_GRID[ids[i]];
      const [bc, br] = TERRITORY_GRID[ids[j]];
      const dc = Math.abs(ac - bc);
      const dr = Math.abs(ar - br);

      if ((dc === 0 && dr === 1) || (dc === 1 && dr === 0)) {
        if (Math.random() < 0.5) {
          connections.push({ fromId: ids[i], toId: ids[j], type: 'primary' });
        }
      } else if (dc === 1 && dr === 1) {
        if (Math.random() < 0.25) {
          connections.push({ fromId: ids[i], toId: ids[j], type: 'secondary' });
        }
      }
    }
  }

  // Ensure every territory has at least one connection
  for (const id of ids) {
    const hasConnection = connections.some((c) => c.fromId === id || c.toId === id);
    if (hasConnection) continue;

    // Pick a random cardinal neighbor and force a primary connection
    const [ac, ar] = TERRITORY_GRID[id];
    const cardinalNeighbors = ids.filter((otherId) => {
      const [bc, br] = TERRITORY_GRID[otherId];
      const dc = Math.abs(ac - bc);
      const dr = Math.abs(ar - br);
      return (dc === 0 && dr === 1) || (dc === 1 && dr === 0);
    });
    const pick = cardinalNeighbors[Math.floor(Math.random() * cardinalNeighbors.length)];
    connections.push({ fromId: id, toId: pick, type: 'primary' });
  }

  return connections;
}

export function areTerritoriesConnected(
  connections: TerritoryConnection[],
  a: string,
  b: string,
): boolean {
  return connections.some(
    (c) => (c.fromId === a && c.toId === b) || (c.fromId === b && c.toId === a),
  );
}

export const MAP_WIDTH = 700;
export const MAP_HEIGHT = 400;

/**
 * 12 territories arranged in a 3×4 grid with irregular shared borders.
 * All shared edges between adjacent territories use identical point sequences
 * (reversed) so polygons fit together seamlessly.
 *
 * Shared border key points:
 *   Col-1/2 boundary: (258,0)→(240,80)→(245,148)→(255,220)→(252,292)→(245,360)→(258,432)→(260,490)→(262,540)
 *   Col-2/3 boundary: (542,0)→(525,76)→(532,152)→(540,220)→(538,288)→(545,360)→(542,432)→(550,490)→(548,540)
 *   Row-1/2 boundary: (0,148)→(80,140)→(170,152)→(245,148) / (245,148)→(320,158)→(430,144)→(532,152) / (532,152)→(620,160)→(720,145)→(800,152)
 *   Row-2/3 boundary: (0,292)→(85,298)→(175,285)→(252,292) / (252,292)→(340,300)→(450,285)→(538,288) / (538,288)→(630,295)→(720,280)→(800,288)
 *   Row-3/4 boundary: (0,432)→(90,438)→(180,425)→(258,432) / (258,432)→(350,440)→(460,428)→(542,432) / (542,432)→(640,438)→(720,425)→(800,432)
 */
export const TERRITORY_DEFS: TerritoryDef[] = [
  // ---- Row 1: Northern territories ----
  {
    id: 't1',
    name: 'Frostheim',
    points: [
      [0, 0], [258, 0], [240, 80], [245, 148],
      [170, 152], [80, 140], [0, 148],
    ],
    labelPos: [126, 76],
  },
  {
    id: 't2',
    name: 'Icewatch',
    points: [
      [258, 0], [542, 0], [525, 76], [532, 152],
      [430, 144], [320, 158], [245, 148], [240, 80],
    ],
    labelPos: [395, 76],
  },
  {
    id: 't3',
    name: 'Snowpeak',
    points: [
      [542, 0], [800, 0], [800, 152],
      [720, 145], [620, 160], [532, 152], [525, 76],
    ],
    labelPos: [666, 76],
  },

  // ---- Row 2: Upper-middle territories ----
  {
    id: 't4',
    name: 'Coldmere',
    points: [
      [0, 148], [80, 140], [170, 152], [245, 148],
      [255, 220], [252, 292],
      [175, 285], [85, 298], [0, 292],
    ],
    labelPos: [125, 220],
  },
  {
    id: 't5',
    name: 'Irongate',
    points: [
      [245, 148], [320, 158], [430, 144], [532, 152],
      [540, 220], [538, 288],
      [450, 285], [340, 300], [252, 292],
      [255, 220],
    ],
    labelPos: [393, 218],
  },
  {
    id: 't6',
    name: 'Thornwood',
    points: [
      [532, 152], [620, 160], [720, 145], [800, 152],
      [800, 288],
      [720, 280], [630, 295], [538, 288],
      [540, 220],
    ],
    labelPos: [666, 218],
  },

  // ---- Row 3: Lower-middle territories ----
  {
    id: 't7',
    name: 'Heartland',
    points: [
      [0, 292], [85, 298], [175, 285], [252, 292],
      [245, 360], [258, 432],
      [180, 425], [90, 438], [0, 432],
    ],
    labelPos: [126, 362],
  },
  {
    id: 't8',
    name: 'Goldfields',
    points: [
      [252, 292], [340, 300], [450, 285], [538, 288],
      [545, 360], [542, 432],
      [460, 428], [350, 440], [258, 432],
      [245, 360],
    ],
    labelPos: [397, 360],
  },
  {
    id: 't9',
    name: 'Eastmarsh',
    points: [
      [538, 288], [630, 295], [720, 280], [800, 288],
      [800, 432],
      [720, 425], [640, 438], [542, 432],
      [545, 360],
    ],
    labelPos: [668, 360],
  },

  // ---- Row 4: Southern territories ----
  {
    id: 't10',
    name: 'Silverford',
    points: [
      [0, 432], [90, 438], [180, 425], [258, 432],
      [260, 490], [262, 540],
      [0, 540],
    ],
    labelPos: [130, 486],
  },
  {
    id: 't11',
    name: 'Sunhaven',
    points: [
      [258, 432], [350, 440], [460, 428], [542, 432],
      [550, 490], [548, 540],
      [262, 540], [260, 490],
    ],
    labelPos: [402, 486],
  },
  {
    id: 't12',
    name: 'Dustplains',
    points: [
      [542, 432], [640, 438], [720, 425], [800, 432],
      [800, 540],
      [548, 540], [550, 490],
    ],
    labelPos: [672, 486],
  },
];
