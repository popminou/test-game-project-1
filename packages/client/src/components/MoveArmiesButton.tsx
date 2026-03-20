interface MoveArmiesButtonProps {
  moveMode: boolean;
  hasAP: boolean;
  onToggleMoveMode: () => void;
}

export function MoveArmiesButton({ moveMode, hasAP, onToggleMoveMode }: MoveArmiesButtonProps) {
  return (
    <button
      className={`btn-move-armies${moveMode ? ' active' : ''}`}
      onClick={onToggleMoveMode}
      disabled={!moveMode && !hasAP}
    >
      {moveMode ? 'Cancel Move' : 'Move Armies'}
    </button>
  );
}
