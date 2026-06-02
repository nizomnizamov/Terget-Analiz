import { facebookAccounts, facebookCampaigns, facebookDailyStats, syncLogs } from "@/lib/mock-data";
import { getDateRange, isWithinDateRange, type DateRangeInput } from "@/lib/date-range";
import type { ReportScope } from "@/lib/types";

export async function connectFacebookAccount() {
  return {
    ok: true,
    account: facebookAccounts[0],
    message: "Meta Ads test ulanishi tayyor. Real ulanish uchun Meta OAuth adapterini ulang."
  };
}

export async function syncFacebookData() {
  return {
    ok: true,
    log: {
      ...syncLogs.find((log) => log.integrationType === "facebook"),
      status: "success",
      message: "Meta Ads test ma'lumotlari yangilandi: reklamalar va kunlik natijalar yangilandi."
    }
  };
}

export function getFacebookAccounts() {
  return facebookAccounts;
}

export function getFacebookCampaigns() {
  return facebookCampaigns;
}

export function getFacebookStats(range: DateRangeInput = "today", scope?: ReportScope) {
  const { from, to } = getDateRange(range);
  const campaignIds = new Set(
    facebookCampaigns
      .filter((campaign) => !scope?.facebookAccountId || campaign.facebookAccountId === scope.facebookAccountId)
      .map((campaign) => campaign.id)
  );

  return facebookDailyStats.filter((stat) => isWithinDateRange(stat.date, from, to) && campaignIds.has(stat.campaignId));
}
