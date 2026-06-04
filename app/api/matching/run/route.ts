import { NextResponse } from "next/server";
import { getRangeFromRequest, withApiAuth } from "@/lib/api";
import { runLeadMatching } from "@/lib/services/matching";

export const POST = withApiAuth(async (request) => {
  return NextResponse.json(await runLeadMatching(getRangeFromRequest(request)));
});
