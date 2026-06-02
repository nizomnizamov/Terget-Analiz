import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { checkAlerts } from "@/lib/services/alerts";

export const POST = withApiAuth(async (request: NextRequest) => {
  return NextResponse.json(await checkAlerts(getRangeFromRequest(request), getReportScopeFromRequest(request)));
});
