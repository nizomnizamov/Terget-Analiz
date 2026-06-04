import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api";
import { saveTelegramChatId } from "@/lib/integration-settings";
import { sendTelegramMessage } from "@/lib/services/telegram";

type TelegramWebhookUpdate = {
  message?: {
    text?: string;
    chat?: {
      id?: number | string;
    };
  };
  my_chat_member?: {
    chat?: {
      id?: number | string;
    };
  };
};

export const POST = withApiErrorHandling(async (request) => {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;

  if (secret && request.headers.get("x-telegram-bot-api-secret-token") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let update: TelegramWebhookUpdate;

  try {
    update = await request.json() as TelegramWebhookUpdate;
  } catch {
    return NextResponse.json({ error: "Telegram webhook ma'lumoti noto'g'ri." }, { status: 400 });
  }
  const chatId = update.message?.chat?.id ?? update.my_chat_member?.chat?.id;
  const saved = chatId ? await saveTelegramChatId(String(chatId)) : false;

  if (saved && update.message?.text?.trim().startsWith("/start")) {
    await sendTelegramMessage(
      "Targel Analiz bot ulandi. Endi kunlik hisobotlar shu chatga yuboriladi.",
      [String(chatId)]
    );
  }

  return NextResponse.json({
    ok: true,
    provider: "telegram",
    received: Boolean(update),
    chatSaved: saved,
    message: "Telegram webhook qabul qilindi."
  });
});
