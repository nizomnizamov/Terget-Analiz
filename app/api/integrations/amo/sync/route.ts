import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { syncAmoData } from "@/lib/services/amo";

export const POST = withApiAuth(async () => {
  return NextResponse.json(await syncAmoData());
});
