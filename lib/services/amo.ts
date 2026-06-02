import { amoAccounts, amoLeads, amoPipelines, syncLogs } from "@/lib/mock-data";
import { getDateRange, isWithinDateRange, type DateRangeInput } from "@/lib/date-range";

export async function connectAmoAccount() {
  return {
    ok: true,
    account: amoAccounts[0],
    message: "amoCRM test ulanishi tayyor. Real ulanish uchun amoCRM OAuth adapterini ulang."
  };
}

export async function syncAmoData() {
  return {
    ok: true,
    log: {
      ...syncLogs.find((log) => log.integrationType === "amo"),
      status: "success",
      message: "amoCRM test ma'lumotlari yangilandi: lidlar, holatlar, operatorlar va sotuvlar yangilandi."
    }
  };
}

export function getAmoLeads(range: DateRangeInput = "today") {
  const { from, to } = getDateRange(range);
  return amoLeads.filter((lead) => isWithinDateRange(lead.createdAtAmo.slice(0, 10), from, to));
}

export function getAmoPipelines() {
  return amoPipelines
    .map((pipeline) => ({
      ...pipeline,
      statuses: [...pipeline.statuses].sort((a, b) => a.sort - b.sort)
    }))
    .sort((a, b) => a.sort - b.sort);
}

export function getAmoStatuses() {
  return getAmoPipelines().flatMap((pipeline) => pipeline.statuses);
}
