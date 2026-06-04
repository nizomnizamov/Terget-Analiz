import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { buildWeeklyReport, sendTelegramMessage } from "@/lib/services/telegram";

export const POST = withApiAuth(async () => {
  const message = await buildWeeklyReport();

  return NextResponse.json(await sendTelegramMessage(message));
});
