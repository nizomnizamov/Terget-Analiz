import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { getFacebookAccounts } from "@/lib/services/facebook";

export const GET = withApiAuth(() => {
  return NextResponse.json({ accounts: getFacebookAccounts() });
});
