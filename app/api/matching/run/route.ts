import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { runLeadMatching } from "@/lib/services/matching";

export const POST = withApiAuth(async () => {
  return NextResponse.json(await runLeadMatching());
});
