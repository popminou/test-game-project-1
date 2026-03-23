interface DeckPileProps {
  deckSize: number;
  canDraw: boolean;
  onDraw: () => void;
}

export function DeckPile({ deckSize, canDraw, onDraw }: DeckPileProps) {
  return (
    <div className={`deck-pile${canDraw ? ' can-draw' : ''}`}>
      <span className="pile-label">Deck</span>
      <div className="card-back" onClick={canDraw ? onDraw : undefined}>
        DECK
      </div>
      <span className="pile-count">×{deckSize}</span>
    </div>
  );
}
