import { NextResponse, type NextRequest } from "next/server";
import { getRangeFromRequest, withApiAuth } from "@/lib/api";
import { getAmoLeads } from "@/lib/services/amo";

export const GET = withApiAuth(async (request: NextRequest) => {
  return NextResponse.json({ leads: await getAmoLeads(getRangeFromRequest(request)) });
});
