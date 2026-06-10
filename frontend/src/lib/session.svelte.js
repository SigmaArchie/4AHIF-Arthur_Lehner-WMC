import { browser } from '$app/environment';

export const session = $state({ currentRoomId: null });

export function setCurrentRoom(id) {
  session.currentRoomId = id ?? null;
  if (browser) {
    if (id) localStorage.setItem('currentRoomId', String(id));
    else localStorage.removeItem('currentRoomId');
  }
}

export function initSession() {
  if (browser) session.currentRoomId = localStorage.getItem('currentRoomId');
}
