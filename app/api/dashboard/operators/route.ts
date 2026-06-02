import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { getManagerAnalytics } from "@/lib/analytics";

export const GET = withApiAuth((request: NextRequest) => {
  return NextResponse.json({
    managers: getManagerAnalytics(getRangeFromRequest(request), getReportScopeFromRequest(request))
  });
});
