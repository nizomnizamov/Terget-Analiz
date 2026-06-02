import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { getLeadQualityAnalytics } from "@/lib/analytics";

export const GET = withApiAuth((request: NextRequest, user) => {
  return NextResponse.json({
    campaigns: getLeadQualityAnalytics(getRangeFromRequest(request), user, getReportScopeFromRequest(request))
  });
});
