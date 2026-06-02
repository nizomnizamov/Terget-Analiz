import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { getFacebookCampaigns } from "@/lib/services/facebook";

export const GET = withApiAuth(() => {
  return NextResponse.json({ campaigns: getFacebookCampaigns() });
});
