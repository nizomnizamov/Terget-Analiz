import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { getFunnelAnalytics } from "@/lib/analytics";

export const GET = withApiAuth((request: NextRequest, user) => {
  return NextResponse.json({
    funnel: getFunnelAnalytics(getRangeFromRequest(request), user, getReportScopeFromRequest(request))
  });
});
