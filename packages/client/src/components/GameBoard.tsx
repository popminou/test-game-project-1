import { useEffect, useRef, useState } from 'react';
import type { GameState } from '@test-project/iso';
import { GameMap } from './GameMap';
import { PlayerPanel } from './PlayerPanel';
import { PlayerBar } from './PlayerBar';
import { CardHand } from './CardHand';
import { DeckPile } from './DeckPile';
import { DiscardPile } from './DiscardPile';
import { ActiveCardsPanel } from './ActiveCardsPanel';
import { BattleModal } from './BattleModal';

export type ActionMode = 'move' | 'battle' | null;

interface DrawAnimation {
  startId: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  // false = at deck position (pre-transition), true = animating to hand
  active: boolean;
}

interface GameBoardProps {
  gameState: GameState;
  myPlayerId: string;
  onEndTurn: () => void;
  onStepAdvance: () => void;
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
  onDrawCard: () => void;
}

export function GameBoard({ gameState, myPlayerId, onEndTurn, onStepAdvance, onLeave, onArmyMove, onCardPlay, onCardDiscard, onBattleStart, onBattleRetreat, onBattleResolve, onBattleRoll, onBattleEnd, onBattleCardPlay, onBattleCardDone, onDrawCard }: GameBoardProps) {
  const mapInnerRef = useRef<HTMLDivElement>(null);
  const battleOverlayRef = useRef<HTMLDivElement>(null);
  const myBattleZoneRef = useRef<HTMLDivElement>(null);
  const deckCardBackRef = useRef<HTMLDivElement>(null);
  const cardHandRef = useRef<HTMLDivElement>(null);

  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;
  const myPlayer = gameState.players.find((p) => p.id === myPlayerId);

  // Derive activeBattle from server state — only show to involved players
  const activeBattle = gameState.activeBattle &&
    (gameState.activeBattle.attackerPlayerId === myPlayerId ||
      gameState.activeBattle.defenderPlayerId === myPlayerId)
    ? gameState.activeBattle
    : null;

  const activeCardStep = activeBattle?.phase === 'card' ? 'battle' : gameState.turnStep;
  const canDraw = isMyTurn && gameState.turnStep === 'preparation' && gameState.numDrawnThisTurn < 1 && gameState.deck.length > 0;

  const [actionMode, setActionMode] = useState<ActionMode>(null);
  const [drawAnim, setDrawAnim] = useState<DrawAnimation | null>(null);

  // Reset action mode when leaving the move phase
  useEffect(() => {
    if (gameState.turnStep !== 'action' || gameState.actionPhase !== 'move') {
      setActionMode(null);
    }
  }, [gameState.turnStep, gameState.actionPhase]);

  // Kick off the draw animation CSS transition on the next frame
  useEffect(() => {
    if (drawAnim && !drawAnim.active) {
      const raf = requestAnimationFrame(() => {
        setDrawAnim((prev) => prev ? { ...prev, active: true } : null);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [drawAnim?.startId, drawAnim?.active]);

  // Clear draw animation after transition completes
  useEffect(() => {
    if (!drawAnim?.active) return;
    const timer = setTimeout(() => setDrawAnim(null), 400);
    return () => clearTimeout(timer);
  }, [drawAnim?.active]);

  const toggleActionMode = (mode: NonNullable<ActionMode>) => {
    setActionMode((prev) => (prev === mode ? null : mode));
  };

  const handleBattleStart = (territoryId: string, defenderPlayerId: string) => {
    setActionMode(null);
    onBattleStart(territoryId, defenderPlayerId);
  };

  const handleDrawCard = () => {
    onDrawCard();
    if (!deckCardBackRef.current || !cardHandRef.current) return;
    const deckRect = deckCardBackRef.current.getBoundingClientRect();
    const handRect = cardHandRef.current.getBoundingClientRect();
    setDrawAnim({
      startId: Date.now(),
      x: deckRect.left,
      y: deckRect.top,
      targetX: handRect.left + handRect.width / 2 - 50,
      targetY: handRect.top + (handRect.height - 150) / 2,
      active: false,
    });
  };

  return (
    <div className="game-board">
      <div className="map-container">
        {gameState.phase === 'playing' && currentPlayer && (
          <PlayerBar
            player={currentPlayer}
            isMyTurn={isMyTurn}
            inActionStep={isMyTurn && gameState.turnStep === 'action' && gameState.actionPhase === 'move'}
            actionMode={actionMode}
            hasAP={(myPlayer?.currentActionPoints ?? 0) > 0}
            onToggleActionMode={toggleActionMode}
          />
        )}
        <ActiveCardsPanel activeCards={gameState.activeCards} players={gameState.players} />
        <div className="map-inner" ref={mapInnerRef}>
          <GameMap
            gameState={gameState}
            myPlayerId={myPlayerId}
            actionMode={actionMode}
            onArmyMove={onArmyMove}
            onBattleStart={handleBattleStart}
          />
          <DeckPile deckSize={gameState.deck.length} canDraw={canDraw} onDraw={handleDrawCard} cardBackRef={deckCardBackRef} />
          <DiscardPile discardedCards={gameState.discardedCards} />
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
            activeCardStep={activeCardStep}
            mapInnerRef={mapInnerRef}
            onPlay={onCardPlay}
            onDiscard={onCardDiscard}
            battleDropRef={activeBattle?.phase === 'card' ? battleOverlayRef : undefined}
            onBattleCardPlay={activeBattle?.phase === 'card' ? onBattleCardPlay : undefined}
            battleCardZoneRef={activeBattle?.phase === 'card' ? myBattleZoneRef : undefined}
            handRef={cardHandRef}
          />
        )}
      </div>
      <PlayerPanel
        gameState={gameState}
        myPlayerId={myPlayerId}
        onEndTurn={onEndTurn}
        onStepAdvance={onStepAdvance}
        onLeave={onLeave}
      />
      {drawAnim && (
        <div
          className="card-back"
          style={{
            position: 'fixed',
            left: drawAnim.active ? drawAnim.targetX : drawAnim.x,
            top: drawAnim.active ? drawAnim.targetY : drawAnim.y,
            pointerEvents: 'none',
            zIndex: 1500,
            transition: drawAnim.active
              ? 'left 0.4s ease, top 0.4s ease, transform 0.4s ease'
              : 'none',
            transform: drawAnim.active ? 'scale(0.85) rotate(-5deg)' : 'scale(1) rotate(0deg)',
          }}
        />
      )}
    </div>
  );
}
