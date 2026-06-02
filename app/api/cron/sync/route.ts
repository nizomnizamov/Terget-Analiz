import { NextRequest, NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api";
import { checkAlerts } from "@/lib/services/alerts";
import { syncAmoData } from "@/lib/services/amo";
import { syncFacebookData } from "@/lib/services/facebook";

export const POST = withApiErrorHandling(async (request: NextRequest) => {
  const secret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (secret && authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [facebook, amo, alerts] = await Promise.all([
    syncFacebookData(),
    syncAmoData(),
    checkAlerts("last30")
  ]);

  return NextResponse.json({ ok: true, facebook, amo, alerts });
});
