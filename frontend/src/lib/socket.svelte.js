import { io } from 'socket.io-client';

let _socket = null;

export function connectSocket() {
  if (!_socket) _socket = io('http://localhost:3000');
  return _socket;
}

export function getSocket() {
  return _socket;
}
