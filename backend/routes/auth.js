const router = require('express').Router();
const bcrypt = require('bcrypt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 10;
const USERNAME_RE = /^[a-zA-Z0-9_]+$/;

module.exports = function (db) {
  router.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Username und Passwort erforderlich.' });
    if (username.length < 3 || username.length > 20)
      return res.status(400).json({ error: 'Username muss 3–20 Zeichen lang sein.' });
    if (!USERNAME_RE.test(username))
      return res.status(400).json({ error: 'Username darf nur Buchstaben, Zahlen und _ enthalten.' });
    if (password.length < 6)
      return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein.' });

    try {
      const hashed = await bcrypt.hash(password, SALT_ROUNDS);
      await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashed]);
      res.json({ message: 'User created' });
    } catch {
      res.status(500).json({ error: 'Benutzername bereits vergeben.' });
    }
  });

  router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password)
      return res.status(400).json({ error: 'Username und Passwort erforderlich.' });

    try {
      const user = await db.get('SELECT * FROM users WHERE username = ?', [username]);
      if (!user) return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });

      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(401).json({ error: 'Ungültige Anmeldedaten.' });

      res.json({ message: 'Login successful', username: user.username });
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};
