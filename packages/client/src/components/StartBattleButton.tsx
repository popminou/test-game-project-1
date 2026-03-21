interface StartBattleButtonProps {
  battleMode: boolean;
  hasAP: boolean;
  onToggleBattleMode: () => void;
}

export function StartBattleButton({ battleMode, hasAP, onToggleBattleMode }: StartBattleButtonProps) {
  return (
    <button
      className={`btn-start-battle${battleMode ? ' active' : ''}`}
      onClick={onToggleBattleMode}
      disabled={!battleMode && !hasAP}
    >
      {battleMode ? 'Cancel Battle' : 'Start Battle'}
    </button>
  );
}
