import { getGeneratedAlerts } from "@/lib/analytics";
import type { DateRangeInput } from "@/lib/date-range";
import type { ReportScope } from "@/lib/types";

export async function checkAlerts(range: DateRangeInput = "today", scope?: ReportScope) {
  return {
    ok: true,
    alerts: getGeneratedAlerts(range, null, scope),
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
  const alerts = getGeneratedAlerts(range, null, scope).filter((alert) => !alert.isSent);

  return {
    ok: true,
    queued: alerts.length,
    alerts
  };
}
