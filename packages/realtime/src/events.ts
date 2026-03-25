import type { Namespace, Socket } from "socket.io";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  Quiz,
  QuizResultData,
} from "@slideshow/shared";

type IoNamespace = Namespace<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type IoSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

// ============================================================
// In-memory stores
// ============================================================

interface ParticipantData {
  name: string;
  stars: number;
  participantId: string;
}

/** sessionCode -> Map<socketId, ParticipantData> */
const participants = new Map<string, Map<string, ParticipantData>>();

/** sessionCode -> session state */
const sessionState = new Map<
  string,
  { currentSlide: number; activeQuizId: string | null }
>();

/** sessionCode -> Map<quizId, Quiz> */
const quizStore = new Map<string, Map<string, Quiz>>();

/** sessionCode -> Map<quizId, Map<socketId, answer>> */
const quizResponses = new Map<
  string,
  Map<string, Map<string, string | string[] | number>>
>();

/** sessionCode -> timer interval handle */
const activeTimers = new Map<string, ReturnType<typeof setInterval>>();

// ============================================================
// Helpers
// ============================================================

function getRoomId(code: string): string {
  return `session:${code}`;
}

function getOrCreateParticipants(code: string): Map<string, ParticipantData> {
  let map = participants.get(code);
  if (!map) {
    map = new Map();
    participants.set(code, map);
  }
  return map;
}

function getOrCreateState(code: string) {
  let state = sessionState.get(code);
  if (!state) {
    state = { currentSlide: 0, activeQuizId: null };
    sessionState.set(code, state);
  }
  return state;
}

function cleanupSession(code: string) {
  participants.delete(code);
  sessionState.delete(code);
  quizStore.delete(code);
  quizResponses.delete(code);
  const timer = activeTimers.get(code);
  if (timer) {
    clearInterval(timer);
    activeTimers.delete(code);
  }
}

// ============================================================
// Event registration
// ============================================================

export function registerEventHandlers(ns: IoNamespace, socket: IoSocket) {
  // ---- Session Management ----

  socket.on("session:join", ({ code, name }) => {
    const roomId = getRoomId(code);
    socket.join(roomId);

    socket.data.sessionId = code;
    socket.data.name = name;
    socket.data.participantId = socket.id;
    socket.data.role = "participant";

    const sessionParticipants = getOrCreateParticipants(code);
    sessionParticipants.set(socket.id, {
      name,
      stars: 0,
      participantId: socket.id,
    });

    ns.to(roomId).emit("session:participant-joined", {
      participantId: socket.id,
      name,
      count: sessionParticipants.size,
    });

    // Send current slide state to newly joined participant
    const state = sessionState.get(code);
    if (state) {
      socket.emit("slide:changed", { slideIndex: state.currentSlide });
    }
  });

  socket.on("session:leave", () => {
    handleDisconnect(ns, socket);
  });

  // ---- Slide Navigation ----

  socket.on("slide:change", ({ slideIndex }) => {
    const code = socket.data.sessionId;
    if (!code) return;
    const roomId = getRoomId(code);
    const state = getOrCreateState(code);
    state.currentSlide = slideIndex;

    socket.to(roomId).emit("slide:changed", { slideIndex });
  });

  // ---- Quiz Events ----

  socket.on("quiz:start", ({ quizId }) => {
    const code = socket.data.sessionId;
    if (!code) return;
    const roomId = getRoomId(code);
    const state = getOrCreateState(code);
    state.activeQuizId = quizId;

    // Look up quiz from in-memory store, or create a placeholder
    let quizzes = quizStore.get(code);
    if (!quizzes) {
      quizzes = new Map();
      quizStore.set(code, quizzes);
    }

    let quiz = quizzes.get(quizId);
    if (!quiz) {
      // Store a default quiz shell so responses can still be collected
      quiz = {
        id: quizId,
        presentationId: "",
        slideId: null,
        type: "MULTIPLE_CHOICE",
        question: "",
        options: [],
        correctAnswer: null,
        timeLimit: 30,
        points: 1,
        order: 0,
      };
      quizzes.set(quizId, quiz);
    }

    // Initialize response map for this quiz
    let sessionResponses = quizResponses.get(code);
    if (!sessionResponses) {
      sessionResponses = new Map();
      quizResponses.set(code, sessionResponses);
    }
    sessionResponses.set(quizId, new Map());

    ns.to(roomId).emit("quiz:started", {
      quiz,
      timeLimit: quiz.timeLimit,
    });
  });

  socket.on("quiz:stop", ({ quizId }) => {
    const code = socket.data.sessionId;
    if (!code) return;
    const roomId = getRoomId(code);
    const state = getOrCreateState(code);
    state.activeQuizId = null;

    // Aggregate responses
    const sessionResponseMap = quizResponses.get(code);
    const responseMap = sessionResponseMap?.get(quizId);
    const totalResponses = responseMap ? responseMap.size : 0;

    const answerDistribution: Record<string, number> = {};
    if (responseMap) {
      for (const answer of responseMap.values()) {
        const key = String(answer);
        answerDistribution[key] = (answerDistribution[key] || 0) + 1;
      }
    }

    const quizzes = quizStore.get(code);
    const quiz = quizzes?.get(quizId);

    const results: QuizResultData = {
      quizId,
      type: quiz?.type ?? "MULTIPLE_CHOICE",
      totalResponses,
      answerDistribution,
      correctAnswer: quiz?.correctAnswer ?? undefined,
    };

    ns.to(roomId).emit("quiz:ended", { quizId, results });

    // Clean up responses for this quiz
    sessionResponseMap?.delete(quizId);
  });

  socket.on("quiz:respond", ({ quizId, answer }) => {
    const code = socket.data.sessionId;
    if (!code) return;
    const roomId = getRoomId(code);

    let sessionResponseMap = quizResponses.get(code);
    if (!sessionResponseMap) {
      sessionResponseMap = new Map();
      quizResponses.set(code, sessionResponseMap);
    }
    let responseMap = sessionResponseMap.get(quizId);
    if (!responseMap) {
      responseMap = new Map();
      sessionResponseMap.set(quizId, responseMap);
    }

    responseMap.set(socket.id, answer);

    ns.to(roomId).emit("quiz:response-count", {
      quizId,
      count: responseMap.size,
    });
  });

  // ---- Annotations ----

  socket.on("annotation:draw", ({ objects }) => {
    const code = socket.data.sessionId;
    if (!code) return;
    socket.to(getRoomId(code)).emit("annotation:update", { objects });
  });

  socket.on("annotation:clear", () => {
    const code = socket.data.sessionId;
    if (!code) return;
    socket.to(getRoomId(code)).emit("annotation:clear");
  });

  // ---- Gamification ----

  socket.on("star:award", ({ participantId, count }) => {
    const code = socket.data.sessionId;
    if (!code) return;
    const roomId = getRoomId(code);

    const sessionParticipants = participants.get(code);
    const participant = sessionParticipants?.get(participantId);

    if (participant) {
      participant.stars += count;
      ns.to(roomId).emit("star:awarded", {
        participantId,
        participantName: participant.name,
        count,
        totalStars: participant.stars,
      });
    }
  });

  // ---- Presenter Tools ----

  socket.on("spotlight:move", (data) => {
    const code = socket.data.sessionId;
    if (!code) return;
    socket.to(getRoomId(code)).emit("spotlight:update", data);
  });

  socket.on("whiteboard:toggle", ({ active }) => {
    const code = socket.data.sessionId;
    if (!code) return;
    socket.to(getRoomId(code)).emit("whiteboard:toggle", { active });
  });

  socket.on("name-picker:spin", () => {
    const code = socket.data.sessionId;
    if (!code) return;
    const roomId = getRoomId(code);
    const sessionParticipants = participants.get(code);

    if (sessionParticipants && sessionParticipants.size > 0) {
      const entries = Array.from(sessionParticipants.entries());
      const [randomSocketId, data] =
        entries[Math.floor(Math.random() * entries.length)];
      ns.to(roomId).emit("name-picker:result", {
        participantId: randomSocketId,
        name: data.name,
      });
    }
  });

  // ---- Timer ----

  socket.on("timer:start", ({ duration }) => {
    const code = socket.data.sessionId;
    if (!code) return;
    const roomId = getRoomId(code);

    // Clear any existing timer for this session
    const existingTimer = activeTimers.get(code);
    if (existingTimer) {
      clearInterval(existingTimer);
    }

    ns.to(roomId).emit("timer:started", { duration });

    let remaining = duration;
    const interval = setInterval(() => {
      remaining -= 1;
      ns.to(roomId).emit("timer:tick", { remaining });

      if (remaining <= 0) {
        clearInterval(interval);
        activeTimers.delete(code);
        ns.to(roomId).emit("timer:stopped");
      }
    }, 1000);

    activeTimers.set(code, interval);
  });

  socket.on("timer:stop", () => {
    const code = socket.data.sessionId;
    if (!code) return;
    const roomId = getRoomId(code);

    const timer = activeTimers.get(code);
    if (timer) {
      clearInterval(timer);
      activeTimers.delete(code);
    }

    ns.to(roomId).emit("timer:stopped");
  });

  // ---- Disconnect ----

  socket.on("disconnect", () => {
    handleDisconnect(ns, socket);
  });
}

// ============================================================
// Disconnect handler
// ============================================================

function handleDisconnect(ns: IoNamespace, socket: IoSocket) {
  const code = socket.data.sessionId;
  if (!code) return;

  const roomId = getRoomId(code);
  const sessionParticipants = participants.get(code);

  if (sessionParticipants) {
    sessionParticipants.delete(socket.id);

    ns.to(roomId).emit("session:participant-left", {
      participantId: socket.id,
      count: sessionParticipants.size,
    });

    // If no participants left, clean up the entire session
    if (sessionParticipants.size === 0) {
      cleanupSession(code);
    }
  }

  socket.leave(roomId);
  socket.data.sessionId = "";
}
