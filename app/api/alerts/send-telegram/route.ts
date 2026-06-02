import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { markAlertsForTelegram } from "@/lib/services/alerts";
import { sendTelegramMessage } from "@/lib/services/telegram";

export const POST = withApiAuth(async (request: NextRequest) => {
  const queued = await markAlertsForTelegram(getRangeFromRequest(request), getReportScopeFromRequest(request));
  const result = await sendTelegramMessage(
    queued.alerts.map((alert) => `${alert.title}: ${alert.message}`).join("\n")
  );

  return NextResponse.json({ ...queued, telegram: result });
});
