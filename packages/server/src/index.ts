import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import {
  API_ROUTES,
  type ApiResponse,
  type HealthStatus,
  type GameState,
  type Player,
  type TerritoryState,
  type ServerToClientEvents,
  type ClientToServerEvents,
  PLAYER_COLOR_ORDER,
  TERRITORY_DEFS,
  generateTerritoryConnections,
} from '@test-project/iso';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

app.get(API_ROUTES.health, (_req, res) => {
  const response: ApiResponse<HealthStatus> = {
    success: true,
    data: { status: 'ok', timestamp: new Date().toISOString() },
  };
  res.json(response);
});

// ---- Game State ----

function createInitialState(): GameState {
  return {
    phase: 'lobby',
    players: [],
    territories: TERRITORY_DEFS.map((t): TerritoryState => ({ id: t.id, ownerId: null })),
    territoryConnections: [],
    currentPlayerIndex: 0,
    turnNumber: 0,
  };
}

let gameState: GameState = createInitialState();

// ---- Socket Handlers ----

io.on('connection', (socket) => {
  console.log(`[connect] ${socket.id}`);

  // Send current state to the newly connected client immediately
  socket.emit('game:state', gameState);

  socket.on('player:join', (name, callback) => {
    if (gameState.phase !== 'lobby') {
      callback({ success: false, error: 'Game is already in progress' });
      return;
    }
    if (gameState.players.length >= 4) {
      callback({ success: false, error: 'Game is full (max 4 players)' });
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      callback({ success: false, error: 'Name cannot be empty' });
      return;
    }

    const player: Player = {
      id: socket.id,
      name: trimmed,
      color: PLAYER_COLOR_ORDER[gameState.players.length],
      victoryPoints: 0,
    };
    gameState.players.push(player);
    callback({ success: true, playerId: socket.id });
    io.emit('game:state', gameState);
    console.log(`[join] ${trimmed} (${socket.id}) — ${gameState.players.length} players`);
  });

  socket.on('game:start', () => {
    if (gameState.phase !== 'lobby') {
      socket.emit('game:error', 'Game is not in lobby phase');
      return;
    }
    if (gameState.players.length === 0 || gameState.players[0].id !== socket.id) {
      socket.emit('game:error', 'Only the host can start the game');
      return;
    }
    gameState.phase = 'playing';
    gameState.turnNumber = 1;
    gameState.currentPlayerIndex = 0;
    gameState.territoryConnections = generateTerritoryConnections();
    console.log('[connections]', JSON.stringify(gameState.territoryConnections, null, 2));
    io.emit('game:state', gameState);
    console.log(`[start] Game started with ${gameState.players.length} players`);
  });

  socket.on('turn:end', () => {
    if (gameState.phase !== 'playing') return;
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current || current.id !== socket.id) {
      socket.emit('game:error', 'It is not your turn');
      return;
    }
    gameState.currentPlayerIndex =
      (gameState.currentPlayerIndex + 1) % gameState.players.length;
    if (gameState.currentPlayerIndex === 0) gameState.turnNumber++;
    io.emit('game:state', gameState);
    console.log(
      `[turn] Now: ${gameState.players[gameState.currentPlayerIndex].name} (turn ${gameState.turnNumber})`,
    );
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const wasPlayer = gameState.players.some((p) => p.id === socket.id);
    if (!wasPlayer) return;

    gameState.players = gameState.players.filter((p) => p.id !== socket.id);

    if (gameState.players.length === 0) {
      gameState = createInitialState();
    } else {
      // Reassign colors to keep them contiguous
      gameState.players = gameState.players.map((p, i) => ({
        ...p,
        color: PLAYER_COLOR_ORDER[i],
      }));
      if (gameState.currentPlayerIndex >= gameState.players.length) {
        gameState.currentPlayerIndex = 0;
      }
    }
    io.emit('game:state', gameState);
  });
});

const PORT = process.env.PORT ?? 3001;
httpServer.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
