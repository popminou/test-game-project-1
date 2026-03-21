import type { Card } from '@test-project/iso';

interface PlayedCardsProps {
  cards: Card[];
}

export function PlayedCards({ cards }: PlayedCardsProps) {
  if (cards.length === 0) return null;

  const OFFSET = 35;
  const stackHeight = 150 + (cards.length - 1) * OFFSET;

  return (
    <div className="played-cards" style={{ height: stackHeight }}>
      {cards.map((card, index) => (
        <div
          key={card.id}
          className={`card card-type-${card.type} played-card`}
          style={{ top: index * OFFSET, zIndex: index }}
        >
          <div className="card-type-band" />
          <div className="card-name">{card.name}</div>
          <div className="card-description">{card.description}</div>
        </div>
      ))}
    </div>
  );
}
