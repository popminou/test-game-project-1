import type { Player } from '@test-project/iso';
import { ActionPointsDisplay } from './ActionPointsDisplay';
import { MoveArmiesButton } from './MoveArmiesButton';

interface PlayerBarProps {
  player: Player;
  isMyTurn: boolean;
  moveMode: boolean;
  hasAP: boolean;
  onToggleMoveMode: () => void;
}

export function PlayerBar({ player, isMyTurn, moveMode, hasAP, onToggleMoveMode }: PlayerBarProps) {
  return (
    <div className="ap-bar">
      <ActionPointsDisplay player={player} isMyTurn={isMyTurn} />
      {isMyTurn && (
        <MoveArmiesButton moveMode={moveMode} hasAP={hasAP} onToggleMoveMode={onToggleMoveMode} />
      )}
    </div>
  );
}
