require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
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

(async () => {
  db = await initDatabase();
})();

// in-memory game states: roomId -> gameState
const games = {};

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [
      username,
      hashed
    ]);

    res.json({ message: 'User created' });
  } catch (error) {
    res.status(500).json({ error: 'User already exists' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password required' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);

    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ message: 'Login successful', username: user.username });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/rooms', async (req, res) => {
  try {
    const rooms = await db.all("SELECT * FROM rooms WHERE status = 'waiting'");
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/rooms', async (req, res) => {
  const { name, max_players } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Room name required' });
  }

  try {
    const result = await db.run(
      'INSERT INTO rooms (name, max_players) VALUES (?, ?)',
      [name, max_players || 4]
    );
    const room = await db.get('SELECT * FROM rooms WHERE id = ?', [result.lastID]);

    const rooms = await db.all("SELECT * FROM rooms WHERE status = 'waiting'");
    io.emit('rooms-updated', rooms);

    res.json(room);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('join-room', async ({ roomId, username }) => {
    socket.join(`room-${roomId}`);
    socket.data.username = username;
    socket.data.roomId = roomId;
    console.log(`${username} joined room ${roomId}`);

    const rooms = await db.all("SELECT * FROM rooms WHERE status = 'waiting'");
    io.emit('rooms-updated', rooms);
  });

  socket.on('start-game', async ({ roomId }) => {
    // collect all usernames in this socket.io room
    const socketsInRoom = await io.in(`room-${roomId}`).fetchSockets();
    const players = socketsInRoom.map(s => s.data.username).filter(Boolean);

    if (players.length < 2) {
      socket.emit('error', 'Need at least 2 players to start');
      return;
    }

    games[roomId] = createGame(players);

    await db.run("UPDATE rooms SET status = 'running' WHERE id = ?", [roomId]);
    const rooms = await db.all("SELECT * FROM rooms WHERE status = 'waiting'");
    io.emit('rooms-updated', rooms);

    // send each player their personal game view
    for (const s of socketsInRoom) {
      const username = s.data.username;
      s.emit('game-started', { roomId });
      s.emit('game-state', getStateForPlayer(games[roomId], username));
    }
  });

  socket.on('play-card', ({ roomId, cardIndex, chosenColor }) => {
    const username = socket.data.username;
    const game = games[roomId];
    if (!game) return;

    const result = applyPlayCard(game, username, cardIndex, chosenColor);
    if (!result.ok) {
      socket.emit('error', result.error);
      return;
    }

    broadcastGameState(roomId);
  });

  socket.on('draw-card', ({ roomId }) => {
    const username = socket.data.username;
    const game = games[roomId];
    if (!game) return;

    const result = applyDrawCard(game, username);
    if (!result.ok) {
      socket.emit('error', result.error);
      return;
    }

    broadcastGameState(roomId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

async function broadcastGameState(roomId) {
  const game = games[roomId];
  if (!game) return;

  const socketsInRoom = await io.in(`room-${roomId}`).fetchSockets();
  for (const s of socketsInRoom) {
    const username = s.data.username;
    if (username) {
      s.emit('game-state', getStateForPlayer(game, username));
    }
  }
}

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
