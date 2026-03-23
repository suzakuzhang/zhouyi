export const ROLE_NORMAL = "normal" as const;
export const ROLE_INVITE = "invite" as const;
export const ROLE_PILOT = "pilot" as const;
export const ROLE_ADMIN = "admin" as const;

export type Role = typeof ROLE_NORMAL | typeof ROLE_INVITE | typeof ROLE_PILOT | typeof ROLE_ADMIN;

export interface Capabilities {
  canCast: boolean;
  canInterpret: boolean;     // LLM Layer 4
  canSpirit: boolean;        // 卦灵 (Phase 3)
  canHistory: boolean;
  canStyleProfile: boolean;
  canCreateInviteCodes: boolean;
  isAdmin: boolean;
}

const SPIRIT_ALLOWED: Set<Role> = new Set([ROLE_INVITE, ROLE_PILOT, ROLE_ADMIN]);
const INTERPRET_ALLOWED: Set<Role> = new Set([ROLE_INVITE, ROLE_PILOT, ROLE_ADMIN]);
const HISTORY_ALLOWED: Set<Role> = new Set([ROLE_PILOT, ROLE_ADMIN]);
const STYLE_ALLOWED: Set<Role> = new Set([ROLE_PILOT, ROLE_ADMIN]);
const INVITE_CREATE_ALLOWED: Set<Role> = new Set([ROLE_PILOT, ROLE_ADMIN]);

export function getCapabilities(role: Role): Capabilities {
  return {
    canCast: true,
    canInterpret: INTERPRET_ALLOWED.has(role),
    canSpirit: SPIRIT_ALLOWED.has(role),
    canHistory: HISTORY_ALLOWED.has(role),
    canStyleProfile: STYLE_ALLOWED.has(role),
    canCreateInviteCodes: INVITE_CREATE_ALLOWED.has(role),
    isAdmin: role === ROLE_ADMIN,
  };
}
