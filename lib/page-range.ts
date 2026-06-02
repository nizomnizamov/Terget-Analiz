import type { DateRangeKey } from "@/lib/types";
import { isDateKey, isDateRangeKey, type DateRangeSelection } from "@/lib/date-range";

export type PageSearchParams = Promise<Record<string, string | string[] | undefined>>;

function getParam(params: Record<string, string | string[] | undefined>, key: string) {
  const value = params[key];

  return Array.isArray(value) ? value[0] : value;
}

export async function getPageRange(searchParams?: PageSearchParams): Promise<DateRangeSelection> {
  const params = searchParams ? await searchParams : {};
  const value = getParam(params, "range");
  const key: DateRangeKey = isDateRangeKey(value) ? value : "today";

  if (key === "custom") {
    return {
      key,
      from: isDateKey(getParam(params, "from")) ? getParam(params, "from") : undefined,
      to: isDateKey(getParam(params, "to")) ? getParam(params, "to") : undefined
    };
  }

  return { key };
}

export async function getPageAccountId(searchParams?: PageSearchParams) {
  const params = searchParams ? await searchParams : {};
  const accountId = getParam(params, "accountId");

  return accountId && accountId !== "all" ? accountId : undefined;
}
