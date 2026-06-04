import { NextResponse } from "next/server";
import { getRangeFromRequest, withApiAuth } from "@/lib/api";
import { getUnmatchedLeads } from "@/lib/services/matching";

export const GET = withApiAuth(async (request) => {
  return NextResponse.json({ leads: await getUnmatchedLeads(getRangeFromRequest(request)) });
});
