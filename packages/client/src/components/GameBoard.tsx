import { useEffect, useRef, useState } from 'react';
import type { GameState } from '@test-project/iso';
import { GameMap } from './GameMap';
import { PlayerPanel } from './PlayerPanel';
import { PlayerBar } from './PlayerBar';
import { CardHand } from './CardHand';
import { PlayedCards } from './PlayedCards';
import { BattleModal } from './BattleModal';

export type ActionMode = 'move' | 'battle' | null;

interface ActiveBattle {
  attackerPlayerId: string;
  defenderPlayerId: string;
  territoryId: string;
}

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  onEndTurn: () => void;
  onLeave: () => void;
  onArmyMove: (armyIds: string[], toTerritoryId: string) => void;
  onCardPlay: (cardId: string) => void;
  onCardDiscard: (cardId: string) => void;
  onBattleStart: (territoryId: string, defenderPlayerId: string) => void;
}

export function GameBoard({ gameState, myPlayerId, onEndTurn, onLeave, onArmyMove, onCardPlay, onCardDiscard, onBattleStart }: GameBoardProps) {
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [activeBattle, setActiveBattle] = useState<ActiveBattle | null>(null);
  const mapInnerRef = useRef<HTMLDivElement>(null);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);

  // Exit action mode automatically when action points run out
  useEffect(() => {
    if (actionMode && myPlayer && myPlayer.currentActionPoints <= 0) {
      setActionMode(null);
    }
  }, [myPlayer?.currentActionPoints]);

  const toggleActionMode = (mode: NonNullable<ActionMode>) => {
    setActionMode((prev) => (prev === mode ? null : mode));
  };

  const handleBattleStart = (territoryId: string, defenderPlayerId: string) => {
    setActiveBattle({ attackerPlayerId: myPlayerId, defenderPlayerId, territoryId });
    setActionMode(null);
    onBattleStart(territoryId, defenderPlayerId);
  };

  return (
    <div className="game-board">
      <div className="map-container">
        {gameState.phase === 'playing' && currentPlayer && (
          <PlayerBar
            player={currentPlayer}
            isMyTurn={isMyTurn}
            actionMode={actionMode}
            hasAP={(myPlayer?.currentActionPoints ?? 0) > 0}
            onToggleActionMode={toggleActionMode}
          />
        )}
        <div className="map-inner" ref={mapInnerRef}>
          <GameMap
            gameState={gameState}
            myPlayerId={myPlayerId}
            actionMode={actionMode}
            onArmyMove={onArmyMove}
            onBattleStart={handleBattleStart}
          />
          <PlayedCards cards={gameState.playedCards} />
          {activeBattle && (
            <BattleModal
              gameState={gameState}
              attackerPlayerId={activeBattle.attackerPlayerId}
              defenderPlayerId={activeBattle.defenderPlayerId}
              territoryId={activeBattle.territoryId}
              onEndBattle={() => setActiveBattle(null)}
            />
          )}
        </div>
        {myPlayer && (
          <CardHand
            cards={myPlayer.hand}
            isMyTurn={isMyTurn}
            hasAP={(myPlayer.currentActionPoints ?? 0) > 0}
            mapInnerRef={mapInnerRef}
            onPlay={onCardPlay}
            onDiscard={onCardDiscard}
          />
        )}
      </div>
      <PlayerPanel
        gameState={gameState}
        myPlayerId={myPlayerId}
        onEndTurn={onEndTurn}
        onLeave={onLeave}
      />
    </div>
  );
}
