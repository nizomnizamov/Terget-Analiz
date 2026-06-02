import { NextResponse } from "next/server";
import { z } from "zod";
import { withApiErrorHandling } from "@/lib/api";
import { authenticate, setSession } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const POST = withApiErrorHandling(async (request) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Kiritilgan ma'lumot noto'g'ri." }, { status: 400 });
  }

  const body = loginSchema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Email yoki parol noto'g'ri formatda." }, { status: 400 });
  }

  const user = authenticate(body.data.email, body.data.password);

  if (!user) {
    return NextResponse.json({ error: "Email yoki parol noto'g'ri." }, { status: 401 });
  }

  await setSession(user);

  return NextResponse.json({ user });
});
