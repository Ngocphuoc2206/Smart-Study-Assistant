import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    const socketURL =
      process.env.NEXT_PUBLIC_SOCKET_URL ||
      (process.env.NEXT_PUBLIC_API_BASE_URL
        ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/\/api\/?$/, "")
        : "http://localhost:4000");
    socket = io(socketURL, {
      transports: ["websocket"],
    });
  }
  return socket;
}
