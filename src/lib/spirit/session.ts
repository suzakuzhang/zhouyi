interface SpiritMessage {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  roundIndex: number;
}

export interface SpiritSession {
  sessionId: string;
  castId: string;
  hexagramName: string;
  hexagramFullName: string;
  orientation: string; // not applicable for yijing, kept for compatibility
  question: string;
  startedAt: string;
  expiresAt: string;
  remainingRounds: number;
  status: "active" | "expired" | "ended";
  messages: SpiritMessage[];
}

interface CastContext {
  castId: string;
  hexagramName: string;
  hexagramFullName: string;
  question: string;
  guaCi: string;
  tuan: string;
  xiangOverall: string;
  changingLines: number[];
  changedHexagramName?: string;
}

const TTL_SECONDS = 600; // 10 minutes
const MAX_ROUNDS = 8;

// In-memory session store
const castContexts = new Map<string, CastContext>();
const sessions = new Map<string, SpiritSession>();

function randomId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

export function registerCast(ctx: CastContext): void {
  castContexts.set(ctx.castId, ctx);
}

export function getCastContext(castId: string): CastContext | null {
  return castContexts.get(castId) ?? null;
}

export function createSpiritSession(castId: string): SpiritSession | null {
  const ctx = castContexts.get(castId);
  if (!ctx) return null;

  const sessionId = `spirit_${randomId()}`;
  const now = new Date();
  const session: SpiritSession = {
    sessionId,
    castId,
    hexagramName: ctx.hexagramName,
    hexagramFullName: ctx.hexagramFullName,
    orientation: "",
    question: ctx.question,
    startedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_SECONDS * 1000).toISOString(),
    remainingRounds: MAX_ROUNDS,
    status: "active",
    messages: [],
  };

  sessions.set(sessionId, session);
  return session;
}

export function getSpiritSession(sessionId: string): SpiritSession | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  // Check expiry
  if (new Date() >= new Date(session.expiresAt)) {
    session.status = "expired";
  }
  return session;
}

export function canChat(session: SpiritSession): boolean {
  return session.status === "active" && session.remainingRounds > 0;
}

export function addMessage(
  sessionId: string,
  role: "user" | "assistant",
  content: string
): void {
  const session = sessions.get(sessionId);
  if (!session) return;

  const roundIndex = session.messages.length;
  session.messages.push({
    role,
    content,
    createdAt: new Date().toISOString(),
    roundIndex,
  });
}

export function consumeRound(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (!session) return;
  session.remainingRounds = Math.max(0, session.remainingRounds - 1);
  if (session.remainingRounds === 0) {
    session.status = "ended";
  }
}

export function endSession(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session && session.status === "active") {
    session.status = "ended";
  }
}

export function getRecentMessages(
  sessionId: string,
  maxCount = 8
): SpiritMessage[] {
  const session = sessions.get(sessionId);
  if (!session) return [];
  return session.messages.slice(-maxCount);
}
