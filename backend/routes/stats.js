const router = require('express').Router();

module.exports = function (db) {
  router.get('/stats/:username', async (req, res) => {
    const { username } = req.params;
    try {
      const gamesRow = await db.get(
        "SELECT COUNT(*) as count FROM game_results WHERE ',' || players || ',' LIKE '%,' || ? || ',%'",
        [username]
      );
      const winsRow = await db.get(
        'SELECT COUNT(*) as count FROM game_results WHERE winner = ?',
        [username]
      );
      const games = gamesRow?.count || 0;
      const wins = winsRow?.count || 0;
      const winRate = games > 0 ? Math.round((wins / games) * 100) : 0;
      res.json({ games, wins, winRate });
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.get('/leaderboard', async (req, res) => {
    try {
      const rows = await db.all(
        'SELECT winner AS username, COUNT(*) AS wins FROM game_results GROUP BY winner ORDER BY wins DESC LIMIT 10'
      );
      res.json(rows);
    } catch {
      res.status(500).json({ error: 'Server error' });
    }
  });

  return router;
};
