import type { DefaultSession } from "next-auth";
import type { Role } from "@/lib/auth/roles";

declare module "next-auth" {
  interface User {
    id: string;
    role: Role;
  }

  interface Session {
    user: {
      id: string;
      role: Role;
    } & DefaultSession["user"];
  }
}

declare module "@auth/core/jwt" {
  interface JWT {
    userId: string;
    role: Role;
  }
}
