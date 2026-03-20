import type { Player } from '@test-project/iso';

interface ActionPointsBarProps {
  player: Player;
  isMyTurn: boolean;
}

export function ActionPointsBar({ player, isMyTurn }: ActionPointsBarProps) {
  return (
    <div className="ap-bar">
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
