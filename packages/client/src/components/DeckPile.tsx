interface DeckPileProps {
  deckSize: number;
  canDraw: boolean;
  onDraw: () => void;
  cardBackRef?: React.RefObject<HTMLDivElement | null>;
}

export function DeckPile({ deckSize, canDraw, onDraw, cardBackRef }: DeckPileProps) {
  return (
    <div className={`deck-pile${canDraw ? ' can-draw' : ''}`}>
      <span className="pile-label">Deck</span>
      <div className="card-back" ref={cardBackRef} onClick={canDraw ? onDraw : undefined}>
        DECK
      </div>
      <span className="pile-count">×{deckSize}</span>
    </div>
  );
}
