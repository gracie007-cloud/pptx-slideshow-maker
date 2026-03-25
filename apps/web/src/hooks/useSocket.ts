"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import type { Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
} from "@slideshow/shared";
import { createSocket } from "@/lib/socket";

interface UseSocketReturn {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  emit: <E extends keyof ClientToServerEvents>(
    event: E,
    ...args: Parameters<ClientToServerEvents[E]>
  ) => void;
  on: <E extends keyof ServerToClientEvents>(
    event: E,
    handler: ServerToClientEvents[E]
  ) => void;
}

/**
 * Socket.io client hook.
 * Connects to the Socket.io server and manages the connection lifecycle.
 */
export function useSocket(sessionId?: string): UseSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    // TODO: If sessionId is provided, auto-join the session namespace
    if (sessionId) {
      // TODO: Authenticate and join session room
    }

    socket.connect();

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [sessionId]);

  const emit = useCallback(
    <E extends keyof ClientToServerEvents>(
      event: E,
      ...args: Parameters<ClientToServerEvents[E]>
    ) => {
      if (socketRef.current?.connected) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (socketRef.current.emit as any)(event, ...args);
      }
    },
    []
  );

  const on = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      handler: ServerToClientEvents[E]
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      socketRef.current?.on(event as any, handler as any);
    },
    []
  );

  return {
    socket: socketRef.current,
    isConnected,
    emit,
    on,
  };
}
