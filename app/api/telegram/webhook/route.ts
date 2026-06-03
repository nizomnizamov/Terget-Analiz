import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api";

export const POST = withApiErrorHandling(async (request) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: unknown;

  try {
    update = await request.json();
  } catch {
    return NextResponse.json({ error: "Telegram webhook ma'lumoti noto'g'ri." }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    provider: "telegram",
    received: Boolean(update),
    message: "Telegram webhook qabul qilindi."
  });
});
