import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

const COOKIE = "cm_session";

if (process.env.NODE_ENV === "production" && !process.env.AUTH_SECRET) {
  throw new Error(
    "AUTH_SECRET must be set in production. Generate one with: openssl rand -base64 32",
  );
}

const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "insecure-dev-secret-change-me-please-32ch",
);

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);

  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

/** Returns the logged-in user (without passwordHash) or null. */
export async function getCurrentUser() {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const userId = payload.sub as string | undefined;
    if (!userId) return null;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;
    const { passwordHash: _omit, ...safe } = user;
    return safe;
  } catch {
    return null;
  }
}

export type SafeUser = NonNullable<Awaited<ReturnType<typeof getCurrentUser>>>;
