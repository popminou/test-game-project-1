import { useEffect, useRef, useState } from 'react';
import {
  TERRITORY_DEFS,
  PLAYER_COLOR_VALUES,
  MAP_WIDTH,
  MAP_HEIGHT,
  areTerritoriesConnected,
} from '@test-project/iso';
import type { GameState, Army } from '@test-project/iso';
import type { ActionMode } from './GameBoard';

interface GameMapProps {
  gameState: GameState;
  myPlayerId: string;
  actionMode: ActionMode;
  onArmyMove: (armyIds: string[], toTerritoryId: string) => void;
  onBattleStart: (territoryId: string, defenderPlayerId: string) => void;
}

interface Tooltip {
  text: string;
  x: number;
  y: number;
}

type Modal =
  | { type: 'confirm'; toTerritoryId: string }
  | { type: 'info'; message: string };

const UNOWNED_FILL = '#2b4030';
const ARMY_SIZE = 15;
const ARMY_GAP = 2;
const ARMY_STEP = ARMY_SIZE + ARMY_GAP;
const CLUSTER_SPACING = 52;

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

function getSvgPoint(
  svgEl: SVGSVGElement,
  e: React.MouseEvent,
): { x: number; y: number } {
  const pt = svgEl.createSVGPoint();
  pt.x = e.clientX;
  pt.y = e.clientY;
  const { x, y } = pt.matrixTransform(svgEl.getScreenCTM()!.inverse());
  return { x, y };
}

/** Compute the top-left position of each army rect within its territory. */
function getArmyPositions(
  armies: Army[],
  players: GameState['players'],
): Map<string, { x: number; y: number }> {
  const positions = new Map<string, { x: number; y: number }>();

  for (const territory of TERRITORY_DEFS) {
    const [lx, ly] = territory.labelPos;

    const playerOrder = players.map((p) => p.id);
    const byPlayer = new Map<string, string[]>();
    for (const army of armies) {
      if (army.territoryId !== territory.id) continue;
      if (!byPlayer.has(army.playerId)) byPlayer.set(army.playerId, []);
      byPlayer.get(army.playerId)!.push(army.id);
    }

    const playerIds = playerOrder.filter((id) => byPlayer.has(id));
    const numGroups = playerIds.length;
    if (numGroups === 0) continue;

    playerIds.forEach((playerId, pi) => {
      const armyIds = byPlayer.get(playerId)!;
      const clusterX = lx - ((numGroups - 1) * CLUSTER_SPACING) / 2 + pi * CLUSTER_SPACING;
      const clusterY = ly + 18;
      const cols = Math.min(armyIds.length, 3);

      armyIds.forEach((armyId, i) => {
        const col = i % 3;
        const row = Math.floor(i / 3);
        positions.set(armyId, {
          x: clusterX - (cols * ARMY_STEP - ARMY_GAP) / 2 + col * ARMY_STEP,
          y: clusterY + row * ARMY_STEP,
        });
      });
    });
  }

  return positions;
}

export function GameMap({ gameState, myPlayerId, actionMode, onArmyMove, onBattleStart }: GameMapProps) {
  const moveMode = actionMode === 'move';
  const battleMode = actionMode === 'battle';
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [selectedArmyIds, setSelectedArmyIds] = useState<string[]>([]);
  const [selectedTerritoryId, setSelectedTerritoryId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const [hoverTerritoryId, setHoverTerritoryId] = useState<string | null>(null);
  const [modal, setModal] = useState<Modal | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const mouseDownPos = useRef<{ x: number; y: number } | null>(null);

  // Clear selection when move mode is disabled
  useEffect(() => {
    if (!moveMode) {
      setSelectedArmyIds([]);
      setSelectedTerritoryId(null);
      setIsDragging(false);
      setDragPos(null);
      mouseDownPos.current = null;
    }
  }, [moveMode]);

  const getBattleInfo = (territoryId: string): { canBattle: boolean; enemyPlayerIds: string[] } => {
    const armiesHere = armies.filter((a) => a.territoryId === territoryId);
    const hasMyArmies = armiesHere.some((a) => a.playerId === myPlayerId);
    if (!hasMyArmies) return { canBattle: false, enemyPlayerIds: [] };
    const enemyPlayerIds = [...new Set(
      armiesHere.filter((a) => a.playerId !== myPlayerId).map((a) => a.playerId),
    )];
    return { canBattle: enemyPlayerIds.length > 0, enemyPlayerIds };
  };

  const getTerritoryFill = (territoryId: string): string => {
    if (battleMode) {
      const { canBattle } = getBattleInfo(territoryId);
      return canBattle ? '#e07020' : '#555';
    }
    const state = gameState.territories.find((t) => t.id === territoryId);
    if (!state?.ownerId) return UNOWNED_FILL;
    const player = gameState.players.find((p) => p.id === state.ownerId);
    return player ? PLAYER_COLOR_VALUES[player.color] : UNOWNED_FILL;
  };

  const handleTerritoryClick = (territoryId: string) => {
    if (!battleMode) return;
    const { canBattle, enemyPlayerIds } = getBattleInfo(territoryId);
    if (!canBattle) return;
    const defenderId = enemyPlayerIds[Math.floor(Math.random() * enemyPlayerIds.length)];
    onBattleStart(territoryId, defenderId);
  };

  const territoryById = Object.fromEntries(TERRITORY_DEFS.map((t) => [t.id, t]));
  const armies = gameState.armies ?? [];
  const armyPositions = getArmyPositions(armies, gameState.players);

  const cancelMove = () => {
    setSelectedArmyIds([]);
    setSelectedTerritoryId(null);
    setIsDragging(false);
    setDragPos(null);
    setModal(null);
    mouseDownPos.current = null;
  };

  const confirmMove = (toTerritoryId: string) => {
    onArmyMove(selectedArmyIds, toTerritoryId);
    cancelMove();
  };

  const handleArmyMouseDown = (army: Army, e: React.MouseEvent<SVGRectElement>) => {
    if (!moveMode) return;
    if (army.playerId !== myPlayerId) return;
    e.stopPropagation();

    if (!svgRef.current) return;
    mouseDownPos.current = getSvgPoint(svgRef.current, e);

    if (selectedTerritoryId === null || selectedTerritoryId === army.territoryId) {
      setSelectedTerritoryId(army.territoryId);
      setSelectedArmyIds((prev) =>
        prev.includes(army.id) ? prev : [...prev, army.id],
      );
    } else {
      setSelectedTerritoryId(army.territoryId);
      setSelectedArmyIds([army.id]);
    }
  };

  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!moveMode || !mouseDownPos.current || !svgRef.current) return;
    const pt = getSvgPoint(svgRef.current, e);
    const dx = pt.x - mouseDownPos.current.x;
    const dy = pt.y - mouseDownPos.current.y;
    if (!isDragging && Math.sqrt(dx * dx + dy * dy) > 5) {
      setIsDragging(true);
    }
    if (isDragging || Math.sqrt(dx * dx + dy * dy) > 5) {
      setDragPos(pt);
    }
  };

  const handleSvgMouseUp = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!moveMode || !mouseDownPos.current) return;
    e.stopPropagation();

    if (isDragging && hoverTerritoryId && selectedTerritoryId && selectedArmyIds.length > 0) {
      if (hoverTerritoryId === selectedTerritoryId) {
        cancelMove();
      } else if (
        areTerritoriesConnected(
          gameState.territoryConnections,
          selectedTerritoryId,
          hoverTerritoryId,
        )
      ) {
        setIsDragging(false);
        setDragPos(null);
        mouseDownPos.current = null;
        setHoverTerritoryId(null);
        setModal({ type: 'confirm', toTerritoryId: hoverTerritoryId });
      } else {
        setIsDragging(false);
        setDragPos(null);
        mouseDownPos.current = null;
        setHoverTerritoryId(null);
        setModal({ type: 'info', message: 'These territories are not connected.' });
      }
    } else {
      setIsDragging(false);
      setDragPos(null);
      mouseDownPos.current = null;
      setHoverTerritoryId(null);
    }
  };

  const renderDragGhost = () => {
    if (!isDragging || !dragPos || selectedArmyIds.length === 0) return null;
    const count = selectedArmyIds.length;
    const cols = Math.min(count, 3);
    const totalW = cols * ARMY_STEP - ARMY_GAP;
    const firstArmy = gameState.armies.find((a) => a.id === selectedArmyIds[0]);
    const player = gameState.players.find((p) => p.id === firstArmy?.playerId);
    const fill = player ? PLAYER_COLOR_VALUES[player.color] : '#888';

    return (
      <g style={{ pointerEvents: 'none' }} opacity={0.65}>
        {selectedArmyIds.map((_, i) => {
          const col = i % 3;
          const row = Math.floor(i / 3);
          return (
            <rect
              key={i}
              x={dragPos.x - totalW / 2 + col * ARMY_STEP}
              y={dragPos.y - ARMY_SIZE / 2 + row * ARMY_STEP}
              width={ARMY_SIZE}
              height={ARMY_SIZE}
              fill={fill}
              stroke="white"
              strokeWidth={1.5}
              rx={2}
            />
          );
        })}
      </g>
    );
  };

  const toTerritoryName = (id: string) => territoryById[id]?.name ?? id;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${MAP_WIDTH} ${MAP_HEIGHT}`}
        className="game-map"
        preserveAspectRatio="xMidYMid meet"
        style={moveMode ? { cursor: 'crosshair' } : battleMode ? { cursor: 'pointer' } : undefined}
        onMouseMove={handleSvgMouseMove}
        onMouseUp={handleSvgMouseUp}
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
                style={battleMode ? { cursor: getBattleInfo(territory.id).canBattle ? 'pointer' : 'not-allowed' } : undefined}
                onClick={() => handleTerritoryClick(territory.id)}
                onMouseEnter={() => {
                  if (isDragging || battleMode) setHoverTerritoryId(territory.id);
                }}
                onMouseLeave={() => {
                  if (isDragging || battleMode) setHoverTerritoryId((prev) =>
                    prev === territory.id ? null : prev,
                  );
                }}
              />
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

        {/* Territory connections */}
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
          const [rw, rh] = isPrimary ? [30, 10] : [10, 30];

          const tooltipText = `${fromDef.name} ↔ ${toDef.name}`;

          return (
            <g key={`${conn.fromId}-${conn.toId}`}>
              <rect
                x={edgeA[0] - rw / 2}
                y={edgeA[1] - rh / 2}
                width={rw}
                height={rh}
                fill="yellow"
                transform={`rotate(${angle}, ${edgeA[0]}, ${edgeA[1]})`}
                onMouseEnter={() => setTooltip({ text: tooltipText, x: edgeA[0], y: edgeA[1] })}
                onMouseLeave={() => setTooltip(null)}
              />
              <rect
                x={edgeB[0] - rw / 2}
                y={edgeB[1] - rh / 2}
                width={rw}
                height={rh}
                fill="yellow"
                transform={`rotate(${angle}, ${edgeB[0]}, ${edgeB[1]})`}
                onMouseEnter={() => setTooltip({ text: tooltipText, x: edgeB[0], y: edgeB[1] })}
                onMouseLeave={() => setTooltip(null)}
              />
            </g>
          );
        })}

        {/* Armies — rendered last so they appear above all other map elements */}
        {armies.map((army) => {
          const pos = armyPositions.get(army.id);
          if (!pos) return null;
          const player = gameState.players.find((p) => p.id === army.playerId);
          if (!player) return null;
          const fill = PLAYER_COLOR_VALUES[player.color];
          const isSelected = selectedArmyIds.includes(army.id);
          const isGhosted = isDragging && isSelected;

          return (
            <rect
              key={army.id}
              x={pos.x}
              y={pos.y}
              width={ARMY_SIZE}
              height={ARMY_SIZE}
              fill={fill}
              stroke={isSelected ? 'white' : 'rgba(0,0,0,0.4)'}
              strokeWidth={isSelected ? 2 : 1}
              rx={2}
              opacity={isGhosted ? 0.25 : 1}
              style={
                moveMode && army.playerId === myPlayerId ? { cursor: 'grab' } : undefined
              }
              onMouseDown={(e) => handleArmyMouseDown(army, e)}
            />
          );
        })}

        {/* Drag ghost */}
        {renderDragGhost()}

        {/* Connection tooltip */}
        {tooltip && (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={tooltip.x - tooltip.text.length * 3.5 - 8}
              y={tooltip.y - 30}
              width={tooltip.text.length * 7 + 16}
              height={20}
              fill="rgba(0,0,0,0.85)"
              rx={3}
            />
            <text
              x={tooltip.x}
              y={tooltip.y - 20}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="white"
              fontSize={11}
              fontFamily="Georgia, serif"
            >
              {tooltip.text}
            </text>
          </g>
        )}
      </svg>

      {/* Modals */}
      {modal?.type === 'confirm' && (
        <div className="map-modal-overlay">
          <div className="map-modal">
            <p>
              Move {selectedArmyIds.length}{' '}
              {selectedArmyIds.length === 1 ? 'army' : 'armies'} to{' '}
              <strong>{toTerritoryName(modal.toTerritoryId)}</strong>?
            </p>
            <div className="map-modal-buttons">
              <button className="btn-confirm" onClick={() => confirmMove(modal.toTerritoryId)}>
                Confirm
              </button>
              <button className="btn-cancel" onClick={cancelMove}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {modal?.type === 'info' && (
        <div className="map-modal-overlay">
          <div className="map-modal">
            <p>{modal.message}</p>
            <div className="map-modal-buttons">
              <button className="btn-confirm" onClick={cancelMove}>
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
