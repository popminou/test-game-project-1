import type { Player } from '@test-project/iso';
import { ActionPointsDisplay } from './ActionPointsDisplay';
import { MoveArmiesButton } from './MoveArmiesButton';
import { StartBattleButton } from './StartBattleButton';

interface PlayerBarProps {
  player: Player;
  isMyTurn: boolean;
  moveMode: boolean;
  battleMode: boolean;
  hasAP: boolean;
  onToggleMoveMode: () => void;
  onToggleBattleMode: () => void;
}

export function PlayerBar({ player, isMyTurn, moveMode, battleMode, hasAP, onToggleMoveMode, onToggleBattleMode }: PlayerBarProps) {
  return (
    <div className="ap-bar">
      <ActionPointsDisplay player={player} isMyTurn={isMyTurn} />
      {isMyTurn && (
        <>
          <MoveArmiesButton moveMode={moveMode} hasAP={hasAP} onToggleMoveMode={onToggleMoveMode} />
          <StartBattleButton battleMode={battleMode} hasAP={hasAP} onToggleBattleMode={onToggleBattleMode} />
        </>
      )}
    </div>
  );
}
