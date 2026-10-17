// Enterprise Permission & Access Control System
// Defines Owner, Boss, and Agent access levels

export type UserRole = "owner" | "boss" | "agent" | "guest";

export type Permission =
  | "view_code"
  | "edit_code"
  | "create_pr"
  | "approve_pr"
  | "merge_pr"
  | "approve_changes"
  | "view_meetings"
  | "create_meetings"
  | "approve_decisions"
  | "override_decisions"
  | "manage_agents"
  | "view_audit_log"
  | "manage_permissions";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  permissions: Permission[];
  isActive: boolean;
  createdAt: Date;
  lastLogin?: Date;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  resource: string;
  timestamp: Date;
  details: Record<string, unknown>;
  status: "success" | "failed" | "unauthorized";
}

// Default Permission Mappings
const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  owner: [
    "view_code",
    "view_meetings",
    "create_meetings",
    "approve_pr",
    "merge_pr",
    "override_decisions",
    "approve_decisions",
    "view_audit_log",
    "manage_permissions",
  ],
  boss: [
    "view_code",
    "view_meetings",
    "create_meetings",
    "create_pr",
    "approve_changes",
    "approve_decisions",
    "view_audit_log",
  ],
  agent: ["view_code", "edit_code", "create_pr", "view_meetings"],
  guest: ["view_code", "view_meetings"],
};

export class PermissionSystem {
  private users: Map<string, User> = new Map();
  private auditLogs: AuditLog[] = [];
  private currentUser: User | null = null;

  /**
   * Register a new user
   */
  registerUser(id: string, name: string, role: UserRole): User {
    const user: User = {
      id,
      name,
      role,
      permissions: ROLE_PERMISSIONS[role],
      isActive: true,
      createdAt: new Date(),
    };

    this.users.set(id, user);
    this.log(id, "USER_REGISTERED", "user", { role });
    console.log(`[Permissions] User registered: ${name} (${role})`);

    return user;
  }

  /**
   * Set current user context
   */
  setCurrentUser(userId: string): boolean {
    const user = this.users.get(userId);
    if (!user) {
      console.error(`[Permissions] User not found: ${userId}`);
      return false;
    }

    if (!user.isActive) {
      console.error(`[Permissions] User is inactive: ${userId}`);
      return false;
    }

    this.currentUser = user;
    user.lastLogin = new Date();
    this.log(userId, "USER_LOGIN", "session", {});
    console.log(
      `[Permissions] Current user set to: ${user.name} (${user.role})`,
    );

    return true;
  }

  /**
   * Check if current user has permission
   */
  hasPermission(permission: Permission): boolean {
    if (!this.currentUser) {
      console.warn("[Permissions] No current user set");
      return false;
    }

    const allowed = this.currentUser.permissions.includes(permission);
    const status = allowed ? "allowed" : "denied";
    this.log(
      this.currentUser.id,
      "PERMISSION_CHECK",
      "permission",
      {
        permission,
        result: status,
      },
      allowed ? "success" : "unauthorized",
    );

    return allowed;
  }

  /**
   * Check multiple permissions (requires all)
   */
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every((p) => this.hasPermission(p));
  }

  /**
   * Check multiple permissions (requires any)
   */
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some((p) => this.hasPermission(p));
  }

  /**
   * Enforce permission (throws if denied)
   */
  enforcePermission(permission: Permission): void {
    if (!this.hasPermission(permission)) {
      this.log(
        this.currentUser?.id || "unknown",
        "PERMISSION_DENIED",
        "permission",
        { required: permission },
        "failed",
      );
      throw new Error(`Permission denied: ${permission}`);
    }
  }

  /**
   * Get specific role permissions
   */
  getRolePermissions(role: UserRole): Permission[] {
    return ROLE_PERMISSIONS[role];
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return this.currentUser;
  }

  /**
   * Get user by ID
   */
  getUser(userId: string): User | null {
    return this.users.get(userId) || null;
  }

  /**
   * Update user role (only owner can do this)
   */
  updateUserRole(targetUserId: string, newRole: UserRole): boolean {
    this.enforcePermission("manage_permissions");

    const user = this.users.get(targetUserId);
    if (!user) {
      console.error(`[Permissions] User not found: ${targetUserId}`);
      return false;
    }

    const oldRole = user.role;
    user.role = newRole;
    user.permissions = ROLE_PERMISSIONS[newRole];

    this.log(this.currentUser?.id || "unknown", "ROLE_UPDATED", "user", {
      userId: targetUserId,
      oldRole,
      newRole,
    });

    console.log(
      `[Permissions] User role updated: ${user.name} (${oldRole} → ${newRole})`,
    );
    return true;
  }

  /**
   * Deactivate user
   */
  deactivateUser(userId: string): boolean {
    this.enforcePermission("manage_permissions");

    const user = this.users.get(userId);
    if (!user) {
      console.error(`[Permissions] User not found: ${userId}`);
      return false;
    }

    user.isActive = false;
    this.log(this.currentUser?.id || "unknown", "USER_DEACTIVATED", "user", {
      userId,
    });
    console.log(`[Permissions] User deactivated: ${user.name}`);

    return true;
  }

  /**
   * Code modification check (Agent/Boss only)
   */
  canModifyCode(): boolean {
    if (!this.currentUser) return false;
    return ["agent", "boss"].includes(this.currentUser.role);
  }

  /**
   * PR approval check (Owner/Boss)
   */
  canApprovePR(): boolean {
    if (!this.currentUser) return false;
    return ["owner", "boss"].includes(this.currentUser.role);
  }

  /**
   * PR merge check (Owner only)
   */
  canMergePR(): boolean {
    return this.hasPermission("merge_pr");
  }

  /**
   * Decision approval check (Owner/Boss)
   */
  canApproveDecision(): boolean {
    return this.hasPermission("approve_decisions");
  }

  /**
   * Log action for audit trail
   */
  private log(
    userId: string,
    action: string,
    resource: string,
    details: Record<string, unknown>,
    status: "success" | "failed" | "unauthorized" = "success",
  ): void {
    const log: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      action,
      resource,
      timestamp: new Date(),
      details,
      status,
    };

    this.auditLogs.push(log);

    // Keep only last 10000 logs in memory
    if (this.auditLogs.length > 10000) {
      this.auditLogs = this.auditLogs.slice(-10000);
    }
  }

  /**
   * Get audit logs
   */
  getAuditLogs(filters?: {
    userId?: string;
    action?: string;
    status?: string;
    limit?: number;
  }): AuditLog[] {
    this.enforcePermission("view_audit_log");

    let logs = [...this.auditLogs];

    if (filters?.userId) {
      logs = logs.filter((l) => l.userId === filters.userId);
    }

    if (filters?.action) {
      logs = logs.filter((l) => l.action === filters.action);
    }

    if (filters?.status) {
      logs = logs.filter((l) => l.status === filters.status);
    }

    const limit = filters?.limit || 100;
    return logs.slice(-limit).reverse();
  }

  /**
   * Export audit logs
   */
  exportAuditLogs(format: "json" | "csv" = "json"): string {
    this.enforcePermission("view_audit_log");

    if (format === "json") {
      return JSON.stringify(this.auditLogs, null, 2);
    }

    // CSV format
    const headers = ["Timestamp", "User", "Action", "Resource", "Status"];
    const rows = this.auditLogs.map((log) => [
      log.timestamp.toISOString(),
      log.userId,
      log.action,
      log.resource,
      log.status,
    ]);

    return [
      headers.join(","),
      ...rows.map((r) => r.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");
  }

  /**
   * Get system diagnostics
   */
  getDiagnostics(): {
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<UserRole, number>;
    recentActions: number;
  } {
    const activeUsers = Array.from(this.users.values()).filter(
      (u) => u.isActive,
    ).length;
    const usersByRole: Record<UserRole, number> = {
      owner: 0,
      boss: 0,
      agent: 0,
      guest: 0,
    };

    this.users.forEach((user) => {
      usersByRole[user.role]++;
    });

    return {
      totalUsers: this.users.size,
      activeUsers,
      usersByRole,
      recentActions: this.auditLogs.length,
    };
  }
}

export default PermissionSystem;
