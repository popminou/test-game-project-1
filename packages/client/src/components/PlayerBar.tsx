import type { Player } from '@test-project/iso';
import { ActionPointsDisplay } from './ActionPointsDisplay';
import { MoveArmiesButton } from './MoveArmiesButton';
import { StartBattleButton } from './StartBattleButton';
import type { ActionMode } from './GameBoard';

interface PlayerBarProps {
  player: Player;
  isMyTurn: boolean;
  actionMode: ActionMode;
  hasAP: boolean;
  onToggleActionMode: (mode: NonNullable<ActionMode>) => void;
}

export function PlayerBar({ player, isMyTurn, actionMode, hasAP, onToggleActionMode }: PlayerBarProps) {
  return (
    <div className="ap-bar">
      <ActionPointsDisplay player={player} isMyTurn={isMyTurn} />
      <MoveArmiesButton
        moveMode={actionMode === 'move'}
        hasAP={isMyTurn && hasAP}
        onToggleMoveMode={() => onToggleActionMode('move')}
      />
      <StartBattleButton
        battleMode={actionMode === 'battle'}
        hasAP={isMyTurn && hasAP}
        onToggleBattleMode={() => onToggleActionMode('battle')}
      />
    </div>
  );
}
