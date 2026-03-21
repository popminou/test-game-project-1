import { useState, useEffect, useRef } from 'react';
import type { Card } from '@test-project/iso';

interface CardHandProps {
  cards: Card[];
  isMyTurn: boolean;
  mapInnerRef: React.RefObject<HTMLDivElement | null>;
  onPlay: (cardId: string) => void;
  onDiscard: (cardId: string) => void;
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

const DRAG_THRESHOLD = 5;

export function CardHand({ cards, isMyTurn, mapInnerRef, onPlay, onDiscard }: CardHandProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [drag, setDrag] = useState<DragState | null>(null);
  const [returning, setReturning] = useState<ReturnState | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const isDragging = drag !== null &&
    (Math.abs(drag.x - drag.startX) > DRAG_THRESHOLD || Math.abs(drag.y - drag.startY) > DRAG_THRESHOLD);

  const isOverMap = isDragging && drag && (() => {
    const rect = mapInnerRef.current?.getBoundingClientRect();
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

        if (!moved && isMyTurn) {
          setSelectedCardId((sel) => (sel === prev.cardId ? null : prev.cardId));
          return null;
        }

        if (moved) {
          // Check if dropped on the map
          const mapRect = mapInnerRef.current?.getBoundingClientRect();
          const droppedOnMap = mapRect &&
            e.clientX >= mapRect.left && e.clientX <= mapRect.right &&
            e.clientY >= mapRect.top && e.clientY <= mapRect.bottom;

          if (droppedOnMap && isMyTurn) {
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
  }, [drag, isMyTurn, cards, mapInnerRef, onPlay]);

  const handleMouseDown = (e: React.MouseEvent, cardId: string) => {
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
      <div className="card-hand">
        {cards.map((card) => {
          const isBeingDragged = drag?.cardId === card.id && isDragging;
          const isReturning = returning?.cardId === card.id;
          return (
            <div key={card.id} className="card-wrapper">
              <div
                ref={(el) => {
                  if (el) cardRefs.current.set(card.id, el);
                  else cardRefs.current.delete(card.id);
                }}
                className={`card card-type-${card.type}${!isMyTurn ? ' card-disabled' : ''}${selectedCardId === card.id ? ' card-selected' : ''}${isBeingDragged || isReturning ? ' card-dragging-source' : ''}`}
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
            className={`card card-type-${card.type} card-ghost${isOverMap ? ' card-ghost--over-map' : ''}`}
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
    </>
  );
}
