import type { GameState, TurnStep } from '@test-project/iso';
import { PLAYER_COLOR_VALUES } from '@test-project/iso';

interface PlayerPanelProps {
  gameState: GameState;
  myPlayerId: string;
  onEndTurn: () => void;
  onStepAdvance: () => void;
  onLeave: () => void;
}

const STEP_LABELS: Record<TurnStep, string> = {
  preparation: 'Preparation',
  action: 'Action',
  upkeep: 'Upkeep',
};

const STEP_ADVANCE_LABELS: Record<TurnStep, string> = {
  preparation: 'Start Action Step',
  action: 'End Action Step',
  upkeep: 'End Turn',
};

const TURN_STEPS: TurnStep[] = ['preparation', 'action', 'upkeep'];

export function PlayerPanel({ gameState, myPlayerId, onEndTurn: _onEndTurn, onStepAdvance, onLeave }: PlayerPanelProps) {
  const currentPlayer = gameState.players[gameState.currentPlayerIndex];
  const isMyTurn = currentPlayer?.id === myPlayerId;

  return (
    <div className="player-panel">
      {/* Header */}
      <div className="panel-header">
        <span className="panel-title">War of Realms</span>
        <div className="turn-badge">
          <span className="turn-label">Turn</span>
          <span className="turn-number">{gameState.turnNumber}</span>
        </div>
      </div>

      {/* Current turn indicator */}
      <div className="current-turn-section">
        {currentPlayer && (
          <div
            className="current-turn-box"
            style={{ borderColor: PLAYER_COLOR_VALUES[currentPlayer.color] }}
          >
            <div
              className="ct-color-dot"
              style={{ backgroundColor: PLAYER_COLOR_VALUES[currentPlayer.color] }}
            />
            <div className="ct-info">
              <span className="ct-label">Current Turn</span>
              <span className="ct-name">{currentPlayer.name}</span>
            </div>
            {isMyTurn && <span className="your-turn-tag">YOU</span>}
          </div>
        )}
      </div>

      {/* Player list */}
      <div className="players-section">
        <h3>Players</h3>
        <div className="players-rows">
          {gameState.players.map((player, index) => {
            const isActive = index === gameState.currentPlayerIndex;
            return (
              <div
                key={player.id}
                className={`player-row${isActive ? ' active-row' : ''}`}
              >
                <div
                  className="color-stripe"
                  style={{ backgroundColor: PLAYER_COLOR_VALUES[player.color] }}
                />
                <span className="row-name">
                  {player.name}
                  {player.id === myPlayerId && ' (You)'}
                </span>
                <span className="row-vp">{player.victoryPoints} VP</span>
                {isActive && <span className="row-arrow">▶</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Turn step indicator */}
      {gameState.phase === 'playing' && (
        <div className="turn-steps">
          {TURN_STEPS.map((step, i) => (
            <span key={step} className={`turn-step${gameState.turnStep === step ? ' turn-step--active' : ''}`}>
              {i > 0 && <span className="turn-step-sep">›</span>}
              {STEP_LABELS[step]}
            </span>
          ))}
        </div>
      )}

      {/* End turn / waiting */}
      <div className="end-turn-section">
        {isMyTurn ? (
          <button className="btn-end-turn" onClick={onStepAdvance}>
            {STEP_ADVANCE_LABELS[gameState.turnStep]}
          </button>
        ) : (
          <p className="waiting-for-turn">
            Waiting for
            <br />
            <strong>{currentPlayer?.name}</strong>…
          </p>
        )}
      </div>

      {/* Leave game */}
      <div className="leave-section">
        <button className="btn-leave" onClick={onLeave}>
          Leave Game
        </button>
      </div>
    </div>
  );
}
