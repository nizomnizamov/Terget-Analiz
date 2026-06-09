import { getAnalyticsData } from "@/lib/data-source";
import {
  addDays,
  getDateRange,
  getTodayDateKey,
  parseDateKey,
  toDateKey,
  type DateRangeInput
} from "@/lib/date-range";
import { deactivateTelegramChatId, getTelegramChatIds } from "@/lib/integration-settings";
import { formatCurrency, formatNumber } from "@/lib/utils";

export type TelegramReportPeriod = "daily" | "weekly" | "monthly";
const configuredTelegramTimeoutMs = Number(process.env.TELEGRAM_TIMEOUT_MS ?? 10_000);
const telegramTimeoutMs = Number.isFinite(configuredTelegramTimeoutMs)
  ? configuredTelegramTimeoutMs
  : 10_000;

const reportConfig: Record<TelegramReportPeriod, { title: string; range: DateRangeInput }> = {
  daily: { title: "kunlik hisobot", range: "yesterday" },
  weekly: { title: "haftalik hisobot", range: "last7" },
  monthly: { title: "oylik hisobot", range: "lastMonth" }
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-");

  return `${day}.${month}.${year}`;
}

function formatRange(range: DateRangeInput) {
  const { from, to } = getDateRange(range);

  return from === to ? formatDate(from) : `${formatDate(from)} - ${formatDate(to)}`;
}

function getPreviousWeekRange(now = new Date()): DateRangeInput {
  const today = parseDateKey(getTodayDateKey(now));
  const day = today.getUTCDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  const thisMonday = addDays(today, -daysSinceMonday);
  const previousMonday = addDays(thisMonday, -7);
  const previousSunday = addDays(thisMonday, -1);

  return {
    key: "custom",
    from: toDateKey(previousMonday),
    to: toDateKey(previousSunday)
  };
}

function getDefaultReportRange(period: TelegramReportPeriod) {
  return period === "weekly" ? getPreviousWeekRange() : reportConfig[period].range;
}

export async function buildTelegramReport(period: TelegramReportPeriod, range = getDefaultReportRange(period)) {
  const config = reportConfig[period];
  const data = await getAnalyticsData(range);
  const spend = data.facebookDailyStats.reduce((total, stat) => total + stat.spend, 0);
  const impressions = data.facebookDailyStats.reduce((total, stat) => total + stat.impressions, 0);
  const leads = data.facebookDailyStats.reduce((total, stat) => total + stat.leads, 0);
  const sales = data.sales.length;
  const activeCampaigns = data.facebookCampaigns.filter((campaign) => campaign.status === "ACTIVE").length;
  const currency = data.client.currency ?? "USD";

  return [
    `Astrum ${config.title}`,
    `Sana oralig'i: ${formatRange(range)}`,
    `Sarflangan mablag': ${formatCurrency(spend, currency)}`,
    `Ko'rishlar soni: ${formatNumber(impressions)}`,
    `Lidlar soni: ${formatNumber(leads)}`,
    `Sotuv soni: ${formatNumber(sales)}`,
    `Ishlayotgan reklamalar soni: ${formatNumber(activeCampaigns)}`
  ].join("\n");
}

export async function buildDailyReport(range: DateRangeInput = "yesterday") {
  return buildTelegramReport("daily", range);
}

export async function buildWeeklyReport(range: DateRangeInput = getPreviousWeekRange()) {
  return buildTelegramReport("weekly", range);
}

export async function buildMonthlyReport(range: DateRangeInput = "lastMonth") {
  return buildTelegramReport("monthly", range);
}

export async function sendTelegramMessage(message: string, chatIds?: string[]) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const recipients = chatIds ?? (await getTelegramChatIds());

  if (!token) {
    return {
      ok: false,
      provider: "telegram",
      recipients,
      message,
      error: "TELEGRAM_BOT_TOKEN sozlanmagan."
    };
  }

  if (!recipients.length) {
    return {
      ok: false,
      provider: "telegram",
      error: "TELEGRAM_CHAT_IDS yoki TELEGRAM_CHAT_ID sozlanmagan.",
      message
    };
  }

  const results = await Promise.all(
    recipients.map(async (chatId) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), telegramTimeoutMs);

      try {
        const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            chat_id: chatId,
            text: message,
            disable_web_page_preview: true
          })
        });

        return {
          chatId,
          ok: response.ok,
          status: response.status,
          body: await response.json().catch(() => null)
        };
      } catch (error) {
        return {
          chatId,
          ok: false,
          status: 0,
          body: {
            error: error instanceof Error ? error.message : "Telegram API javob bermadi."
          }
        };
      } finally {
        clearTimeout(timeout);
      }
    })
  );

  await Promise.all(
    results
      .filter((result) => {
        const description =
          typeof result.body === "object" && result.body && "description" in result.body
            ? String(result.body.description)
            : "";

        return result.status === 400 && description.toLowerCase().includes("chat not found");
      })
      .map((result) => deactivateTelegramChatId(result.chatId))
  );

  return {
    ok: results.every((result) => result.ok),
    provider: "telegram",
    recipients,
    results
  };
}
