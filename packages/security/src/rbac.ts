export type Role = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";
export type Permission =
  | "CREATE"
  | "READ"
  | "UPDATE"
  | "DELETE"
  | "MANAGE_USERS"
  | "MANAGE_AGENTS"
  | "MANAGE_SETTINGS"
  | "VIEW_ANALYTICS"
  | "MANAGE_BILLING";

export interface UserRoleInfo {
  role: Role;
  permissions: Permission[];
}

const rolePermissions: Record<Role, Permission[]> = {
  OWNER: [
    "CREATE",
    "READ",
    "UPDATE",
    "DELETE",
    "MANAGE_USERS",
    "MANAGE_AGENTS",
    "MANAGE_SETTINGS",
    "VIEW_ANALYTICS",
    "MANAGE_BILLING",
  ],
  ADMIN: [
    "CREATE",
    "READ",
    "UPDATE",
    "DELETE",
    "MANAGE_USERS",
    "MANAGE_AGENTS",
    "VIEW_ANALYTICS",
  ],
  MEMBER: ["CREATE", "READ", "UPDATE"],
  VIEWER: ["READ"],
};

export const rbac = {
  getRolePermissions(role: Role): Permission[] {
    return rolePermissions[role] || [];
  },

  hasPermission(permissions: Permission[], required: Permission): boolean {
    return permissions.includes(required);
  },

  hasAnyPermission(permissions: Permission[], required: Permission[]): boolean {
    return required.some((p) => permissions.includes(p));
  },

  hasAllPermissions(
    permissions: Permission[],
    required: Permission[],
  ): boolean {
    return required.every((p) => permissions.includes(p));
  },

  canAccessRole(userRole: Role, requiredRole: Role): boolean {
    const roleHierarchy: Record<Role, number> = {
      OWNER: 4,
      ADMIN: 3,
      MEMBER: 2,
      VIEWER: 1,
    };
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  },

  getUserRoleInfo(role: Role, customPermissions?: Permission[]): UserRoleInfo {
    const basePermissions = rolePermissions[role] || [];
    const allPermissions = customPermissions
      ? [...new Set([...basePermissions, ...customPermissions])]
      : basePermissions;

    return {
      role,
      permissions: allPermissions,
    };
  },
};

export const requirePermission = (permission: Permission) => {
  return (permissions: Permission[]): boolean => {
    return rbac.hasPermission(permissions, permission);
  };
};

export const requireRole = (role: Role) => {
  return (userRole: Role): boolean => {
    return rbac.canAccessRole(userRole, role);
  };
};

export const PERMISSIONS = {
  REMINDERS: {
    CREATE: ["CREATE"],
    READ: ["READ"],
    UPDATE: ["UPDATE"],
    DELETE: ["DELETE"],
  },
  DOCUMENTS: {
    CREATE: ["CREATE"],
    READ: ["READ"],
    UPDATE: ["UPDATE"],
    DELETE: ["DELETE"],
  },
  CALENDAR: {
    CREATE: ["CREATE"],
    READ: ["READ"],
    UPDATE: ["UPDATE"],
    DELETE: ["DELETE"],
  },
  ADMIN: {
    MANAGE_USERS: ["MANAGE_USERS"],
    MANAGE_AGENTS: ["MANAGE_AGENTS"],
    MANAGE_SETTINGS: ["MANAGE_SETTINGS"],
    VIEW_ANALYTICS: ["VIEW_ANALYTICS"],
    MANAGE_BILLING: ["MANAGE_BILLING"],
  },
} as const;

export default rbac;
