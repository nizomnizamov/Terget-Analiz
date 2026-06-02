import { getGeneratedAlerts } from "@/lib/analytics";
import type { DateRangeInput } from "@/lib/date-range";
import { syncLogs } from "@/lib/mock-data";
import type { ReportScope } from "@/lib/types";

export async function checkAlerts(range: DateRangeInput = "today", scope?: ReportScope) {
  return {
    ok: true,
    alerts: getGeneratedAlerts(range, null, scope),
    log: {
      ...syncLogs.find((log) => log.integrationType === "alerts"),
      status: "success",
      message: "KPI limits checked with mock data."
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
