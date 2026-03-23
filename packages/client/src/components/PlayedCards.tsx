import type { ActiveCard } from '@test-project/iso';

interface PlayedCardsProps {
  cards: ActiveCard[];
}

export function PlayedCards({ cards }: PlayedCardsProps) {
  if (cards.length === 0) return null;

  const OFFSET = 35;
  const stackHeight = 150 + (cards.length - 1) * OFFSET;

  return (
    <div className="played-cards" style={{ height: stackHeight }}>
      {cards.map(({ card, turnsRemaining }, index) => (
        <div
          key={card.id}
          className={`card card-type-${card.type} played-card`}
          style={{ top: index * OFFSET, zIndex: index }}
        >
          <div className="card-type-band" />
          <div className="card-name">{card.name}</div>
          <div className="card-description">{card.description}</div>
          {card.duration.type === 'turns' && turnsRemaining !== undefined && (
            <div className="card-duration">{turnsRemaining} turn{turnsRemaining !== 1 ? 's' : ''} left</div>
          )}
          {card.duration.type === 'permanent' && (
            <div className="card-duration">Permanent</div>
          )}
          {card.duration.type === 'turn-step' && (
            <div className="card-duration">Until end of {card.duration.step}</div>
          )}
        </div>
      ))}
    </div>
  );
}
