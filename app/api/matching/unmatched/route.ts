import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { getUnmatchedLeads } from "@/lib/services/matching";

export const GET = withApiAuth(() => {
  return NextResponse.json({ leads: getUnmatchedLeads() });
});
