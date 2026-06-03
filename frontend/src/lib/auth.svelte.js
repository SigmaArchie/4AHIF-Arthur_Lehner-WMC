export const auth = $state({
  username: typeof localStorage !== 'undefined' ? localStorage.getItem('username') : null
});

export function login(username) {
  auth.username = username;
  localStorage.setItem('username', username);
}

export function logout() {
  auth.username = null;
  localStorage.removeItem('username');
  localStorage.removeItem('currentRoomId');
}
