import { NextRequest, NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api";
import { checkAndSendBillingLimitAlert } from "@/lib/services/alerts";

function isAuthorized(request: NextRequest) {
  const secret = process.env.CRON_SECRET;

  if (!secret) {
    return true;
  }

  return (
    request.headers.get("authorization") === `Bearer ${secret}` ||
    request.nextUrl.searchParams.get("secret") === secret
  );
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await checkAndSendBillingLimitAlert());
}

export const GET = withApiErrorHandling((request: NextRequest) => handle(request));

export const POST = withApiErrorHandling((request: NextRequest) => handle(request));
