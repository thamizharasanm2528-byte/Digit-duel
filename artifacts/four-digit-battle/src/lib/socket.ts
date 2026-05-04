// Singleton Socket.IO client
// The proxy routes /socket.io to the api-server automatically
import { io, type Socket } from "socket.io-client";

let _socket: Socket | null = null;

/** Get (or lazily create) the singleton socket instance */
export function getSocket(): Socket {
  if (!_socket) {
    _socket = io({
      path: "/socket.io",
      autoConnect: false,
      reconnectionAttempts: 5,
    });
  }
  return _socket;
}

/** Connect the socket if not already connected */
export function connectSocket(): Socket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

/** Disconnect the socket */
export function disconnectSocket(): void {
  _socket?.disconnect();
}
