import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, withApiAuth } from "@/lib/api";
import { getAmoLeads } from "@/lib/services/amo";

export const GET = withApiAuth((request: NextRequest) => {
  return NextResponse.json({ leads: getAmoLeads(getRangeFromRequest(request)) });
});
