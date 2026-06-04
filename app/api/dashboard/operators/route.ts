import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { getManagerAnalytics } from "@/lib/analytics";

export const GET = withApiAuth(async (request: NextRequest) => {
  return NextResponse.json({
    managers: await getManagerAnalytics(getRangeFromRequest(request), getReportScopeFromRequest(request))
  });
});
