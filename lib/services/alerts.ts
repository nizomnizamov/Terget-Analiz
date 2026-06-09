import { getGeneratedAlerts } from "@/lib/analytics";
import type { DateRangeInput } from "@/lib/date-range";
import { getPrisma } from "@/lib/prisma";
import { client } from "@/lib/production-data";
import { getFacebookBillingStatus } from "@/lib/services/facebook";
import { sendTelegramMessage } from "@/lib/services/telegram";
import type { ReportScope } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

export async function checkAlerts(range: DateRangeInput = "today", scope?: ReportScope) {
  return {
    ok: true,
    alerts: await getGeneratedAlerts(range, null, scope),
    log: {
      status: "success",
      integrationType: "alerts",
      message: "Ogohlantirishlar real metrikalar asosida tekshirildi.",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  };
}

export async function markAlertsForTelegram(range: DateRangeInput = "today", scope?: ReportScope) {
  const alerts = (await getGeneratedAlerts(range, null, scope)).filter((alert) => !alert.isSent);

  return {
    ok: true,
    queued: alerts.length,
    alerts
  };
}

export async function checkAndSendBillingLimitAlert() {
  const status = await getFacebookBillingStatus().catch((error) => ({
    ok: false,
    accountName: "Meta Ads",
    balance: null,
    limit: null,
    warnBefore: null,
    remaining: null,
    shouldWarn: false,
    message: error instanceof Error ? error.message : "Meta Ads billing holatini olib bo'lmadi."
  }));

  if (!status.ok || !status.shouldWarn || !status.balance || !status.limit || status.remaining === null) {
    return {
      ok: true,
      sent: false,
      billing: status
    };
  }

  const prisma = getPrisma();
  const alertType = "meta_billing_limit";
  const recentWindow = new Date(Date.now() - 12 * 60 * 60 * 1000);

  if (prisma) {
    const recent = await prisma.alert.findFirst({
      where: {
        alertType,
        isSent: true,
        createdAt: {
          gte: recentWindow
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (recent) {
      return {
        ok: true,
        sent: false,
        reason: "Ogohlantirish yaqinda yuborilgan.",
        billing: status
      };
    }
  }

  const message = [
    "Viza yechilishidan oldin ogohlantirish",
    `Akkaunt: ${status.accountName}`,
    `Joriy qarzdorlik: ${formatCurrency(status.balance.amount, status.balance.currency)}`,
    `Limit: ${formatCurrency(status.limit, status.balance.currency)}`,
    `Limitgacha qolgan: ${formatCurrency(status.remaining, status.balance.currency)}`,
    "Kartadan yechilishi mumkin. Reklama to'lovlarini tekshiring."
  ].join("\n");
  const telegram = await sendTelegramMessage(message);

  if (prisma) {
    await prisma.alert.create({
      data: {
        clientId: client.id,
        alertType,
        title: "Viza yechilishidan oldin ogohlantirish",
        message,
        severity: "warning",
        isSent: telegram.ok,
        sentAt: telegram.ok ? new Date() : null
      }
    });
  }

  return {
    ok: telegram.ok,
    sent: telegram.ok,
    billing: status,
    telegram
  };
}
