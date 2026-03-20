import { useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import type { Socket } from 'socket.io-client';
import type { GameState, ServerToClientEvents, ClientToServerEvents } from '@test-project/iso';
import { Lobby } from './components/Lobby';
import { GameBoard } from './components/GameBoard';
import './game.css';

type ClientSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function App() {
  const [socket, setSocket] = useState<ClientSocket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const s: ClientSocket = io();
    s.on('game:state', setGameState);
    s.on('game:error', (msg) => {
      setError(msg);
      setTimeout(() => setError(null), 4000);
    });
    setSocket(s);
    return () => {
      s.disconnect();
    };
  }, []);

  const handleJoin = (name: string) => {
    if (!socket) return;
    socket.emit('player:join', name, (res) => {
      if (res.success && res.playerId) {
        setMyPlayerId(res.playerId);
        setError(null);
      } else {
        setError(res.error ?? 'Failed to join');
      }
    });
  };

  const handleStart = () => socket?.emit('game:start');
  const handleEndTurn = () => socket?.emit('turn:end');

  if (!gameState) {
    return <div className="loading">Connecting to server…</div>;
  }

  const hasJoined = myPlayerId !== null && gameState.players.some((p) => p.id === myPlayerId);

  if (gameState.phase === 'lobby' || !hasJoined) {
    return (
      <Lobby
        gameState={gameState}
        myPlayerId={myPlayerId}
        error={error}
        onJoin={handleJoin}
        onStart={handleStart}
      />
    );
  }

  // myPlayerId is non-null here because hasJoined requires it
  return (
    <GameBoard gameState={gameState} myPlayerId={myPlayerId!} onEndTurn={handleEndTurn} />
  );
}
