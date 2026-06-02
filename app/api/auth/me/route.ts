import { NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api";
import { getCurrentUser } from "@/lib/auth";

export const GET = withApiErrorHandling(async () => {
  const user = await getCurrentUser();

  return NextResponse.json({ user });
});
