const COLORS = ['red', 'blue', 'green', 'yellow'];
const NUMBER_VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
const SPECIAL_VALUES = ['skip', 'reverse', '+2'];
const WILD_VALUES = ['wild', 'wild+4'];

function createDeck() {
  const deck = [];

  for (const color of COLORS) {
    // one 0 per color
    deck.push({ color, value: '0' });

    // two of each 1-9 and special per color
    for (const value of [...NUMBER_VALUES.slice(1), ...SPECIAL_VALUES]) {
      deck.push({ color, value });
      deck.push({ color, value });
    }
  }

  // 4 wild and 4 wild+4
  for (const value of WILD_VALUES) {
    for (let i = 0; i < 4; i++) {
      deck.push({ color: 'wild', value });
    }
  }

  return deck;
}

function shuffle(deck) {
  const d = [...deck];
  for (let i = d.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [d[i], d[j]] = [d[j], d[i]];
  }
  return d;
}

function createGame(players) {
  let deck = shuffle(createDeck());

  // deal 7 cards to each player
  const hands = {};
  for (const username of players) {
    hands[username] = deck.splice(0, 7);
  }

  // first discard card must not be a wild
  let startCard;
  do {
    startCard = deck.shift();
    if (startCard.color === 'wild') deck.push(startCard);
  } while (startCard.color === 'wild');

  return {
    players,               // ordered array of usernames
    hands,                 // { username: [cards] }
    deck,
    discardPile: [startCard],
    currentPlayerIndex: 0,
    direction: 1,          // 1 = clockwise, -1 = counter-clockwise
    currentColor: startCard.color,
    status: 'playing',
    pendingDraw: 0,        // accumulated +2 / +4
    pendingDrawSource: null, // '+2' or 'wild+4' — prevents cross-stacking
    drawnCard: false,      // player drew this turn, may now play or pass
    winner: null
  };
}

function topCard(gameState) {
  return gameState.discardPile[gameState.discardPile.length - 1];
}

function canPlayCard(card, gameState) {
  // stacking: +2 only stacks on +2, wild+4 only stacks on wild+4
  if (gameState.pendingDraw > 0) {
    if (gameState.pendingDrawSource === '+2') return card.value === '+2';
    return card.value === 'wild+4';
  }

  const top = topCard(gameState);
  const { currentColor } = gameState;

  if (card.color === 'wild') return true;
  if (card.color === currentColor) return true;
  if (card.value === top.value) return true;

  return false;
}

function nextIndex(gameState, skip = false) {
  const count = gameState.players.length;
  const step = skip ? 2 : 1;
  return ((gameState.currentPlayerIndex + gameState.direction * step) % count + count) % count;
}

// Returns updated gameState (mutates in place for simplicity)
function applyPlayCard(gameState, username, cardIndex, chosenColor) {
  const hand = gameState.hands[username];
  const card = hand[cardIndex];

  if (!card) return { ok: false, error: 'Card not found' };
  if (gameState.players[gameState.currentPlayerIndex] !== username)
    return { ok: false, error: 'Not your turn' };
  if (!canPlayCard(card, gameState))
    return { ok: false, error: 'Card cannot be played' };

  // remove card from hand
  hand.splice(cardIndex, 1);
  gameState.discardPile.push(card);
  gameState.drawnCard = false;

  // check win
  if (hand.length === 0) {
    gameState.status = 'finished';
    gameState.winner = username;
    return { ok: true };
  }

  // apply effect
  switch (card.value) {
    case 'skip':
      gameState.currentColor = card.color;
      gameState.currentPlayerIndex = nextIndex(gameState, true);
      break;

    case 'reverse':
      gameState.currentColor = card.color;
      if (gameState.players.length === 2) {
        // with 2 players reverse acts like skip
        gameState.currentPlayerIndex = nextIndex(gameState, true);
      } else {
        gameState.direction *= -1;
        gameState.currentPlayerIndex = nextIndex(gameState);
      }
      break;

    case '+2':
      gameState.currentColor = card.color;
      gameState.pendingDraw += 2;
      gameState.pendingDrawSource = '+2';
      gameState.currentPlayerIndex = nextIndex(gameState);
      break;

    case 'wild':
      gameState.currentColor = chosenColor || 'red';
      gameState.currentPlayerIndex = nextIndex(gameState);
      break;

    case 'wild+4':
      gameState.currentColor = chosenColor || 'red';
      gameState.pendingDraw += 4;
      gameState.pendingDrawSource = 'wild+4';
      gameState.currentPlayerIndex = nextIndex(gameState);
      break;

    default:
      gameState.currentColor = card.color;
      gameState.currentPlayerIndex = nextIndex(gameState);
  }

  return { ok: true };
}

function applyDrawCard(gameState, username) {
  if (gameState.players[gameState.currentPlayerIndex] !== username)
    return { ok: false, error: 'Not your turn' };
  if (gameState.drawnCard)
    return { ok: false, error: 'Already drew a card this turn' };

  const count = gameState.pendingDraw > 0 ? gameState.pendingDraw : 1;
  gameState.pendingDraw = 0;
  gameState.pendingDrawSource = null;

  // reshuffle discard pile into deck if needed
  for (let i = 0; i < count; i++) {
    if (gameState.deck.length === 0) {
      const top = gameState.discardPile.pop();
      gameState.deck = shuffle(gameState.discardPile);
      gameState.discardPile = [top];
    }
    if (gameState.deck.length > 0) {
      gameState.hands[username].push(gameState.deck.shift());
    }
  }

  // don't advance turn — player can play a card or pass
  gameState.drawnCard = true;

  return { ok: true };
}

function applyPassTurn(gameState, username) {
  if (gameState.players[gameState.currentPlayerIndex] !== username)
    return { ok: false, error: 'Not your turn' };
  if (!gameState.drawnCard)
    return { ok: false, error: 'Draw a card first' };

  gameState.drawnCard = false;
  gameState.currentPlayerIndex = nextIndex(gameState);
  return { ok: true };
}

// Returns a sanitized view for a specific player (hides other players' cards)
function getStateForPlayer(gameState, username) {
  const playerHands = {};
  for (const p of gameState.players) {
    playerHands[p] = p === username
      ? gameState.hands[p]
      : gameState.hands[p].length;
  }

  return {
    players: gameState.players,
    hands: playerHands,
    topCard: topCard(gameState),
    currentColor: gameState.currentColor,
    currentPlayer: gameState.players[gameState.currentPlayerIndex],
    direction: gameState.direction,
    deckCount: gameState.deck.length,
    pendingDraw: gameState.pendingDraw,
    drawnCard: gameState.drawnCard,
    status: gameState.status,
    winner: gameState.winner
  };
}

module.exports = { createGame, canPlayCard, applyPlayCard, applyDrawCard, applyPassTurn, getStateForPlayer };
