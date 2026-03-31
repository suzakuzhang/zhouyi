import fs from "fs";
import path from "path";

const DATA_DIR = path.resolve(process.cwd());
const SPIRIT_FILE = path.join(DATA_DIR, "spirit_data.json");

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
  orientation: string;
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

interface SpiritStore {
  castContexts: Record<string, CastContext>;
  sessions: Record<string, SpiritSession>;
}

const TTL_SECONDS = 600;
const MAX_ROUNDS = 8;

function load(): SpiritStore {
  try {
    if (fs.existsSync(SPIRIT_FILE)) {
      const raw = fs.readFileSync(SPIRIT_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        castContexts: parsed.castContexts ?? {},
        sessions: parsed.sessions ?? {},
      };
    }
  } catch { /* ignore */ }
  return { castContexts: {}, sessions: {} };
}

function save(store: SpiritStore): void {
  // Clean up expired/ended sessions older than 1 hour
  const cutoff = Date.now() - 3600_000;
  for (const [id, s] of Object.entries(store.sessions)) {
    if (s.status !== "active" && new Date(s.startedAt).getTime() < cutoff) {
      delete store.sessions[id];
    }
  }
  fs.writeFileSync(SPIRIT_FILE, JSON.stringify(store, null, 2), "utf-8");
}

function randomId(): string {
  return Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

export function registerCast(ctx: CastContext): void {
  const store = load();
  store.castContexts[ctx.castId] = ctx;
  save(store);
}

export function getCastContext(castId: string): CastContext | null {
  const store = load();
  return store.castContexts[castId] ?? null;
}

export function createSpiritSession(castId: string): SpiritSession | null {
  const store = load();
  const ctx = store.castContexts[castId];
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

  store.sessions[sessionId] = session;
  save(store);
  return session;
}

export function getSpiritSession(sessionId: string): SpiritSession | null {
  const store = load();
  const session = store.sessions[sessionId];
  if (!session) return null;

  if (session.status === "active" && new Date() >= new Date(session.expiresAt)) {
    session.status = "expired";
    save(store);
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
  const store = load();
  const session = store.sessions[sessionId];
  if (!session) return;

  session.messages.push({
    role,
    content,
    createdAt: new Date().toISOString(),
    roundIndex: session.messages.length,
  });
  save(store);
}

export function consumeRound(sessionId: string): void {
  const store = load();
  const session = store.sessions[sessionId];
  if (!session) return;

  session.remainingRounds = Math.max(0, session.remainingRounds - 1);
  if (session.remainingRounds === 0) {
    session.status = "ended";
  }
  save(store);
}

export function endSession(sessionId: string): void {
  const store = load();
  const session = store.sessions[sessionId];
  if (session && session.status === "active") {
    session.status = "ended";
    save(store);
  }
}

export function getRecentMessages(
  sessionId: string,
  maxCount = 8
): SpiritMessage[] {
  const store = load();
  const session = store.sessions[sessionId];
  if (!session) return [];
  return session.messages.slice(-maxCount);
}

export function exportSpiritResearchData(): {
  castContexts: CastContext[];
  sessions: SpiritSession[];
  counts: { castContexts: number; sessions: number };
} {
  const store = load();
  const castContexts = Object.values(store.castContexts).sort((a, b) =>
    a.castId.localeCompare(b.castId)
  );
  const sessions = Object.values(store.sessions).sort((a, b) =>
    a.startedAt.localeCompare(b.startedAt)
  );

  return {
    castContexts,
    sessions,
    counts: {
      castContexts: castContexts.length,
      sessions: sessions.length,
    },
  };
}
