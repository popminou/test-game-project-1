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
  type Card,
  type TerritoryState,
  type ServerToClientEvents,
  type ClientToServerEvents,
  PLAYER_COLOR_ORDER,
  TERRITORY_DEFS,
  generateTerritoryConnections,
  areTerritoriesConnected,
  type BattleStartPayload,
  type BattleRetreatPayload,
  type BattleResolvePayload,
  type BattleRollPayload,
  type BattleCardPlayPayload,
} from '@test-project/iso';
import { CARD_DEFINITIONS } from './cards';

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

// ---- Card System ----

function createDeck(): Card[] {
  const deck: Card[] = [];
  let counter = 0;
  // 3 copies of each definition = 27 total
  for (let i = 0; i < 3; i++) {
    for (const def of CARD_DEFINITIONS) {
      deck.push({ id: `card-${++counter}`, ...def });
    }
  }
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// ---- Game State ----

function createInitialState(): GameState {
  return {
    phase: 'lobby',
    players: [],
    territories: TERRITORY_DEFS.map((t): TerritoryState => ({ id: t.id, ownerId: null })),
    territoryConnections: [],
    armies: [],
    currentPlayerIndex: 0,
    turnNumber: 0,
    deck: [],
    playedCards: [],
    activeBattle: null,
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
      maxActionPoints: 3,
      currentActionPoints: 3,
      hand: [],
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
    gameState.deck = createDeck();
    console.log('[connections]', JSON.stringify(gameState.territoryConnections, null, 2));

    // Deal 5 cards to each player
    for (const player of gameState.players) {
      player.hand = gameState.deck.splice(0, 5);
    }

    // Randomly place 0–3 armies per territory per player
    let armyCounter = 0;
    for (const territory of TERRITORY_DEFS) {
      for (const player of gameState.players) {
        const count = Math.floor(Math.random() * 4);
        for (let i = 0; i < count; i++) {
          gameState.armies.push({ id: `a${++armyCounter}`, playerId: player.id, territoryId: territory.id });
        }
      }
    }

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
    // Restore action points for the player whose turn is starting
    const next = gameState.players[gameState.currentPlayerIndex];
    next.currentActionPoints = next.maxActionPoints;
    io.emit('game:state', gameState);
    console.log(
      `[turn] Now: ${gameState.players[gameState.currentPlayerIndex].name} (turn ${gameState.turnNumber})`,
    );
  });

  socket.on('army:move', ({ armyIds, toTerritoryId }, callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current || current.id !== socket.id) {
      callback({ success: false, error: 'It is not your turn' });
      return;
    }
    if (current.currentActionPoints <= 0) {
      callback({ success: false, error: 'No action points remaining' });
      return;
    }
    // Validate all armies exist, belong to this player, and are on the same territory
    const armies = armyIds.map((id) => gameState.armies.find((a) => a.id === id));
    if (armies.some((a) => !a)) {
      callback({ success: false, error: 'One or more armies not found' });
      return;
    }
    const validArmies = armies as NonNullable<(typeof gameState.armies)[number]>[];
    if (validArmies.some((a) => a.playerId !== socket.id)) {
      callback({ success: false, error: 'You do not own all selected armies' });
      return;
    }
    const fromTerritoryId = validArmies[0].territoryId;
    if (validArmies.some((a) => a.territoryId !== fromTerritoryId)) {
      callback({ success: false, error: 'All armies must be on the same territory' });
      return;
    }
    if (!areTerritoriesConnected(gameState.territoryConnections, fromTerritoryId, toTerritoryId)) {
      callback({ success: false, error: 'Territories are not connected' });
      return;
    }
    for (const army of validArmies) {
      army.territoryId = toTerritoryId;
    }
    current.currentActionPoints--;
    io.emit('game:state', gameState);
    callback({ success: true });
    console.log(`[army:move] ${socket.id} moved ${armyIds.length} armies from ${fromTerritoryId} to ${toTerritoryId}`);
  });

  socket.on('card:play', ({ cardId }, callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current || current.id !== socket.id) {
      callback({ success: false, error: 'It is not your turn' });
      return;
    }
    if (current.currentActionPoints <= 0) {
      callback({ success: false, error: 'No action points remaining' });
      return;
    }
    const cardIndex = current.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      callback({ success: false, error: 'Card not in hand' });
      return;
    }
    const [card] = current.hand.splice(cardIndex, 1);
    current.currentActionPoints--;
    gameState.playedCards.push(card);
    io.emit('game:state', gameState);
    callback({ success: true });
    console.log(`[card:play] ${current.name} played ${card.name}`);
  });

  socket.on('card:discard', ({ cardId }, callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const player = gameState.players.find((p) => p.id === socket.id);
    if (!player) {
      callback({ success: false, error: 'Player not found' });
      return;
    }
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      callback({ success: false, error: 'Card not in hand' });
      return;
    }
    const [card] = player.hand.splice(cardIndex, 1);
    gameState.deck.push(card);
    io.emit('game:state', gameState);
    callback({ success: true });
    console.log(`[card:discard] ${player.name} discarded ${card.name}`);
  });

  socket.on('card:draw', (callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const player = gameState.players.find((p) => p.id === socket.id);
    if (!player) {
      callback({ success: false, error: 'Player not found' });
      return;
    }
    if (gameState.deck.length === 0) {
      callback({ success: false, error: 'Deck is empty' });
      return;
    }
    const card = gameState.deck.shift()!;
    player.hand.push(card);
    io.emit('game:state', gameState);
    callback({ success: true });
    console.log(`[card:draw] ${player.name} drew ${card.name}`);
  });

  socket.on('battle:retreat', ({ territoryId }: BattleRetreatPayload, callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const attackerArmies = gameState.armies.filter(
      (a) => a.playerId === socket.id && a.territoryId === territoryId,
    );
    if (attackerArmies.length === 0) {
      callback({ success: false, error: 'You have no armies in that territory' });
      return;
    }
    // Remove one attacker army from the territory
    const idx = gameState.armies.findIndex(
      (a) => a.playerId === socket.id && a.territoryId === territoryId,
    );
    gameState.armies.splice(idx, 1);
    gameState.activeBattle = null;
    io.emit('game:state', gameState);
    callback({ success: true });
    const player = gameState.players.find((p) => p.id === socket.id);
    console.log(`[battle:retreat] ${player?.name ?? socket.id} retreated from ${territoryId}, losing 1 army`);
  });

  socket.on('battle:resolve', ({ armyIds }: BattleResolvePayload, callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const idSet = new Set(armyIds);
    gameState.armies = gameState.armies.filter((a) => !idSet.has(a.id));
    if (gameState.activeBattle) {
      gameState.activeBattle.attackerDice = null;
      gameState.activeBattle.defenderDice = null;
    }
    io.emit('game:state', gameState);
    callback({ success: true });
    console.log(`[battle:resolve] removed armies: ${armyIds.join(', ')}`);
  });

  socket.on('battle:card:play', ({ cardId }: BattleCardPlayPayload, callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const battle = gameState.activeBattle;
    if (!battle || battle.phase !== 'card') {
      callback({ success: false, error: 'No active card phase' });
      return;
    }
    const isAttacker = battle.attackerPlayerId === socket.id;
    const isDefender = battle.defenderPlayerId === socket.id;
    if (!isAttacker && !isDefender) {
      callback({ success: false, error: 'You are not in this battle' });
      return;
    }
    const playerCards = isAttacker ? battle.attackerBattleCards : battle.defenderBattleCards;
    if (playerCards.length >= battle.maxBattleCards) {
      callback({ success: false, error: 'Already played maximum cards for this battle' });
      return;
    }
    const player = gameState.players.find((p) => p.id === socket.id);
    if (!player) {
      callback({ success: false, error: 'Player not found' });
      return;
    }
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      callback({ success: false, error: 'Card not in hand' });
      return;
    }
    const [card] = player.hand.splice(cardIndex, 1);
    playerCards.push(card);
    if (playerCards.length >= battle.maxBattleCards) {
      if (isAttacker) battle.attackerCardsDone = true;
      else battle.defenderCardsDone = true;
    }
    if (battle.attackerCardsDone && battle.defenderCardsDone) {
      battle.phase = 'battle';
    }
    io.emit('game:state', gameState);
    callback({ success: true });
    console.log(`[battle:card:play] ${player.name} played ${card.name} in battle`);
  });

  socket.on('battle:card:done', (callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const battle = gameState.activeBattle;
    if (!battle || battle.phase !== 'card') {
      callback({ success: false, error: 'No active card phase' });
      return;
    }
    const isAttacker = battle.attackerPlayerId === socket.id;
    const isDefender = battle.defenderPlayerId === socket.id;
    if (!isAttacker && !isDefender) {
      callback({ success: false, error: 'You are not in this battle' });
      return;
    }
    if (isAttacker) battle.attackerCardsDone = true;
    else battle.defenderCardsDone = true;
    if (battle.attackerCardsDone && battle.defenderCardsDone) {
      battle.phase = 'battle';
    }
    io.emit('game:state', gameState);
    callback({ success: true });
    const player = gameState.players.find((p) => p.id === socket.id);
    console.log(`[battle:card:done] ${player?.name ?? socket.id} done with card phase`);
  });

  socket.on('battle:roll', ({ attackerDice, defenderDice }: BattleRollPayload, callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    if (!gameState.activeBattle || gameState.activeBattle.attackerPlayerId !== socket.id) {
      callback({ success: false, error: 'No active battle for this player' });
      return;
    }
    if (gameState.activeBattle.phase !== 'battle') {
      callback({ success: false, error: 'Card phase not finished' });
      return;
    }
    gameState.activeBattle.attackerDice = attackerDice;
    gameState.activeBattle.defenderDice = defenderDice;
    io.emit('game:state', gameState);
    callback({ success: true });
  });

  socket.on('battle:end', (callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    if (!gameState.activeBattle || gameState.activeBattle.attackerPlayerId !== socket.id) {
      callback({ success: false, error: 'No active battle for this player' });
      return;
    }
    const player = gameState.players.find((p) => p.id === socket.id);
    console.log(`[battle:end] ${player?.name ?? socket.id} ended the battle`);
    gameState.activeBattle = null;
    io.emit('game:state', gameState);
    callback({ success: true });
  });

  socket.on('battle:start', ({ territoryId, defenderPlayerId }: BattleStartPayload, callback) => {
    if (gameState.phase !== 'playing') {
      callback({ success: false, error: 'Game is not in progress' });
      return;
    }
    const current = gameState.players[gameState.currentPlayerIndex];
    if (!current || current.id !== socket.id) {
      callback({ success: false, error: 'It is not your turn' });
      return;
    }
    if (current.currentActionPoints <= 0) {
      callback({ success: false, error: 'No action points remaining' });
      return;
    }
    const attackerArmies = gameState.armies.filter(
      (a) => a.playerId === socket.id && a.territoryId === territoryId,
    );
    if (attackerArmies.length === 0) {
      callback({ success: false, error: 'You have no armies in that territory' });
      return;
    }
    const defenderArmies = gameState.armies.filter(
      (a) => a.playerId === defenderPlayerId && a.territoryId === territoryId,
    );
    if (defenderArmies.length === 0) {
      callback({ success: false, error: 'Defender has no armies in that territory' });
      return;
    }
    current.currentActionPoints--;
    gameState.activeBattle = {
      attackerPlayerId: socket.id,
      defenderPlayerId,
      territoryId,
      phase: 'card',
      maxBattleCards: 1,
      attackerBattleCards: [],
      defenderBattleCards: [],
      attackerCardsDone: false,
      defenderCardsDone: false,
      attackerDice: null,
      defenderDice: null,
    };
    io.emit('game:state', gameState);
    callback({ success: true });
    console.log(`[battle:start] ${current.name} attacks ${defenderPlayerId} in ${territoryId}`);
  });

  socket.on('disconnect', () => {
    console.log(`[disconnect] ${socket.id}`);
    const wasPlayer = gameState.players.some((p) => p.id === socket.id);
    if (!wasPlayer) return;

    gameState.players = gameState.players.filter((p) => p.id !== socket.id);

    if (gameState.players.length === 0) {
      console.log('[end] Last player left — game instance reset');
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
