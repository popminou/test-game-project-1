import { useState } from 'react';
import type { GameState } from '@test-project/iso';
import { PLAYER_COLOR_VALUES } from '@test-project/iso';

interface LobbyProps {
  gameState: GameState;
  myPlayerId: string | null;
  error: string | null;
  onJoin: (name: string) => void;
  onStart: () => void;
}

export function Lobby({ gameState, myPlayerId, error, onJoin, onStart }: LobbyProps) {
  const [name, setName] = useState('');

  const hasJoined = myPlayerId !== null && gameState.players.some((p) => p.id === myPlayerId);
  const isHost = gameState.players.length > 0 && gameState.players[0].id === myPlayerId;
  const canStart = isHost && gameState.players.length >= 1;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed) onJoin(trimmed);
  };

  return (
    <div className="lobby">
      <div className="lobby-card">
        <h1>War of Realms</h1>
        <p className="lobby-subtitle">A strategy game of territory and conquest</p>

        {!hasJoined ? (
          <form className="join-form" onSubmit={handleSubmit}>
            <input
              type="text"
              className="name-input"
              placeholder="Enter your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              autoFocus
            />
            <button type="submit" className="btn-join" disabled={!name.trim()}>
              Join Game
            </button>
          </form>
        ) : (
          <p className="joined-waiting">You&apos;ve joined! Start the game or wait for more players.</p>
        )}

        {error && <p className="error-message">{error}</p>}

        <div className="player-list-section">
          <h3>Players ({gameState.players.length} / 4)</h3>
          {gameState.players.length === 0 ? (
            <p className="no-players-hint">No players yet — be the first to join!</p>
          ) : (
            <div className="player-list">
              {gameState.players.map((player, i) => (
                <div key={player.id} className="player-list-item">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: PLAYER_COLOR_VALUES[player.color] }}
                  />
                  <span className="player-list-name">{player.name}</span>
                  {i === 0 && <span className="badge badge-host">Host</span>}
                  {player.id === myPlayerId && <span className="badge badge-you">You</span>}
                </div>
              ))}
            </div>
          )}
        </div>

        {hasJoined && (
          <div className="lobby-actions">
            {isHost ? (
              <button
                className="btn-start"
                onClick={onStart}
                disabled={!canStart}
              >
                Start Game
              </button>
            ) : (
              <p className="waiting-for-host">Waiting for the host to start the game…</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
