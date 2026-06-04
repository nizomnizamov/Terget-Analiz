import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { getFacebookAccounts } from "@/lib/services/facebook";

export const GET = withApiAuth(async () => {
  return NextResponse.json({ accounts: await getFacebookAccounts() });
});
