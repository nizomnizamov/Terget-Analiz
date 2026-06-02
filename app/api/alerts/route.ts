import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { getGeneratedAlerts } from "@/lib/analytics";

export const GET = withApiAuth((request: NextRequest, user) => {
  return NextResponse.json({
    alerts: getGeneratedAlerts(getRangeFromRequest(request), user, getReportScopeFromRequest(request))
  });
});
