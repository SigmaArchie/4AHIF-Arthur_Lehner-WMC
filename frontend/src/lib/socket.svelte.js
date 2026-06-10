import { io } from 'socket.io-client';

export const socketStatus = $state({ connected: false });

let _socket = null;

export function connectSocket() {
  if (!_socket) {
    _socket = io('http://localhost:3000');
    _socket.on('connect',    () => { socketStatus.connected = true;  });
    _socket.on('disconnect', () => { socketStatus.connected = false; });
  }
  return _socket;
}

export function getSocket() {
  return _socket;
}
