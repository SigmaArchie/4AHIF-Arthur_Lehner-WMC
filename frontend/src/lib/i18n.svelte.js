import { browser } from '$app/environment';

const translations = {
  de: {
    // nav / layout
    lobby: 'Lobby', profile: 'Profil', logout: 'Abmelden',
    backToGame: 'Zurück zum Spiel', language: 'Sprache',
    connected: 'Verbunden', disconnected: 'Getrennt',
    // auth
    loginTitle: 'Willkommen zurück',
    noAccount: 'Noch keinen Account?', registerLink: 'Registrieren', loginBtn: 'Anmelden',
    registerTitle: 'Account erstellen',
    hasAccount: 'Bereits registriert?', loginLink: 'Anmelden', registerBtn: 'Registrieren',
    username: 'Benutzername', password: 'Passwort',
    fillAllFields: 'Bitte alle Felder ausfüllen.',
    accountCreated: '✓ Account erstellt! Du wirst weitergeleitet...',
    // lobby
    gameRooms: 'Spielräume', createGame: 'Spiel erstellen',
    roomName: 'Raumname', maxPlayers: 'Max. Spieler', createJoin: 'Erstellen & Beitreten',
    join: 'Beitreten', startGame: 'Starten ▶', by: 'von',
    noRooms: 'Keine Räume verfügbar – erstelle einen neuen!',
    activeGameBanner: 'Du bist noch in einem laufenden Spiel!',
    backToGameBtn: 'Zurück zum Spiel',
    joined: '✓ Beigetreten',
    // game
    yourTurn: '✓ Du bist dran!', waitingFor: 'Warte auf',
    pendingDraw: 'ziehen!', surrender: 'Aufgeben',
    surrenderTitle: 'Spiel verlassen?',
    surrenderHint: 'Wenn du aufgibst, gewinnst du automatisch nicht mehr.',
    cancel: 'Abbrechen', yesLeave: 'Ja, verlassen',
    waitingStart: 'Warte auf Spielstart...',
    backToLobby: '← Zurück zur Lobby',
    yourCards: 'Deine Karten',
    discardPile: 'Ablagestapel', clockwise: '→ Uhrzeigersinn', counterClock: '← Gegenuhrzeiger',
    chooseColor: 'Wähle eine Farbe:',
    red: 'Rot', blue: 'Blau', green: 'Grün', yellow: 'Gelb',
    youWon: 'Du hast gewonnen!', won: 'hat gewonnen!', goodGame: 'Gutes Spiel!',
    chatTitle: '💬 Chat', noMessages: 'Noch keine Nachrichten',
    chatPlaceholder: 'Nachricht...', openChat: '💬 Chat',
    cards: 'Karten',
    // profile
    player: 'Spieler', myStats: 'Meine Statistiken',
    gamesPlayed: 'Gespielte Spiele', wins: 'Siege', winRate: 'Siegesquote',
    loadingStats: 'Lade Statistiken...',
    changePw: 'Passwort ändern', oldPassword: 'Altes Passwort',
    newPassword: 'Neues Passwort', confirmPw: 'Neues Passwort bestätigen',
    save: 'Speichern', leaderboard: 'Bestenliste', noGames: 'Noch keine Spiele gespielt.',
    pwFillAll: 'Alle Felder ausfüllen.',
    pwNoMatch: 'Neue Passwörter stimmen nicht überein.',
    pwTooShort: 'Mindestens 6 Zeichen erforderlich.',
    connFailed: 'Verbindung zum Server fehlgeschlagen.',
    createRoomError: 'Fehler beim Erstellen des Raums.',
    mustLogin: 'Du musst eingeloggt sein!',
    show: 'Anzeigen', hide: 'Verstecken',
    deleteRoom: 'Raum löschen',
    finishGameFirst: 'Beende zuerst dein laufendes Spiel.',
    passTurn: 'Passen',
    roomNameEmpty: 'Bitte einen Raumnamen eingeben.',
  },
  en: {
    lobby: 'Lobby', profile: 'Profile', logout: 'Logout',
    backToGame: 'Back to game', language: 'Language',
    connected: 'Connected', disconnected: 'Disconnected',
    loginTitle: 'Welcome back',
    noAccount: 'No account yet?', registerLink: 'Register', loginBtn: 'Sign in',
    registerTitle: 'Create account',
    hasAccount: 'Already registered?', loginLink: 'Sign in', registerBtn: 'Register',
    username: 'Username', password: 'Password',
    fillAllFields: 'Please fill in all fields.',
    accountCreated: '✓ Account created! Redirecting...',
    gameRooms: 'Game rooms', createGame: 'Create game',
    roomName: 'Room name', maxPlayers: 'Max players', createJoin: 'Create & Join',
    join: 'Join', startGame: 'Start ▶', by: 'by',
    noRooms: 'No rooms available – create one!',
    activeGameBanner: 'You are still in an active game!',
    backToGameBtn: 'Back to game',
    joined: '✓ Joined',
    yourTurn: '✓ Your turn!', waitingFor: 'Waiting for',
    pendingDraw: 'to draw!', surrender: 'Surrender',
    surrenderTitle: 'Leave game?',
    surrenderHint: 'If you surrender, you automatically lose.',
    cancel: 'Cancel', yesLeave: 'Yes, leave',
    waitingStart: 'Waiting for game start...',
    backToLobby: '← Back to lobby',
    yourCards: 'Your cards',
    discardPile: 'Discard pile', clockwise: '→ Clockwise', counterClock: '← Counter-clockwise',
    chooseColor: 'Choose a color:',
    red: 'Red', blue: 'Blue', green: 'Green', yellow: 'Yellow',
    youWon: 'You won!', won: 'won!', goodGame: 'Good game!',
    chatTitle: '💬 Chat', noMessages: 'No messages yet',
    chatPlaceholder: 'Message...', openChat: '💬 Chat',
    cards: 'cards',
    player: 'Player', myStats: 'My statistics',
    gamesPlayed: 'Games played', wins: 'Wins', winRate: 'Win rate',
    loadingStats: 'Loading stats...',
    changePw: 'Change password', oldPassword: 'Old password',
    newPassword: 'New password', confirmPw: 'Confirm new password',
    save: 'Save', leaderboard: 'Leaderboard', noGames: 'No games played yet.',
    pwFillAll: 'Please fill in all fields.',
    pwNoMatch: 'New passwords do not match.',
    pwTooShort: 'At least 6 characters required.',
    connFailed: 'Connection to server failed.',
    createRoomError: 'Error creating room.',
    mustLogin: 'You must be logged in!',
    show: 'Show', hide: 'Hide',
    deleteRoom: 'Delete room',
    finishGameFirst: 'Finish your current game first.',
    passTurn: 'Pass',
    roomNameEmpty: 'Please enter a room name.',
  }
};

export const lang = $state({
  current: browser ? (localStorage.getItem('lang') || 'de') : 'de'
});

export function t(key) {
  return translations[lang.current]?.[key] ?? key;
}

export function setLanguage(l) {
  lang.current = l;
  if (browser) localStorage.setItem('lang', l);
}
