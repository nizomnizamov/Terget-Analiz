import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, getReportScopeFromRequest, withApiAuth } from "@/lib/api";
import { getDashboardOverview } from "@/lib/analytics";

export const GET = withApiAuth((request: NextRequest, user) => {
  return NextResponse.json(getDashboardOverview(getRangeFromRequest(request), user, getReportScopeFromRequest(request)));
});
