import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { withApiAuth } from "@/lib/api";
import { manualMatchLead } from "@/lib/services/matching";

const schema = z.object({
  leadId: z.string().min(1),
  campaignId: z.string().min(1)
});

export const POST = withApiAuth(async (request: NextRequest) => {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Kiritilgan ma'lumot noto'g'ri." }, { status: 400 });
  }

  const body = schema.safeParse(payload);

  if (!body.success) {
    return NextResponse.json({ error: "Lid va reklama kerak." }, { status: 400 });
  }

  return NextResponse.json(await manualMatchLead(body.data.leadId, body.data.campaignId));
});
