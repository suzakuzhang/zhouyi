import fs from "fs";
import path from "path";
import type { Role } from "./roles";
import { ROLE_NORMAL } from "./roles";

const DATA_DIR = path.resolve(process.cwd());
const DATA_FILE = path.join(DATA_DIR, "access_data.json");

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

interface DataStore {
  accessSessions: Record<string, AccessSession>;
  inviteCodes: InviteCode[];
}

function load(): DataStore {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      return JSON.parse(raw);
    }
  } catch { /* ignore */ }
  return { accessSessions: {}, inviteCodes: [] };
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

export function createInviteCode(createdBy: string, maxUses = 10): InviteCode {
  const code = `INV${randomToken().slice(0, 8).toUpperCase()}`;
  const item: InviteCode = {
    code,
    usedCount: 0,
    maxUses: Math.max(1, maxUses),
    isActive: true,
    createdBy,
    createdAt: utcNow(),
  };

  const data = load();
  data.inviteCodes.push(item);
  save(data);
  return item;
}

export function listInviteCodes(): InviteCode[] {
  return load().inviteCodes;
}

export function validateAdminUser(adminCode: string, birthDate: string): boolean {
  const expected = process.env.PILOT_ADMIN_CODE?.trim();
  const expectedBirth = process.env.PILOT_ADMIN_BIRTH_DATE?.trim();
  if (!expected || !expectedBirth) return false;
  return adminCode.trim() === expected && birthDate.trim() === expectedBirth;
}
