import type { ActiveCard, Player } from '@test-project/iso';
import { PLAYER_COLOR_VALUES } from '@test-project/iso';

interface ActiveCardsPanelProps {
  activeCards: ActiveCard[];
  players: Player[];
}

export function ActiveCardsPanel({ activeCards, players }: ActiveCardsPanelProps) {
  const groups = players
    .map((player) => ({
      player,
      cards: activeCards.filter((ac) => ac.playedByPlayerId === player.id),
    }))
    .filter((g) => g.cards.length > 0);

  if (groups.length === 0) return null;

  return (
    <div className="active-cards-panel">
      {groups.map(({ player, cards }) => (
        <div key={player.id} className="active-cards-group">
          <div className="active-cards-group-label">
            <span
              className="active-cards-group-dot"
              style={{ background: PLAYER_COLOR_VALUES[player.color] }}
            />
            {player.name}
          </div>
          <div className="active-cards-group-cards">
            {cards.map(({ card, turnsRemaining }) => (
              <div key={card.id} className={`card card-type-${card.type} active-panel-card`}>
                <div className="card-type-band" />
                <div className="card-name">{card.name}</div>
                <div className="card-description">{card.description}</div>
                {card.duration.type === 'turns' && turnsRemaining !== undefined && (
                  <div className="card-duration">
                    {turnsRemaining} turn{turnsRemaining !== 1 ? 's' : ''} left
                  </div>
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
        </div>
      ))}
    </div>
  );
}
