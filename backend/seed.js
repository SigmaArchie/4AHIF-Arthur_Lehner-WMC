/**
 * Seed script – resets the database and inserts test data.
 * Run with: node seed.js
 */

const bcrypt = require('bcrypt');
const initDatabase = require('./db');

const USERS = [
  { username: 'arthur',    password: 'htl1234' },
  { username: 'anna_k',    password: 'htl1234' },
  { username: 'maxmuster', password: 'htl1234' },
  { username: 'lena99',    password: 'htl1234' },
  { username: 'felix',     password: 'htl1234' },
  { username: 'miaschl',   password: 'htl1234' },
];

// [winner, [players], daysAgo]
const GAMES = [
  ['anna_k',    ['anna_k','arthur','maxmuster','lena99'],  30],
  ['anna_k',    ['anna_k','felix','miaschl'],              28],
  ['maxmuster', ['maxmuster','arthur','lena99'],           27],
  ['anna_k',    ['anna_k','arthur'],                       26],
  ['felix',     ['felix','anna_k','maxmuster'],            25],
  ['arthur',    ['arthur','lena99','miaschl'],             24],
  ['anna_k',    ['anna_k','felix','arthur','lena99'],      23],
  ['maxmuster', ['maxmuster','miaschl'],                   22],
  ['lena99',    ['lena99','anna_k','felix'],               21],
  ['anna_k',    ['anna_k','arthur','maxmuster'],           20],
  ['arthur',    ['arthur','felix','miaschl','lena99'],     19],
  ['felix',     ['felix','maxmuster','anna_k'],            18],
  ['miaschl',   ['miaschl','lena99','arthur'],             17],
  ['anna_k',    ['anna_k','felix'],                        16],
  ['maxmuster', ['maxmuster','arthur','lena99','miaschl'], 15],
  ['arthur',    ['arthur','anna_k'],                       14],
  ['lena99',    ['lena99','miaschl','felix'],              13],
  ['anna_k',    ['anna_k','maxmuster','arthur','felix'],   12],
  ['felix',     ['felix','lena99'],                        11],
  ['arthur',    ['arthur','miaschl','anna_k'],             10],
  ['maxmuster', ['maxmuster','felix','lena99'],             9],
  ['anna_k',    ['anna_k','arthur','miaschl'],              7],
  ['lena99',    ['lena99','maxmuster'],                     6],
  ['arthur',    ['arthur','felix','anna_k','lena99'],       5],
  ['miaschl',   ['miaschl','anna_k','maxmuster'],           4],
  ['anna_k',    ['anna_k','felix','arthur'],                3],
  ['felix',     ['felix','lena99','miaschl','arthur'],      2],
  ['arthur',    ['arthur','anna_k'],                        1],
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}

(async () => {
  const db = await initDatabase();

  // ── reset ──────────────────────────────────────────────
  await db.run('DELETE FROM game_results');
  await db.run('DELETE FROM rooms');
  await db.run('DELETE FROM users');
  await db.run("DELETE FROM sqlite_sequence WHERE name IN ('users','rooms','game_results')");
  console.log('Tables cleared.');

  // ── users ──────────────────────────────────────────────
  for (const u of USERS) {
    const hash = await bcrypt.hash(u.password, 10);
    await db.run('INSERT INTO users (username, password) VALUES (?, ?)', [u.username, hash]);
    console.log(`  User created: ${u.username}`);
  }

  // ── game results ───────────────────────────────────────
  for (const [winner, players, ago] of GAMES) {
    await db.run(
      'INSERT INTO game_results (winner, players, player_count, finished_at) VALUES (?, ?, ?, ?)',
      [winner, players.join(','), players.length, daysAgo(ago)]
    );
  }
  console.log(`  ${GAMES.length} game results inserted.`);

  console.log('\nDone! Login credentials (all passwords: htl1234):');
  for (const u of USERS) console.log(`  ${u.username.padEnd(12)} / ${u.password}`);

  process.exit(0);
})();
