import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import { users } from "./schema";

async function seed() {
  const passwordHash = await bcrypt.hash("password123", 10);

  await db
    .insert(users)
    .values([
      {
        name: "Admin User",
        email: "admin@example.com",
        passwordHash,
        role: "admin",
      },
      {
        name: "Alex Technician",
        email: "alex@example.com",
        passwordHash,
        role: "technician",
      },
      {
        name: "Sam Technician",
        email: "sam@example.com",
        passwordHash,
        role: "technician",
      },
    ])
    .onConflictDoNothing({ target: users.email });

  console.log("Seed complete. Demo password for all users: password123");
  process.exit(0);
}

seed().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
