import { io, type Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@slideshow/shared";
import { SOCKET_NAMESPACE } from "@slideshow/shared";

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const SOCKET_PORT = process.env.NEXT_PUBLIC_SOCKET_PORT ?? "3001";
const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? `http://localhost:${SOCKET_PORT}`;

/**
 * Creates a new Socket.io client instance connected to the session namespace.
 * Each call returns a fresh socket; callers are responsible for cleanup.
 */
export function createSocket(): TypedSocket {
  const socket: TypedSocket = io(
    `${SOCKET_URL}${SOCKET_NAMESPACE.session}`,
    {
      autoConnect: false,
      transports: ["websocket", "polling"],
      // TODO: Add auth token for session validation
      // auth: { token: getSessionToken() },
    }
  );

  return socket;
}
