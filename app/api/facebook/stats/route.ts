import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { getFacebookStats } from "@/lib/services/facebook";

export const GET = withApiAuth((request: NextRequest) => {
  return NextResponse.json({ stats: getFacebookStats(getRangeFromRequest(request), getReportScopeFromRequest(request)) });
});
