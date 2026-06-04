import { getDashboardOverview } from "@/lib/analytics";
import { getDateRange, type DateRangeInput } from "@/lib/date-range";
import { deactivateTelegramChatId, getTelegramChatIds } from "@/lib/integration-settings";

export type TelegramReportPeriod = "daily" | "weekly" | "monthly";
const configuredTelegramTimeoutMs = Number(process.env.TELEGRAM_TIMEOUT_MS ?? 10_000);
const telegramTimeoutMs = Number.isFinite(configuredTelegramTimeoutMs)
  ? configuredTelegramTimeoutMs
  : 10_000;

const reportConfig: Record<TelegramReportPeriod, { title: string; range: DateRangeInput }> = {
  daily: { title: "Kunlik hisobot", range: "today" },
  weekly: { title: "Haftalik hisobot", range: "last7" },
  monthly: { title: "Oylik hisobot", range: "thisMonth" }
};

function formatDate(value: string) {
  const [year, month, day] = value.split("-");

  return `${day}.${month}.${year}`;
}

function formatRange(range: DateRangeInput) {
  const { from, to } = getDateRange(range);

  return from === to ? formatDate(from) : `${formatDate(from)} - ${formatDate(to)}`;
}

export async function buildTelegramReport(period: TelegramReportPeriod, range = reportConfig[period].range) {
  const config = reportConfig[period];
  const overview = await getDashboardOverview(range);
  const metricValue = (key: string) => overview.metrics.find((item) => item.key === key)?.value ?? "-";

  return [
    `Touristan ${config.title}`,
    `Muddat: ${formatRange(range)}`,
    `Xarajat: ${metricValue("spend")}`,
    `Tushgan lidlar soni: ${metricValue("leads")}`,
    `Sotuv soni: ${metricValue("sales")}`
  ].join("\n");
}

export async function buildDailyReport(range: DateRangeInput = "today") {
  return buildTelegramReport("daily", range);
}

export async function buildWeeklyReport(range: DateRangeInput = "last7") {
  return buildTelegramReport("weekly", range);
}

export async function buildMonthlyReport(range: DateRangeInput = "thisMonth") {
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
