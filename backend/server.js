require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');

const initDatabase = require('./db');

const app = express();

app.use(cors({ origin: 'http://localhost:5000' }));
app.use(express.json());

let db;

(async () => {
  db = await initDatabase();
})();

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

    res.json({ message: 'Login successful' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});