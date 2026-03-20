import type { GameState } from '@test-project/iso';
import { PLAYER_COLOR_VALUES } from '@test-project/iso';

interface PlayerPanelProps {
  gameState: GameState;
  myPlayerId: string;
  onEndTurn: () => void;
  onLeave: () => void;
}

export function PlayerPanel({ gameState, myPlayerId, onEndTurn, onLeave }: PlayerPanelProps) {
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

      {/* End turn / waiting */}
      <div className="end-turn-section">
        {isMyTurn ? (
          <button className="btn-end-turn" onClick={onEndTurn}>
            End Turn
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
