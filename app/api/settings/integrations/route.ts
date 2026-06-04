import { NextResponse } from "next/server";
import { z } from "zod";
import { apiError, withApiAuth } from "@/lib/api";
import { saveIntegrationSettings } from "@/lib/integration-settings";

const integrationSchema = z.object({
  facebookAccountName: z.string().optional(),
  facebookAdAccountId: z.string().optional(),
  facebookAccessToken: z.string().optional(),
  amoSubdomain: z.string().optional(),
  amoAccessToken: z.string().optional(),
  amoRefreshToken: z.string().optional(),
  telegramChatIds: z.string().optional()
});

export const POST = withApiAuth(async (request) => {
  const parsed = integrationSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return apiError("Kiritilgan ma'lumotlar noto'g'ri.", 400);
  }

  const result = await saveIntegrationSettings(parsed.data);

  if (!result.ok) {
    const errorMessage =
      "error" in result && result.error ? result.error : "Sozlamani saqlab bo'lmadi.";

    return apiError(errorMessage, 400);
  }

  return NextResponse.json(result);
});
