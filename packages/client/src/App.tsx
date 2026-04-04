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
  const handleStepAdvance = () => {
    socket?.emit('step:advance', (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to advance step');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleArmyMove = (armyIds: string[], toTerritoryId: string) => {
    socket?.emit('army:move', { armyIds, toTerritoryId }, (res) => {
      if (!res.success) {
        setError(res.error ?? 'Move failed');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleLeave = () => {
    socket?.disconnect();
    setMyPlayerId(null);
    socket?.connect();
  };
  const handleCardPlay = (cardId: string) => {
    socket?.emit('card:play', { cardId }, (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to play card');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleCardDiscard = (cardId: string) => {
    socket?.emit('card:discard', { cardId }, (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to discard card');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleBattleStart = (territoryId: string, defenderPlayerId: string) => {
    socket?.emit('battle:start', { territoryId, defenderPlayerId }, (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to start battle');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleBattleRetreat = (territoryId: string) => {
    socket?.emit('battle:retreat', { territoryId }, (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to retreat');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleBattleResolve = (armyIds: string[]) => {
    socket?.emit('battle:resolve', { armyIds }, (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to resolve battle');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleBattleRoll = (attackerDice: number[], defenderDice: number[]) => {
    socket?.emit('battle:roll', { attackerDice, defenderDice }, (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to sync dice roll');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleBattleEnd = () => {
    socket?.emit('battle:end', (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to end battle');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleBattleCardPlay = (cardId: string) => {
    socket?.emit('battle:card:play', { cardId }, (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to play card in battle');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleBattleCardDone = () => {
    socket?.emit('battle:card:done', (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to end card phase');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleCardDraw = () => {
    socket?.emit('card:draw', (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to draw card');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleRecruit = () => {
    socket?.emit('preparation:recruit', (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to recruit');
        setTimeout(() => setError(null), 4000);
      }
    });
  };
  const handleResupply = () => {
    socket?.emit('preparation:resupply', (res) => {
      if (!res.success) {
        setError(res.error ?? 'Failed to re-supply');
        setTimeout(() => setError(null), 4000);
      }
    });
  };

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
    <GameBoard gameState={gameState} myPlayerId={myPlayerId!} onEndTurn={handleEndTurn} onStepAdvance={handleStepAdvance} onLeave={handleLeave} onArmyMove={handleArmyMove} onCardPlay={handleCardPlay} onCardDiscard={handleCardDiscard} onBattleStart={handleBattleStart} onBattleRetreat={handleBattleRetreat} onBattleResolve={handleBattleResolve} onBattleRoll={handleBattleRoll} onBattleEnd={handleBattleEnd} onBattleCardPlay={handleBattleCardPlay} onBattleCardDone={handleBattleCardDone} onDrawCard={handleCardDraw} onRecruit={handleRecruit} onResupply={handleResupply} />
  );
}
