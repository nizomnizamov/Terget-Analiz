import { NextResponse } from "next/server";
import { withApiAuth } from "@/lib/api";
import { getAmoPipelines } from "@/lib/services/amo";

export const GET = withApiAuth(() => {
  return NextResponse.json({ pipelines: getAmoPipelines() });
});
