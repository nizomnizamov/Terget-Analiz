import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import type { DateRangeKey } from "@/lib/types";
import { isDateKey, isDateRangeKey, type DateRangeSelection } from "@/lib/date-range";
import type { User } from "@/lib/types";

type ApiHandler = (request: NextRequest) => Promise<Response> | Response;
type AuthedApiHandler = (request: NextRequest, user: User) => Promise<Response> | Response;

function withNoStore(response: Response) {
  response.headers.set("Cache-Control", "no-store");

  return response;
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function withApiErrorHandling(handler: ApiHandler) {
  return async function apiRoute(request: NextRequest) {
    try {
      return withNoStore(await handler(request));
    } catch (error) {
      console.error("[api]", error);

      return withNoStore(
        NextResponse.json(
          { error: "Ichki xatolik yuz berdi. Iltimos, qayta urinib ko'ring." },
          { status: 500 }
        )
      );
    }
  };
}

export function withApiAuth(handler: AuthedApiHandler) {
  return withApiErrorHandling(async (request) => {
    const user = await getCurrentUser();

    if (!user) {
      return apiError("Avval tizimga kiring.", 401);
    }

    return handler(request, user);
  });
}

export function getRangeFromRequest(request: NextRequest): DateRangeSelection {
  const value = request.nextUrl.searchParams.get("range");
  const key: DateRangeKey = isDateRangeKey(value) ? value : "today";

  if (key === "custom") {
    const from = request.nextUrl.searchParams.get("from");
    const to = request.nextUrl.searchParams.get("to");

    return {
      key,
      from: isDateKey(from) ? from : undefined,
      to: isDateKey(to) ? to : undefined
    };
  }

  return { key };
}

export function getReportScopeFromRequest(request: NextRequest) {
  const facebookAccountId = request.nextUrl.searchParams.get("accountId");

  return facebookAccountId && facebookAccountId !== "all" ? { facebookAccountId } : undefined;
}
