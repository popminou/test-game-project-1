import type { Player, TurnStep, ActionPhase } from '@test-project/iso';
import { ActionPointsDisplay } from './ActionPointsDisplay';
import { MoveArmiesButton } from './MoveArmiesButton';
import { StartBattleButton } from './StartBattleButton';
import type { ActionMode } from './GameBoard';

interface PlayerBarProps {
  player: Player;
  isMyTurn: boolean;
  turnStep: TurnStep;
  actionPhase: ActionPhase | null;
  preparationActionTaken: boolean;
  actionMode: ActionMode;
  hasAP: boolean;
  onToggleActionMode: (mode: NonNullable<ActionMode>) => void;
  onRecruit: () => void;
  onResupply: () => void;
}

export function PlayerBar({ player, isMyTurn, turnStep, actionPhase, preparationActionTaken, actionMode, hasAP, onToggleActionMode, onRecruit, onResupply }: PlayerBarProps) {
  const inPreparationStep = isMyTurn && turnStep === 'preparation';
  const inActionStep = isMyTurn && turnStep === 'action' && actionPhase === 'move';

  return (
    <div className="ap-bar">
      <ActionPointsDisplay player={player} isMyTurn={isMyTurn} />
      {inPreparationStep && (
        <>
          <button
            className="action-btn"
            disabled={preparationActionTaken}
            onClick={onRecruit}
          >
            Recruit
          </button>
          <button
            className="action-btn"
            disabled={preparationActionTaken}
            onClick={onResupply}
          >
            Re-supply
          </button>
        </>
      )}
      {inActionStep && (
        <>
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
        </>
      )}
    </div>
  );
}
