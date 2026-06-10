require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');

const initDatabase = require('./db');
const { createGame, applyPlayCard, applyDrawCard, getStateForPlayer } = require('./game');

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5000' }
});

app.use(cors({ origin: 'http://localhost:5000' }));
app.use(express.json());

let db;

// in-memory game states: roomId -> gameState
const games = {};
// in-memory player tracking: roomId -> Set of usernames
const roomPlayers = {};

(async () => {
  db = await initDatabase();
  await db.run("DELETE FROM rooms WHERE status = 'running'");

  app.get('/', (req, res) => res.send('Backend is running'));
  app.use('/', require('./routes/auth')(db));
  app.use('/', require('./routes/rooms')(db, io));
  app.use('/', require('./routes/stats')(db));
})();

// ── helpers ────────────────────────────────────────────────────────────────

async function emitRoomsUpdate() {
  const rooms = await db.all("SELECT * FROM rooms WHERE status = 'waiting'");
  const roomsWithCounts = await Promise.all(
    rooms.map(async (room) => {
      const sockets = await io.in(`room-${room.id}`).fetchSockets();
      return { ...room, player_count: sockets.length };
    })
  );
  io.emit('rooms-updated', roomsWithCounts);
}

async function saveGameResult(game) {
  if (game.saved || !game.winner) return;
  game.saved = true;
  const original = game.originalPlayers || game.players;
  await db.run(
    'INSERT INTO game_results (winner, players, player_count) VALUES (?, ?, ?)',
    [game.winner, original.join(','), original.length]
  );
}

async function broadcastGameState(roomId) {
  const game = games[roomId];
  if (!game) return;
  const socketsInRoom = await io.in(`room-${roomId}`).fetchSockets();
  for (const s of socketsInRoom) {
    if (s.data.username) {
      s.emit('game-state', getStateForPlayer(game, s.data.username));
    }
  }
}

// ── socket events ──────────────────────────────────────────────────────────

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', async ({ roomId, username }) => {
    const prevRoomId = socket.data.roomId;
    if (prevRoomId === roomId) return;

    if (prevRoomId) {
      socket.leave(`room-${prevRoomId}`);
      if (roomPlayers[prevRoomId]) roomPlayers[prevRoomId].delete(username);
    }

    socket.join(`room-${roomId}`);
    socket.data.username = username;
    socket.data.roomId = roomId;

    if (!roomPlayers[roomId]) roomPlayers[roomId] = new Set();
    roomPlayers[roomId].add(username);

    await emitRoomsUpdate();
  });

  socket.on('rejoin-room', ({ roomId, username }) => {
    socket.join(`room-${roomId}`);
    socket.data.username = username;
    socket.data.roomId = roomId;

    if (!roomPlayers[roomId]) roomPlayers[roomId] = new Set();
    roomPlayers[roomId].add(username);

    if (games[roomId]) {
      socket.emit('game-state', getStateForPlayer(games[roomId], username));
    } else {
      socket.emit('no-active-game');
    }
  });

  socket.on('start-game', async ({ roomId }) => {
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!room) return socket.emit('error', 'Raum nicht gefunden.');
    if (room.owner && socket.data.username !== room.owner)
      return socket.emit('error', 'Nur der Raum-Ersteller kann das Spiel starten.');

    const socketsInRoom = await io.in(`room-${roomId}`).fetchSockets();
    const players = socketsInRoom.map(s => s.data.username).filter(Boolean);

    if (players.length < 2)
      return socket.emit('error', 'Es werden mindestens 2 Spieler benötigt.');

    games[roomId] = createGame(players);
    games[roomId].originalPlayers = [...players];
    await db.run("UPDATE rooms SET status = 'running' WHERE id = ?", [roomId]);
    await emitRoomsUpdate();

    for (const s of socketsInRoom) {
      s.emit('game-started', { roomId });
      if (s.data.username) {
        s.emit('game-state', getStateForPlayer(games[roomId], s.data.username));
      }
    }
  });

  socket.on('get-game-state', ({ roomId }) => {
    const game = games[roomId];
    if (game && socket.data.username) {
      socket.emit('game-state', getStateForPlayer(game, socket.data.username));
    }
  });

  socket.on('play-card', async ({ roomId, cardIndex, chosenColor }) => {
    const game = games[roomId];
    if (!game) return;
    const result = applyPlayCard(game, socket.data.username, cardIndex, chosenColor);
    if (!result.ok) return socket.emit('error', result.error);
    await broadcastGameState(roomId);
    if (game.status === 'finished') await saveGameResult(game);
  });

  socket.on('draw-card', ({ roomId }) => {
    const game = games[roomId];
    if (!game) return;
    const result = applyDrawCard(game, socket.data.username);
    if (!result.ok) return socket.emit('error', result.error);
    broadcastGameState(roomId);
  });

  socket.on('leave-game', async ({ roomId, username }) => {
    const game = games[roomId];
    if (game) {
      const wasCurrentPlayer = game.players[game.currentPlayerIndex] === username;

      game.players = game.players.filter(p => p !== username);
      delete game.hands[username];

      if (game.players.length <= 1) {
        game.status = 'finished';
        game.winner = game.players[0] ?? null;
        await saveGameResult(game);
        await broadcastGameState(roomId);
        await db.run("DELETE FROM rooms WHERE id = ?", [roomId]);
        delete games[roomId];
        await emitRoomsUpdate();
      } else {
        if (wasCurrentPlayer || game.currentPlayerIndex >= game.players.length) {
          game.currentPlayerIndex = game.currentPlayerIndex % game.players.length;
        }
        await broadcastGameState(roomId);
      }
    }
    socket.leave(`room-${roomId}`);
    socket.data.roomId = null;
  });

  socket.on('chat-message', ({ roomId, username, text }) => {
    if (!text || text.trim().length === 0 || text.length > 200) return;
    io.to(`room-${roomId}`).emit('chat-message', {
      username, text: text.trim(), time: Date.now()
    });
  });

  socket.on('disconnect', async () => {
    const { username, roomId } = socket.data;
    console.log('Client disconnected:', socket.id);

    if (roomId && roomPlayers[roomId]) {
      roomPlayers[roomId].delete(username);
      // only update lobby if room is still waiting (no running game)
      if (!games[roomId]) {
        await emitRoomsUpdate();
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
