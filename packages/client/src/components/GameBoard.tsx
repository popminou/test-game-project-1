import { useEffect, useRef, useState } from 'react';
import type { GameState } from '@test-project/iso';
import { GameMap } from './GameMap';
import { PlayerPanel } from './PlayerPanel';
import { PlayerBar } from './PlayerBar';
import { CardHand } from './CardHand';
import { PlayedCards } from './PlayedCards';
import { BattleModal } from './BattleModal';

export type ActionMode = 'move' | 'battle' | null;

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  onEndTurn: () => void;
  onLeave: () => void;
  onArmyMove: (armyIds: string[], toTerritoryId: string) => void;
  onCardPlay: (cardId: string) => void;
  onCardDiscard: (cardId: string) => void;
  onBattleStart: (territoryId: string, defenderPlayerId: string) => void;
  onBattleRetreat: (territoryId: string) => void;
  onBattleResolve: (armyIds: string[]) => void;
  onBattleRoll: (attackerDice: number[], defenderDice: number[]) => void;
  onBattleEnd: () => void;
  onBattleCardPlay: (cardId: string) => void;
  onBattleCardDone: () => void;
}

export function GameBoard({ gameState, myPlayerId, onEndTurn, onLeave, onArmyMove, onCardPlay, onCardDiscard, onBattleStart, onBattleRetreat, onBattleResolve, onBattleRoll, onBattleEnd, onBattleCardPlay, onBattleCardDone }: GameBoardProps) {
  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const mapInnerRef = useRef<HTMLDivElement>(null);
  const battleOverlayRef = useRef<HTMLDivElement>(null);
  const myBattleZoneRef = useRef<HTMLDivElement>(null);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);

  // Derive activeBattle from server state — only show to involved players
  const activeBattle = gameState.activeBattle &&
    (gameState.activeBattle.attackerPlayerId === myPlayerId ||
      gameState.activeBattle.defenderPlayerId === myPlayerId)
    ? gameState.activeBattle
    : null;

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
              myPlayerId={myPlayerId}
              attackerPlayerId={activeBattle.attackerPlayerId}
              defenderPlayerId={activeBattle.defenderPlayerId}
              territoryId={activeBattle.territoryId}
              onRetreat={() => onBattleRetreat(activeBattle.territoryId)}
              onEndBattle={onBattleEnd}
              onArmiesLost={onBattleResolve}
              onRoll={onBattleRoll}
              overlayRef={battleOverlayRef}
              onCardDone={onBattleCardDone}
              attackerZoneRef={activeBattle.attackerPlayerId === myPlayerId ? myBattleZoneRef : undefined}
              defenderZoneRef={activeBattle.defenderPlayerId === myPlayerId ? myBattleZoneRef : undefined}
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
            battleDropRef={activeBattle?.phase === 'card' ? battleOverlayRef : undefined}
            onBattleCardPlay={activeBattle?.phase === 'card' ? onBattleCardPlay : undefined}
            battleCardZoneRef={activeBattle?.phase === 'card' ? myBattleZoneRef : undefined}
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
