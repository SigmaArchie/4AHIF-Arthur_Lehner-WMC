const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

async function initDatabase() {
  const db = await open({
    filename: path.join(__dirname, 'database.sqlite'),
    driver: sqlite3.Database
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      max_players INTEGER NOT NULL DEFAULT 4,
      status TEXT NOT NULL DEFAULT 'waiting',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  console.log('Database connected');

  return db;
}

module.exports = initDatabase;