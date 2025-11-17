// backend/src/utils/ssoRoleMapper.ts
import type { AuthUser } from './authMiddleware';

export type UserRole = AuthUser['role'];

type RoleMap = Record<UserRole, string[]>;

const ROLE_MAP: RoleMap = parseRoleMap(process.env.SSO_ROLE_MAP || '');
const DEFAULT_ROLE = normalizeRole(process.env.SSO_DEFAULT_ROLE) || 'USER';
const REQUIRED_GROUPS = parseGroupList(process.env.SSO_REQUIRED_GROUPS || '');

function normalizeRole(value?: string): UserRole | undefined {
  if (!value) return undefined;
  const upper = value.trim().toUpperCase();
  if (!upper) return undefined;
  return upper as UserRole;
}

function parseGroupList(value: string): string[] {
  if (!value) return [];
  return value
    .split(',')
    .map((group) => group.trim())
    .filter(Boolean);
}

function parseRoleMap(raw: string): RoleMap {
  const map: Partial<Record<UserRole, string[]>> = {};
  if (!raw) {
    return map as RoleMap;
  }

  raw.split(';').forEach((chunk) => {
    const [roleRaw, groupsRaw] = chunk.split('=');
    const role = normalizeRole(roleRaw);
    if (!role || !groupsRaw) {
      return;
    }
    const groups = parseGroupList(groupsRaw);
    if (groups.length) {
      map[role] = groups;
    }
  });
  return map as RoleMap;
}

export function resolveRoleFromGroups(groups: string[] = []): UserRole {
  const normalizedGroups = groups.map((group) => group.trim()).filter(Boolean);

  if (REQUIRED_GROUPS.length) {
    const hasRequired = REQUIRED_GROUPS.every((group) => normalizedGroups.includes(group));
    if (!hasRequired) {
      throw new Error('El usuario no pertenece a los grupos requeridos para ingresar.');
    }
  }

  for (const [role, allowedGroups] of Object.entries(ROLE_MAP)) {
    if (allowedGroups.some((group) => normalizedGroups.includes(group))) {
      return role as UserRole;
    }
  }

  return DEFAULT_ROLE;
}

export function describeRoleMapping(): Record<string, string[]> {
  return ROLE_MAP;
}
