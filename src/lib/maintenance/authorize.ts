import type { Role } from "@/lib/auth/roles";

export type MaintenanceUpdateAuthorization =
  | { allowed: true; scope: "full" }
  | { allowed: true; scope: "self" }
  | { allowed: false };

/**
 * Admins may change any field on any record. A technician may only update
 * a record currently assigned to them, and only through the restricted
 * "self" field set (status/completedDate/notes) enforced by the caller's
 * choice of Zod schema — see REQUIREMENTS.md section 4.
 */
export function authorizeMaintenanceUpdate(
  user: { id: string; role: Role },
  record: { technicianId: string | null },
): MaintenanceUpdateAuthorization {
  if (user.role === "admin") {
    return { allowed: true, scope: "full" };
  }
  if (user.role === "technician" && record.technicianId === user.id) {
    return { allowed: true, scope: "self" };
  }
  return { allowed: false };
}
