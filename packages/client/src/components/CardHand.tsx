import { useState, useEffect, useRef } from 'react';
import type { Card, GameStep } from '@test-project/iso';

interface CardHandProps {
  cards: Card[];
  isMyTurn: boolean;
  hasAP: boolean;
  activeCardStep: GameStep;
  mapInnerRef: React.RefObject<HTMLDivElement | null>;
  onPlay: (cardId: string) => void;
  onDiscard: (cardId: string) => void;
  battleDropRef?: React.RefObject<HTMLDivElement | null>;
  onBattleCardPlay?: (cardId: string) => void;
  battleCardZoneRef?: React.RefObject<HTMLDivElement | null>;
  handRef?: React.RefObject<HTMLDivElement | null>;
}

interface DragState {
  cardId: string;
  offsetX: number;
  offsetY: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
}

interface ReturnState {
  cardId: string;
  card: Card;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  // false = at drop position (pre-transition), true = at hand position (animating)
  active: boolean;
}

interface FlyingState {
  cardId: string;
  card: Card;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  // false = at drop position (pre-transition), true = animating to zone
  active: boolean;
}

const DRAG_THRESHOLD = 5;

export function CardHand({ cards, isMyTurn, hasAP, activeCardStep, mapInnerRef, onPlay, onDiscard, battleDropRef, onBattleCardPlay, battleCardZoneRef, handRef }: CardHandProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [returning, setReturning] = useState<ReturnState | null>(null);
  const [flying, setFlying] = useState<FlyingState | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // During battle card phase both players can act, not just the current turn player
  const isCardDisabled = (card: Card) => {
    if (!card.steps.includes(activeCardStep)) return true;
    if (activeCardStep === 'battle') return false;
    return !isMyTurn;
  };

  const isDragging = drag !== null &&
    (Math.abs(drag.x - drag.startX) > DRAG_THRESHOLD || Math.abs(drag.y - drag.startY) > DRAG_THRESHOLD);

  const isOverMap = isDragging && drag && (() => {
    const rect = mapInnerRef.current?.getBoundingClientRect();
    return rect &&
      drag.x >= rect.left && drag.x <= rect.right &&
      drag.y >= rect.top && drag.y <= rect.bottom;
  })();

  const isOverBattle = isDragging && drag && battleDropRef && (() => {
    const rect = battleDropRef.current?.getBoundingClientRect();
    return rect &&
      drag.x >= rect.left && drag.x <= rect.right &&
      drag.y >= rect.top && drag.y <= rect.bottom;
  })();

  // Kick off the CSS transition on the next frame after the ghost is rendered at drop position
  useEffect(() => {
    if (returning && !returning.active) {
      const raf = requestAnimationFrame(() => {
        setReturning((prev) => prev ? { ...prev, active: true } : null);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [returning?.cardId, returning?.active]);

  // Clear return state after animation completes
  useEffect(() => {
    if (!returning?.active) return;
    const timer = setTimeout(() => setReturning(null), 250);
    return () => clearTimeout(timer);
  }, [returning?.active]);

  // Kick off flying transition on next frame
  useEffect(() => {
    if (flying && !flying.active) {
      const raf = requestAnimationFrame(() => {
        setFlying((prev) => prev ? { ...prev, active: true } : null);
      });
      return () => cancelAnimationFrame(raf);
    }
  }, [flying?.cardId, flying?.active]);

  // After flying completes, emit the card play and clear state
  useEffect(() => {
    if (!flying?.active) return;
    const cardId = flying.cardId;
    const timer = setTimeout(() => {
      onBattleCardPlay?.(cardId);
      setFlying(null);
    }, 350);
    return () => clearTimeout(timer);
  }, [flying?.active]);

  useEffect(() => {
    if (!drag) return;

    const handleMouseMove = (e: MouseEvent) => {
      setDrag((prev) => prev ? { ...prev, x: e.clientX, y: e.clientY } : null);
    };

    const handleMouseUp = (e: MouseEvent) => {
      setDrag((prev) => {
        if (!prev) return null;

        const moved = Math.abs(prev.x - prev.startX) > DRAG_THRESHOLD ||
                      Math.abs(prev.y - prev.startY) > DRAG_THRESHOLD;

        const card = cards.find((c) => c.id === prev.cardId);
        if (!moved && isMyTurn && card && !isCardDisabled(card)) {
          setSelectedCardId((sel) => (sel === prev.cardId ? null : prev.cardId));
          return null;
        }

        if (moved) {
          // Check if dropped on the battle overlay (card phase)
          const battleRect = battleDropRef?.current?.getBoundingClientRect();
          const droppedOnBattle = battleRect &&
            e.clientX >= battleRect.left && e.clientX <= battleRect.right &&
            e.clientY >= battleRect.top && e.clientY <= battleRect.bottom;

          if (droppedOnBattle && onBattleCardPlay) {
            const cardEl = cardRefs.current.get(prev.cardId);
            const card = cards.find((c) => c.id === prev.cardId);
            const zoneEl = battleCardZoneRef?.current;
            if (cardEl && card && zoneEl) {
              const cardRect = cardEl.getBoundingClientRect();
              const zoneRect = zoneEl.getBoundingClientRect();
              setFlying({
                cardId: prev.cardId,
                card,
                x: e.clientX - prev.offsetX,
                y: e.clientY - prev.offsetY,
                targetX: zoneRect.left + zoneRect.width / 2 - cardRect.width / 2,
                targetY: zoneRect.top + 36,
                active: false,
              });
            } else {
              onBattleCardPlay(prev.cardId);
            }
            return null;
          }

          // Check if dropped on the map
          const mapRect = mapInnerRef.current?.getBoundingClientRect();
          const droppedOnMap = mapRect &&
            e.clientX >= mapRect.left && e.clientX <= mapRect.right &&
            e.clientY >= mapRect.top && e.clientY <= mapRect.bottom;

          if (droppedOnMap && isMyTurn && hasAP) {
            onPlay(prev.cardId);
            return null;
          }

          // Not on map — animate card back to hand
          const cardEl = cardRefs.current.get(prev.cardId);
          const card = cards.find((c) => c.id === prev.cardId);
          if (cardEl && card) {
            const rect = cardEl.getBoundingClientRect();
            setReturning({
              cardId: prev.cardId,
              card,
              x: e.clientX - prev.offsetX,
              y: e.clientY - prev.offsetY,
              targetX: rect.left,
              targetY: rect.top,
              active: false,
            });
          }
        }

        return null;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [drag, isMyTurn, hasAP, activeCardStep, cards, mapInnerRef, onPlay, battleDropRef, onBattleCardPlay, battleCardZoneRef]);

  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
    const card = cards.find((c) => c.id === cardId);
    if (!card || isCardDisabled(card)) return;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDrag({
      cardId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      x: e.clientX,
      y: e.clientY,
      startX: e.clientX,
      startY: e.clientY,
    });
    e.preventDefault();
  };

  const handlePlay = (cardId: string) => {
    onPlay(cardId);
    setSelectedCardId(null);
  };

  const handleDiscard = (cardId: string) => {
    onDiscard(cardId);
    setSelectedCardId(null);
  };

  return (
    <>
      <div className="card-hand" ref={handRef}>
        {cards.map((card) => {
          const isBeingDragged = drag?.cardId === card.id && isDragging;
          const isReturning = returning?.cardId === card.id;
          const isFlying = flying?.cardId === card.id;
          return (
            <div key={card.id} className="card-wrapper">
              <div
                ref={(el) => {
                  if (el) cardRefs.current.set(card.id, el);
                  else cardRefs.current.delete(card.id);
                }}
                className={`card card-type-${card.type}${isCardDisabled(card) ? ' card-disabled' : ''}${selectedCardId === card.id ? ' card-selected' : ''}${isBeingDragged || isReturning || isFlying ? ' card-dragging-source' : ''}`}
                onMouseDown={(e) => handleMouseDown(e, card.id)}
              >
                <div className="card-type-band" />
                <div className="card-name">{card.name}</div>
                <div className="card-description">{card.description}</div>
              </div>
              {selectedCardId === card.id && !isDragging && (
                <div className="card-actions">
                  <button className="card-btn card-btn-play" onClick={() => handlePlay(card.id)}>
                    Play
                  </button>
                  <button className="card-btn card-btn-discard" onClick={() => handleDiscard(card.id)}>
                    Discard
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Floating drag ghost */}
      {isDragging && drag && (() => {
        const card = cards.find((c) => c.id === drag.cardId);
        if (!card) return null;
        return (
          <div
            className={`card card-type-${card.type} card-ghost${battleDropRef ? (isOverBattle ? ' card-ghost--over-battle' : ' card-ghost--battle-invalid') : isOverMap ? (hasAP ? ' card-ghost--over-map' : ' card-ghost--over-map-blocked') : ''}`}
            style={{
              position: 'fixed',
              left: drag.x - drag.offsetX,
              top: drag.y - drag.offsetY,
              pointerEvents: 'none',
              zIndex: 1000,
            }}
          >
            <div className="card-type-band" />
            <div className="card-name">{card.name}</div>
            <div className="card-description">{card.description}</div>
          </div>
        );
      })()}

      {/* Returning ghost */}
      {returning && (
        <div
          className={`card card-type-${returning.card.type} card-ghost card-returning`}
          style={{
            position: 'fixed',
            left: returning.active ? returning.targetX : returning.x,
            top: returning.active ? returning.targetY : returning.y,
            pointerEvents: 'none',
            zIndex: 1000,
            transition: returning.active ? 'left 0.25s ease, top 0.25s ease, transform 0.25s ease, opacity 0.25s ease' : 'none',
            transform: returning.active ? 'rotate(0deg)' : 'rotate(3deg)',
            opacity: returning.active ? 0.3 : 0.9,
          }}
        >
          <div className="card-type-band" />
          <div className="card-name">{returning.card.name}</div>
          <div className="card-description">{returning.card.description}</div>
        </div>
      )}

      {/* Flying-to-zone ghost */}
      {flying && (
        <div
          className={`card card-type-${flying.card.type} card-ghost`}
          style={{
            position: 'fixed',
            left: flying.active ? flying.targetX : flying.x,
            top: flying.active ? flying.targetY : flying.y,
            pointerEvents: 'none',
            zIndex: 1100,
            transformOrigin: 'top center',
            transition: flying.active
              ? 'left 0.35s ease, top 0.35s ease, transform 0.35s ease'
              : 'none',
            transform: flying.active ? 'scale(0.72) rotate(0deg)' : 'rotate(3deg)',
          }}
        >
          <div className="card-type-band" />
          <div className="card-name">{flying.card.name}</div>
          <div className="card-description">{flying.card.description}</div>
        </div>
      )}
    </>
  );
}
