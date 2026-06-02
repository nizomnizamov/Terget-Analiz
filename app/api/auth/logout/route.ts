import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api";
import { clearSession } from "@/lib/auth";

export const POST = withApiErrorHandling(async () => {
  await clearSession();

  return NextResponse.json({ ok: true });
});
