import { auth } from "@/lib/auth";
import type { Session } from "next-auth";

export async function getCurrentUser(): Promise<Session["user"] | null> {
  const session = await auth();
  return session?.user ?? null;
}

export async function requireAuth(): Promise<Session["user"]> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Authentication required");
  }
  return user;
}

export async function requireAdmin(): Promise<Session["user"]> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Admin access required");
  }
  return user;
}
