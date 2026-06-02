import type { DateRangeKey } from "@/lib/types";

const dayMs = 24 * 60 * 60 * 1000;
export const appTimeZone = "Asia/Tashkent";

export const dateRangeOptions: { label: string; value: DateRangeKey }[] = [
  { label: "Bugun", value: "today" },
  { label: "Kecha", value: "yesterday" },
  { label: "Oxirgi 7 kun", value: "last7" },
  { label: "Oxirgi 30 kun", value: "last30" },
  { label: "Shu oy", value: "thisMonth" },
  { label: "O'tgan oy", value: "lastMonth" },
  { label: "Qo'lda tanlash", value: "custom" }
];

export type DateRangeSelection = {
  key: DateRangeKey;
  from?: string;
  to?: string;
};

export type DateRangeInput = DateRangeKey | DateRangeSelection;

export const rangeKeys = dateRangeOptions.map((option) => option.value);

export function isDateRangeKey(value?: string | null): value is DateRangeKey {
  return rangeKeys.includes(value as DateRangeKey);
}

export function isDateKey(value?: string | null): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function rangeToQuery(input: DateRangeSelection) {
  const params = new URLSearchParams();
  params.set("range", input.key);

  if (input.key === "custom") {
    if (isDateKey(input.from)) {
      params.set("from", input.from);
    }

    if (isDateKey(input.to)) {
      params.set("to", input.to);
    }
  }

  return params.toString();
}

export function toDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function getDateKeyInTimeZone(date = new Date(), timeZone = appTimeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return `${map.year}-${map.month}-${map.day}`;
}

export function getTodayDateKey(now = new Date()) {
  return getDateKeyInTimeZone(now, appTimeZone);
}

export function parseDateKey(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function addDays(date: Date, amount: number) {
  return new Date(date.getTime() + amount * dayMs);
}

export function getDateRange(
  input: DateRangeInput = "today",
  now = new Date()
) {
  const key = typeof input === "string" ? input : input.key;
  const today = parseDateKey(getTodayDateKey(now));

  if (key === "custom") {
    const fallback = toDateKey(today);
    const from = typeof input === "string" || !isDateKey(input.from) ? fallback : input.from;
    const to = typeof input === "string" || !isDateKey(input.to) ? from : input.to;

    return from <= to ? { from, to } : { from: to, to: from };
  }

  if (key === "today") {
    return { from: toDateKey(today), to: toDateKey(today) };
  }

  if (key === "yesterday") {
    const yesterday = addDays(today, -1);
    return { from: toDateKey(yesterday), to: toDateKey(yesterday) };
  }

  if (key === "last7") {
    return { from: toDateKey(addDays(today, -6)), to: toDateKey(today) };
  }

  if (key === "thisMonth") {
    return {
      from: toDateKey(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1))),
      to: toDateKey(today)
    };
  }

  if (key === "lastMonth") {
    const firstThisMonth = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    const lastMonthEnd = addDays(firstThisMonth, -1);
    const lastMonthStart = new Date(
      Date.UTC(lastMonthEnd.getUTCFullYear(), lastMonthEnd.getUTCMonth(), 1)
    );

    return { from: toDateKey(lastMonthStart), to: toDateKey(lastMonthEnd) };
  }

  return { from: toDateKey(addDays(today, -29)), to: toDateKey(today) };
}

export function isWithinDateRange(date: string, from: string, to: string) {
  return date >= from && date <= to;
}
