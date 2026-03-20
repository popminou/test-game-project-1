import type { GameState } from '@test-project/iso';
import { GameMap } from './GameMap';
import { PlayerPanel } from './PlayerPanel';

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  onEndTurn: () => void;
}

export function GameBoard({ gameState, myPlayerId, onEndTurn }: GameBoardProps) {
  return (
    <div className="game-board">
      <div className="map-container">
        <GameMap gameState={gameState} />
      </div>
      <PlayerPanel gameState={gameState} myPlayerId={myPlayerId} onEndTurn={onEndTurn} />
    </div>
  );
}
