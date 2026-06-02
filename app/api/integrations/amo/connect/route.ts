import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { connectAmoAccount } from "@/lib/services/amo";

export const POST = withApiAuth(async () => {
  return NextResponse.json(await connectAmoAccount());
});
