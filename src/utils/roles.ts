import type { AdminRole } from "../types";

const ROLE_LEVEL: Record<AdminRole, number> = {
  moderator: 1,
  admin: 2,
  super_admin: 3,
};

const VALID_ROLES: AdminRole[] = ["super_admin", "admin", "moderator"];

/**
 * userRole이 requiredRole 이상의 권한을 가지는지 확인
 */
export function hasMinRole(userRole: AdminRole, requiredRole: AdminRole): boolean {
  return ROLE_LEVEL[userRole] >= ROLE_LEVEL[requiredRole];
}

/**
 * 역할 한글 라벨
 */
export function getRoleLabel(role: AdminRole): string {
  const labels: Record<AdminRole, string> = {
    super_admin: "슈퍼 관리자",
    admin: "관리자",
    moderator: "모더레이터",
  };
  return labels[role] ?? role;
}

/**
 * 문자열이 유효한 AdminRole인지 검증하고, 아니면 moderator 반환
 */
export function toSafeRole(value: unknown): AdminRole {
  if (typeof value === "string" && VALID_ROLES.includes(value as AdminRole)) {
    return value as AdminRole;
  }
  return "moderator";
}
