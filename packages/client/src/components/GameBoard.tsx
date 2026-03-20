import { useEffect, useState } from 'react';
import type { GameState } from '@test-project/iso';
import { GameMap } from './GameMap';
import { PlayerPanel } from './PlayerPanel';
import { ActionPointsBar } from './ActionPointsBar';

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  onEndTurn: () => void;
  onLeave: () => void;
  onArmyMove: (armyIds: string[], toTerritoryId: string) => void;
}

export function GameBoard({ gameState, myPlayerId, onEndTurn, onLeave, onArmyMove }: GameBoardProps) {
  const [moveMode, setMoveMode] = useState(false);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);

  // Exit move mode automatically when action points run out
  useEffect(() => {
    if (moveMode && myPlayer && myPlayer.currentActionPoints <= 0) {
      setMoveMode(false);
    }
  }, [myPlayer?.currentActionPoints]);

  const toggleMoveMode = () => setMoveMode((prev) => !prev);

  return (
    <div className="game-board">
      <div className="map-container">
        {gameState.phase === 'playing' && currentPlayer && (
          <ActionPointsBar player={currentPlayer} isMyTurn={isMyTurn} />
        )}
        <div className="map-inner">
          <GameMap
            gameState={gameState}
            myPlayerId={myPlayerId}
            moveMode={moveMode}
            onArmyMove={onArmyMove}
          />
        </div>
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
