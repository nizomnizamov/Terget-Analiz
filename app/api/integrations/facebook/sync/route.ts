import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { syncFacebookData } from "@/lib/services/facebook";

export const POST = withApiAuth(async () => {
  return NextResponse.json(await syncFacebookData());
});
