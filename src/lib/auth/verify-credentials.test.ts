import bcrypt from "bcryptjs";
import { verifyCredentials, type CredentialUserRecord } from "./verify-credentials";

describe("verifyCredentials", () => {
  const password = "correct-password";
  let activeUser: CredentialUserRecord;

  beforeAll(async () => {
    const passwordHash = await bcrypt.hash(password, 10);
    activeUser = {
      id: "user-1",
      name: "Alex Technician",
      email: "alex@example.com",
      passwordHash,
      role: "technician",
      isActive: true,
    };
  });

  it("returns the authenticated user when the password matches an active user", async () => {
    // Arrange
    const user = activeUser;

    // Act
    const result = await verifyCredentials(user, password);

    // Assert
    expect(result).toEqual({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    });
  });

  it("returns null when the password does not match", async () => {
    // Arrange
    const user = activeUser;

    // Act
    const result = await verifyCredentials(user, "wrong-password");

    // Assert
    expect(result).toBeNull();
  });

  it("returns null when the user is inactive, even with the correct password", async () => {
    // Arrange
    const inactiveUser: CredentialUserRecord = { ...activeUser, isActive: false };

    // Act
    const result = await verifyCredentials(inactiveUser, password);

    // Assert
    expect(result).toBeNull();
  });

  it("returns null when no user record is found", async () => {
    // Arrange
    const user = undefined;

    // Act
    const result = await verifyCredentials(user, password);

    // Assert
    expect(result).toBeNull();
  });
});
