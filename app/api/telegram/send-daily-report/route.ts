import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { buildDailyReport, sendTelegramMessage } from "@/lib/services/telegram";

export const POST = withApiAuth(async () => {
  const message = buildDailyReport();

  return NextResponse.json(await sendTelegramMessage(message));
});
