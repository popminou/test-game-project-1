import type { Card } from '@test-project/iso';

interface DiscardPileProps {
  discardedCards: Card[];
}

export function DiscardPile({ discardedCards }: DiscardPileProps) {
  const topCard = discardedCards[discardedCards.length - 1] ?? null;

  return (
    <div className="discard-pile">
      <span className="pile-label">Discard</span>
      {topCard ? (
        <div className={`card card-type-${topCard.type} discard-top-card`}>
          <div className="card-type-band" />
          <div className="card-name">{topCard.name}</div>
          <div className="card-description">{topCard.description}</div>
        </div>
      ) : (
        <div className="discard-pile-empty">—</div>
      )}
      <span className="pile-count">×{discardedCards.length}</span>
    </div>
  );
}
