export type Role = "admin" | "technician";

export function hasRequiredRole(
  role: Role | undefined | null,
  allowed: Role[],
): boolean {
  return !!role && allowed.includes(role);
}
