import type { DefaultSession } from "next-auth";
import type { Role } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      role: Role;
    } & DefaultSession["user"];
  }

  interface User {
    role: Role;
  }
}

export interface JWTWithRole {
  role?: Role;
  name?: string | null;
  email?: string | null;
  picture?: string | null;
  sub?: string;
  [key: string]: unknown;
}
