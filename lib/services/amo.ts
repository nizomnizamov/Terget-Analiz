import { amoAccounts, amoLeads, amoPipelines } from "@/lib/production-data";
import { getDateRange, isWithinDateRange, type DateRangeInput } from "@/lib/date-range";

export async function connectAmoAccount() {
  const account = amoAccounts[0];

  if (!account) {
    return {
      ok: false,
      account: null,
      message: "amoCRM ulanishi sozlanmagan. AMO_SUBDOMAIN va amoCRM tokenlarini kiriting."
    };
  }

  return {
    ok: true,
    account,
    message: "amoCRM ulanish sozlamalari topildi. Varonka va lidlarni sinxronlash adapteri tayyorlanadi."
  };
}

export async function syncAmoData() {
  if (!amoAccounts.length) {
    return {
      ok: false,
      log: {
        integrationType: "amo",
        status: "failed",
        message: "amoCRM sozlanmagan. AMO_SUBDOMAIN va tokenlar kerak.",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString()
      }
    };
  }

  return {
    ok: true,
    log: {
      status: "success",
      integrationType: "amo",
      message: "amoCRM ulanishi tayyor. Real lidlarni yozish uchun server adapterini ulang.",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString()
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
