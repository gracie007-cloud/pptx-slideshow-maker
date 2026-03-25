import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
} from "@slideshow/shared";
import { registerEventHandlers } from "./events";

const SOCKET_PORT = parseInt(process.env.SOCKET_PORT || "3001", 10);
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export function createSocketServer() {
  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >({
    cors: {
      origin: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      methods: ["GET", "POST"],
      credentials: true,
    },
    connectionStateRecovery: {
      maxDisconnectionDuration: 2 * 60 * 1000,
      skipMiddlewares: true,
    },
  });

  return io;
}

async function setupRedisAdapter(
  io: Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >
) {
  try {
    const pubClient = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) return null; // stop retrying after 3 attempts
        return Math.min(times * 200, 1000);
      },
      lazyConnect: true,
    });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    console.log("[realtime] Redis adapter connected");
  } catch (err) {
    console.warn("[realtime] Redis unavailable, using in-memory adapter (this is fine for development)");
  }
}

async function main() {
  const io = createSocketServer();

  await setupRedisAdapter(io);

  // /session namespace for all session-related events
  const sessionNs = io.of("/session");
  sessionNs.on("connection", (socket) => {
    console.log(`[realtime] Client connected to /session: ${socket.id}`);
    registerEventHandlers(sessionNs, socket);

    socket.on("disconnect", (reason) => {
      console.log(`[realtime] Client disconnected from /session: ${socket.id} (${reason})`);
    });
  });

  // Default namespace for health checks
  io.on("connection", (socket) => {
    console.log(`[realtime] Client connected: ${socket.id}`);
    socket.on("disconnect", (reason) => {
      console.log(`[realtime] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  const httpServer = io.listen(SOCKET_PORT);
  console.log(`[realtime] Socket.io server running on port ${SOCKET_PORT}`);

  httpServer.on("error", (err: NodeJS.ErrnoException) => {
    if (err.code === "EADDRINUSE") {
      console.warn(`[realtime] Port ${SOCKET_PORT} is already in use — skipping`);
    } else {
      console.error("[realtime] Server error:", err);
    }
  });
}

main().catch(console.error);

export type { ServerToClientEvents, ClientToServerEvents };
