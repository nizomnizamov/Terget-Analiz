import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { getAmoStatuses } from "@/lib/services/amo";

export const GET = withApiAuth(async () => {
  return NextResponse.json({ statuses: await getAmoStatuses() });
});
