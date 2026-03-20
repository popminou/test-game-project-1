import { TERRITORY_DEFS, PLAYER_COLOR_VALUES, MAP_WIDTH, MAP_HEIGHT } from '@test-project/iso';
import type { GameState } from '@test-project/iso';

interface GameMapProps {
  gameState: GameState;
}

const UNOWNED_FILL = '#2b4030';

export function GameMap({ gameState }: GameMapProps) {
  const getTerritoryFill = (territoryId: string): string => {
    const state = gameState.territories.find((t) => t.id === territoryId);
    if (!state?.ownerId) return UNOWNED_FILL;
    const player = gameState.players.find((p) => p.id === state.ownerId);
    return player ? PLAYER_COLOR_VALUES[player.color] : UNOWNED_FILL;
  };

  return (
    <svg
      viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
      className="game-map"
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Ocean background */}
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="#132030" />

      {/* Subtle grid lines on ocean */}
      <defs>
        <pattern id="ocean-grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#162840" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width={MAP_WIDTH} height={MAP_HEIGHT} fill="url(#ocean-grid)" />

      {/* Map border */}
      <rect
        x={1}
        y={1}
        width={MAP_WIDTH - 2}
        height={MAP_HEIGHT - 2}
        fill="none"
        stroke="#1e3a54"
        strokeWidth={2}
      />

      {/* Territories */}
      {TERRITORY_DEFS.map((territory) => {
        const fill = getTerritoryFill(territory.id);
        const pointsStr = territory.points.map(([x, y]) => `${x},${y}`).join(' ');

        return (
          <g key={territory.id}>
            <polygon
              points={pointsStr}
              fill={fill}
              stroke="#0a1a0a"
              strokeWidth={1.5}
              className="territory-polygon"
            />
            {/* Territory name label with outline for readability */}
            <text
              x={territory.labelPos[0]}
              y={territory.labelPos[1]}
              textAnchor="middle"
              dominantBaseline="middle"
              className="territory-label"
            >
              {territory.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

