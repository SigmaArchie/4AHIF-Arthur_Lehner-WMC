require('dotenv').config();

const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const initDatabase = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5000'
  }
});

let db;

(async () => {
  db = await initDatabase();
})();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

app.get('/', (req, res) => {
  res.send('Backend is running');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Username and password required'
    });
  }

  try {
    await db.run(
      'INSERT INTO users (username, password) VALUES (?, ?)',
      [username, password]
    );

    res.json({
      message: 'User created'
    });
  } catch (error) {
    res.status(500).json({
      error: 'User already exists'
    });
  }
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});