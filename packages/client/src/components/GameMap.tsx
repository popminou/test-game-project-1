import { TERRITORY_DEFS, PLAYER_COLOR_VALUES, MAP_WIDTH, MAP_HEIGHT } from '@test-project/iso';
import type { GameState } from '@test-project/iso';

interface GameMapProps {
  gameState: GameState;
}

const UNOWNED_FILL = '#2b4030';

/** Find where the ray from `from` toward `to` exits the polygon boundary. */
function getPolyEdgePoint(
  poly: [number, number][],
  from: [number, number],
  to: [number, number],
): [number, number] {
  const dx = to[0] - from[0];
  const dy = to[1] - from[1];
  let bestT = Infinity;
  let result: [number, number] = from;

  for (let i = 0; i < poly.length; i++) {
    const a = poly[i];
    const b = poly[(i + 1) % poly.length];
    // Parametric intersection of ray (from + t*d) with segment (a + u*(b-a))
    const ex = b[0] - a[0];
    const ey = b[1] - a[1];
    const denom = dx * ey - dy * ex;
    if (Math.abs(denom) < 1e-10) continue;
    const fx = a[0] - from[0];
    const fy = a[1] - from[1];
    const t = (fx * ey - fy * ex) / denom;
    const u = (fx * dy - fy * dx) / denom;
    if (t > 1e-6 && u >= 0 && u <= 1 && t < bestT) {
      bestT = t;
      result = [from[0] + t * dx, from[1] + t * dy];
    }
  }

  return result;
}

export function GameMap({ gameState }: GameMapProps) {
  const getTerritoryFill = (territoryId: string): string => {
    const state = gameState.territories.find((t) => t.id === territoryId);
    if (!state?.ownerId) return UNOWNED_FILL;
    const player = gameState.players.find((p) => p.id === state.ownerId);
    return player ? PLAYER_COLOR_VALUES[player.color] : UNOWNED_FILL;
  };

  const territoryById = Object.fromEntries(TERRITORY_DEFS.map((t) => [t.id, t]));

  console.log('[GameMap] territoryConnections:', gameState.territoryConnections);

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

      {/* Territory connections — rendered on top of polygons */}
      {gameState.territoryConnections.map((conn) => {
        const fromDef = territoryById[conn.fromId];
        const toDef = territoryById[conn.toId];
        if (!fromDef || !toDef) return null;

        const centerA = fromDef.labelPos;
        const centerB = toDef.labelPos;
        const edgeA = getPolyEdgePoint(fromDef.points, centerA, centerB);
        const edgeB = getPolyEdgePoint(toDef.points, centerB, centerA);
        const isPrimary = conn.type === 'primary';

        const angle =
          Math.atan2(centerB[1] - centerA[1], centerB[0] - centerA[0]) * (180 / Math.PI);
        // Primary: long side (30px) along connection direction
        // Secondary: short side (10px) along connection direction (long side perpendicular, facing territory centers)
        const [rw, rh] = isPrimary ? [30, 10] : [10, 30];

        return (
          <g key={`${conn.fromId}-${conn.toId}`}>
            <rect
              x={edgeA[0] - rw / 2}
              y={edgeA[1] - rh / 2}
              width={rw}
              height={rh}
              fill="yellow"
              transform={`rotate(${angle}, ${edgeA[0]}, ${edgeA[1]})`}
            />
            <rect
              x={edgeB[0] - rw / 2}
              y={edgeB[1] - rh / 2}
              width={rw}
              height={rh}
              fill="yellow"
              transform={`rotate(${angle}, ${edgeB[0]}, ${edgeB[1]})`}
            />
          </g>
        );
      })}
    </svg>
  );
}
