const router = require('express').Router();

module.exports = function (db, io) {
  async function emitRoomsUpdate() {
    const rooms = await db.all("SELECT * FROM rooms WHERE status = 'waiting' ORDER BY id DESC");
    const roomsWithCounts = await Promise.all(
      rooms.map(async (room) => {
        const sockets = await io.in(`room-${room.id}`).fetchSockets();
        return { ...room, player_count: sockets.length };
      })
    );
    io.emit('rooms-updated', roomsWithCounts);
  }

  router.get('/rooms', async (req, res) => {
    try {
      const rooms = await db.all("SELECT * FROM rooms WHERE status = 'waiting' ORDER BY id DESC");
      const roomsWithCounts = await Promise.all(
        rooms.map(async (room) => {
          const sockets = await io.in(`room-${room.id}`).fetchSockets();
          return { ...room, player_count: sockets.length };
        })
      );
      res.json(roomsWithCounts);
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.post('/rooms', async (req, res) => {
    const { name, max_players, owner } = req.body;

    if (!name || name.trim().length === 0)
      return res.status(400).json({ error: 'Raumname erforderlich.' });
    if (name.length > 30)
      return res.status(400).json({ error: 'Raumname darf max. 30 Zeichen lang sein.' });

    try {
      const result = await db.run(
        'INSERT INTO rooms (name, max_players, owner) VALUES (?, ?, ?)',
        [name.trim(), max_players || 4, owner || '']
      );
      const room = await db.get('SELECT * FROM rooms WHERE id = ?', [result.lastID]);
      await emitRoomsUpdate();
      res.json(room);
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.delete('/rooms/:id', async (req, res) => {
    const { id } = req.params;
    const { username } = req.body;

    try {
      const room = await db.get('SELECT * FROM rooms WHERE id = ?', [id]);
      if (!room) return res.status(404).json({ error: 'Raum nicht gefunden.' });
      if (room.owner !== username) return res.status(403).json({ error: 'Nur der Ersteller kann den Raum löschen.' });
      if (room.status !== 'waiting') return res.status(400).json({ error: 'Laufende Spiele können nicht gelöscht werden.' });

      await db.run('DELETE FROM rooms WHERE id = ?', [id]);
      await emitRoomsUpdate();
      res.json({ message: 'Raum gelöscht.' });
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};
