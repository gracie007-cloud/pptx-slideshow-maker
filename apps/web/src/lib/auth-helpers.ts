import { auth } from "@/lib/auth";

interface AuthUser {
  id: string;
  name: string;
  email: string;
}

/**
 * Get the currently authenticated user, or null if not logged in.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user?.id) {
    return null;
  }
  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
  };
}

/**
 * Get the currently authenticated user, or throw an error if not logged in.
 */
export async function requireAuth(): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}
