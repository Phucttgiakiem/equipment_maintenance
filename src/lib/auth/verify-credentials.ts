import bcrypt from "bcryptjs";
import type { Role } from "./roles";

export type CredentialUserRecord = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  isActive: boolean;
};

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

/**
 * Validates a plaintext password against a looked-up user record. Rejects
 * missing/inactive users before touching bcrypt so disabled accounts can't
 * be used to probe password hashes.
 */
export async function verifyCredentials(
  user: CredentialUserRecord | undefined | null,
  password: string,
): Promise<AuthenticatedUser | null> {
  if (!user || !user.isActive) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  return { id: user.id, name: user.name, email: user.email, role: user.role };
}
