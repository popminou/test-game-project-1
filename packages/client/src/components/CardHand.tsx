import { useState } from 'react';
import type { Card } from '@test-project/iso';

interface CardHandProps {
  cards: Card[];
  isMyTurn: boolean;
  onPlay: (cardId: string) => void;
  onDiscard: (cardId: string) => void;
}

export function CardHand({ cards, isMyTurn, onPlay, onDiscard }: CardHandProps) {
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  const handleCardClick = (cardId: string) => {
    if (!isMyTurn) return;
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  };

  const handlePlay = (cardId: string) => {
    onPlay(cardId);
    setSelectedCardId(null);
  };

  const handleDiscard = (cardId: string) => {
    onDiscard(cardId);
    setSelectedCardId(null);
  };

  if (cards.length === 0) return null;

  return (
    <div className="card-hand">
      {cards.map((card) => (
        <div key={card.id} className="card-wrapper">
          <div
            className={`card card-type-${card.type}${!isMyTurn ? ' card-disabled' : ''}${selectedCardId === card.id ? ' card-selected' : ''}`}
            onClick={() => handleCardClick(card.id)}
          >
            <div className="card-type-band" />
            <div className="card-name">{card.name}</div>
            <div className="card-description">{card.description}</div>
          </div>
          {selectedCardId === card.id && (
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
      ))}
    </div>
  );
}
