import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { getCampaignPerformance } from "@/lib/analytics";

export const GET = withApiAuth((request: NextRequest, user) => {
  return NextResponse.json({
    campaigns: getCampaignPerformance(getRangeFromRequest(request), user, getReportScopeFromRequest(request))
  });
});
