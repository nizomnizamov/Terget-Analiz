import { createHmac, timingSafeEqual } from "crypto";
import { cookies, headers } from "next/headers";
import { adminCredentials, users } from "@/lib/production-data";
import type { User } from "@/lib/types";

export const authCookieName = "targel_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;

type SessionPayload = {
  userId: string;
  expiresAt: number;
};

function sessionSecret() {
  return process.env.NEXTAUTH_SECRET ?? process.env.SESSION_SECRET ?? "targel-development-session-secret";
}

function signSessionPayload(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

function encodeSession(user: User) {
  const payload = Buffer.from(
    JSON.stringify({
      userId: user.id,
      expiresAt: Date.now() + sessionMaxAgeSeconds * 1000
    } satisfies SessionPayload),
    "utf8"
  ).toString("base64url");

  return `${payload}.${signSessionPayload(payload)}`;
}

function decodeSession(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const [payload, signature] = value.split(".");

    if (payload && signature) {
      if (!safeEqual(signSessionPayload(payload), signature)) {
        return null;
      }

      const session = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionPayload;

      if (!session.userId || session.expiresAt < Date.now()) {
        return null;
      }

      return { userId: session.userId };
    }

    return JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as { userId: string };
  } catch {
    return null;
  }
}

export function authenticate(email: string, password: string) {
  if (!adminCredentials.email || !adminCredentials.password) {
    return null;
  }

  if (email.toLowerCase() !== adminCredentials.email.toLowerCase() || password !== adminCredentials.password) {
    return null;
  }

  return users[0] ?? null;
}

export async function setSession(user: User) {
  const cookieStore = await cookies();
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "";
  const isLocalHost =
    host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]");

  cookieStore.set(authCookieName, encodeSession(user), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !isLocalHost,
    maxAge: sessionMaxAgeSeconds,
    path: "/"
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(authCookieName);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(authCookieName)?.value);

  if (!session) {
    return null;
  }

  return users.find((user) => user.id === session.userId) ?? null;
}
