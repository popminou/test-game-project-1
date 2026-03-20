import type { Player } from '@test-project/iso';

interface ActionPointsDisplayProps {
  player: Player;
  isMyTurn: boolean;
}

export function ActionPointsDisplay({ player, isMyTurn }: ActionPointsDisplayProps) {
  return (
    <div className="ap-left">
      <span className="ap-label">
        {isMyTurn ? 'Your' : `${player.name}'s`} actions
      </span>
      <div className="ap-dots">
        {Array.from({ length: player.maxActionPoints }, (_, i) => (
          <div
            key={i}
            className={`ap-dot${i < player.currentActionPoints ? ' ap-dot--filled' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}
