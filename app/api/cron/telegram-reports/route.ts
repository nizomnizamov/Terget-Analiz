import { NextRequest, NextResponse } from "next/server";
import { withApiErrorHandling } from "@/lib/api";
import {
  buildDailyReport,
  buildMonthlyReport,
  buildWeeklyReport,
  sendTelegramMessage,
  type TelegramReportPeriod
} from "@/lib/services/telegram";

const timeZone = "Asia/Tashkent";
const reportHour = 9;

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

function localParts(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    date: `${map.year}-${map.month}-${map.day}`,
    weekday: map.weekday,
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute)
  };
}

function forcedReports(request: NextRequest): TelegramReportPeriod[] | null {
  const force = request.nextUrl.searchParams.get("force");

  if (!force) {
    return null;
  }

  if (force === "all") {
    return ["daily", "weekly", "monthly"];
  }

  if (force === "daily" || force === "weekly" || force === "monthly") {
    return [force];
  }

  return [];
}

function dueReports(request: NextRequest): TelegramReportPeriod[] {
  const forced = forcedReports(request);

  if (forced) {
    return forced;
  }

  const now = localParts();

  if (now.hour !== reportHour) {
    return [];
  }

  const reports: TelegramReportPeriod[] = ["daily"];

  if (now.weekday === "Mon") {
    reports.push("weekly");
  }

  if (now.day === 1) {
    reports.push("monthly");
  }

  return reports;
}

async function buildReport(period: TelegramReportPeriod) {
  if (period === "weekly") {
    return buildWeeklyReport();
  }

  if (period === "monthly") {
    return buildMonthlyReport();
  }

  return buildDailyReport();
}

async function handle(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = dueReports(request);
  const now = localParts();

  if (!reports.length) {
    return NextResponse.json({
      ok: true,
      sent: false,
      reason: `Hisobot faqat ${reportHour}:00 da yuboriladi.`,
      timeZone,
      localTime: `${now.date} ${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}`
    });
  }

  const results = await Promise.all(
    reports.map(async (period) => ({
      period,
      result: await sendTelegramMessage(await buildReport(period))
    }))
  );

  return NextResponse.json({
    ok: results.every((item) => item.result.ok),
    sent: true,
    timeZone,
    localTime: `${now.date} ${String(now.hour).padStart(2, "0")}:${String(now.minute).padStart(2, "0")}`,
    reports: results
  });
}

export const GET = withApiErrorHandling((request: NextRequest) => handle(request));

export const POST = withApiErrorHandling((request: NextRequest) => handle(request));
