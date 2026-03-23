import fs from "fs";
import path from "path";
import type { Role } from "./roles";
import { ROLE_NORMAL } from "./roles";

const DATA_DIR = path.resolve(process.cwd());
const DATA_FILE = path.join(DATA_DIR, "access_data.json");

const FREE_GLOBAL_LIMIT = 99;

// ── Types ────────────────────────────────────────────

interface AccessSession {
  token: string;
  role: Role;
  accessType: string;
  activated: boolean;
  userId: string;
  userName: string;
  createdAt: string;
  expiresAt: string;
}

interface InviteCode {
  code: string;
  usedCount: number;
  maxUses: number;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

export interface UsageLog {
  id: string;
  timestamp: string;
  action: "cast" | "interpret" | "spirit_start";
  role: Role;
  userId: string;
  hexagramName: string;
  question: string;
  ip?: string;
  extra?: Record<string, unknown>;
}

interface DataStore {
  accessSessions: Record<string, AccessSession>;
  inviteCodes: InviteCode[];
  freeUsedCount: number;
  usageLogs: UsageLog[];
}

// ── Persistence ──────────────────────────────────────

function load(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      return {
        accessSessions: parsed.accessSessions ?? {},
        inviteCodes: parsed.inviteCodes ?? [],
        freeUsedCount: parsed.freeUsedCount ?? 0,
        usageLogs: parsed.usageLogs ?? [],
      };
    }
  } catch { /* ignore */ }
  return { accessSessions: {}, inviteCodes: [], freeUsedCount: 0, usageLogs: [] };
}

function save(data: DataStore): void {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
}

function utcNow(): string {
  return new Date().toISOString();
}

function randomToken(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join("");
}

// ── Free Global Counter ──────────────────────────────

export function getFreeUsage(): { used: number; limit: number; remaining: number } {
  const data = load();
  const used = data.freeUsedCount;
  return { used, limit: FREE_GLOBAL_LIMIT, remaining: Math.max(0, FREE_GLOBAL_LIMIT - used) };
}

export function consumeFreeUse(): boolean {
  const data = load();
  if (data.freeUsedCount >= FREE_GLOBAL_LIMIT) return false;
  data.freeUsedCount += 1;
  save(data);
  return true;
}

export function resetFreeUsage(): void {
  const data = load();
  data.freeUsedCount = 0;
  save(data);
}

export function setFreeLimit(newLimit: number): void {
  // Store override in env or just reset counter; for simplicity we reset
  // Actual limit change would need env var FREE_GLOBAL_LIMIT override
  resetFreeUsage();
}

// ── Usage Logs ───────────────────────────────────────

export function addUsageLog(log: Omit<UsageLog, "id" | "timestamp">): UsageLog {
  const data = load();
  const entry: UsageLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: utcNow(),
    ...log,
  };
  data.usageLogs.push(entry);

  // Keep max 500 logs to prevent file bloat
  if (data.usageLogs.length > 500) {
    data.usageLogs = data.usageLogs.slice(-500);
  }

  save(data);
  return entry;
}

export function getUsageLogs(limit = 50, offset = 0): { logs: UsageLog[]; total: number } {
  const data = load();
  const all = data.usageLogs.slice().reverse(); // newest first
  return {
    logs: all.slice(offset, offset + limit),
    total: all.length,
  };
}

// ── Sessions ─────────────────────────────────────────

export function createSession(payload: {
  role: Role;
  accessType: string;
  userId: string;
  userName?: string;
  ttlHours?: number;
}): AccessSession {
  const token = randomToken();
  const ttl = Math.max(1, payload.ttlHours ?? 24);
  const expiresAt = new Date(Date.now() + ttl * 3600_000).toISOString();

  const session: AccessSession = {
    token,
    role: payload.role,
    accessType: payload.accessType,
    activated: true,
    userId: payload.userId,
    userName: payload.userName ?? "",
    createdAt: utcNow(),
    expiresAt,
  };

  const data = load();
  data.accessSessions[token] = session;
  save(data);
  return session;
}

export function getSession(token: string): AccessSession | null {
  if (!token) return null;
  const data = load();
  const session = data.accessSessions[token];
  if (!session) return null;

  if (new Date() >= new Date(session.expiresAt)) {
    delete data.accessSessions[token];
    save(data);
    return null;
  }

  return session;
}

// ── Invite Codes ─────────────────────────────────────

export function consumeInviteCode(code: string): InviteCode | null {
  const key = code.trim().toUpperCase();
  if (!key) return null;

  const data = load();
  const item = data.inviteCodes.find((c) => c.code === key);
  if (!item || !item.isActive) return null;
  if (item.usedCount >= item.maxUses) {
    item.isActive = false;
    save(data);
    return null;
  }

  item.usedCount += 1;
  if (item.usedCount >= item.maxUses) item.isActive = false;
  save(data);
  return { ...item };
}

export function createInviteCode(createdBy: string, maxUses = 10, code?: string): InviteCode {
  const finalCode = code?.trim().toUpperCase() || `INV${randomToken().slice(0, 8).toUpperCase()}`;

  const data = load();
  const existing = data.inviteCodes.find((c) => c.code === finalCode);
  if (existing) throw new Error("邀请码已存在");

  const item: InviteCode = {
    code: finalCode,
    usedCount: 0,
    maxUses: Math.max(1, maxUses),
    isActive: true,
    createdBy,
    createdAt: utcNow(),
  };

  data.inviteCodes.push(item);
  save(data);
  return item;
}

export function listInviteCodes(): InviteCode[] {
  return load().inviteCodes;
}

export function updateInviteCodeQuota(
  code: string,
  maxUses: number,
  resetUsed = false
): InviteCode | null {
  const key = code.trim().toUpperCase();
  const data = load();
  const item = data.inviteCodes.find((c) => c.code === key);
  if (!item) return null;

  item.maxUses = Math.max(1, maxUses);
  if (resetUsed) item.usedCount = 0;

  // Auto-reactivate if quota increased above used count
  if (item.usedCount < item.maxUses) {
    item.isActive = true;
  } else {
    item.isActive = false;
  }

  save(data);
  return { ...item };
}

export function toggleInviteCodeActive(code: string, isActive: boolean): InviteCode | null {
  const key = code.trim().toUpperCase();
  const data = load();
  const item = data.inviteCodes.find((c) => c.code === key);
  if (!item) return null;

  item.isActive = isActive;
  save(data);
  return { ...item };
}

// ── Admin Validation ─────────────────────────────────

export function validateAdminUser(adminCode: string, birthDate: string): boolean {
  const expected = process.env.PILOT_ADMIN_CODE?.trim();
  const expectedBirth = process.env.PILOT_ADMIN_BIRTH_DATE?.trim();
  if (!expected || !expectedBirth) return false;
  return adminCode.trim() === expected && birthDate.trim() === expectedBirth;
}
