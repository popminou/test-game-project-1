import type { Player } from '@test-project/iso';

interface ActionPointsBarProps {
  player: Player;
  isMyTurn: boolean;
  moveMode: boolean;
  hasAP: boolean;
  onToggleMoveMode: () => void;
}

export function ActionPointsBar({ player, isMyTurn, moveMode, hasAP, onToggleMoveMode }: ActionPointsBarProps) {
  return (
    <div className="ap-bar">
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

      {isMyTurn && (
        <button
          className={`btn-move-armies${moveMode ? ' active' : ''}`}
          onClick={onToggleMoveMode}
          disabled={!moveMode && !hasAP}
        >
          {moveMode ? 'Cancel Move' : 'Move Armies'}
        </button>
      )}
    </div>
  );
}
