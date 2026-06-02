import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { buildMonthlyReport, sendTelegramMessage } from "@/lib/services/telegram";

export const POST = withApiAuth(async () => {
  const message = buildMonthlyReport();

  return NextResponse.json(await sendTelegramMessage(message));
});
