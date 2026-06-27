// lib/session.ts
import { cookies } from "next/headers";
import { verifyToken, type SessionPayload } from "./auth";

const COOKIE_NAME = "workflow_token";

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export { COOKIE_NAME };