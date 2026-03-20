import { useState } from 'react';
import type { GameState } from '@test-project/iso';
import { GameMap } from './GameMap';
import { PlayerPanel } from './PlayerPanel';

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  onEndTurn: () => void;
  onLeave: () => void;
  onArmyMove: (armyIds: string[], toTerritoryId: string) => void;
}

export function GameBoard({ gameState, myPlayerId, onEndTurn, onLeave, onArmyMove }: GameBoardProps) {
  const [moveMode, setMoveMode] = useState(false);

  const toggleMoveMode = () => setMoveMode((prev) => !prev);

  return (
    <div className="game-board">
      <div className="map-container">
        <GameMap
          gameState={gameState}
          myPlayerId={myPlayerId}
          moveMode={moveMode}
          onArmyMove={onArmyMove}
        />
      </div>
      <PlayerPanel
        gameState={gameState}
        myPlayerId={myPlayerId}
        moveMode={moveMode}
        onToggleMoveMode={toggleMoveMode}
        onEndTurn={onEndTurn}
        onLeave={onLeave}
      />
    </div>
  );
}
