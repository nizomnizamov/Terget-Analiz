import { facebookAccounts, facebookCampaigns, facebookDailyStats } from "@/lib/production-data";
import { getDateRange, isWithinDateRange, type DateRangeInput } from "@/lib/date-range";
import type { ReportScope } from "@/lib/types";

export async function connectFacebookAccount() {
  const account = facebookAccounts[0];

  if (!account) {
    return {
      ok: false,
      account: null,
      message: "Meta Ads ulanishi sozlanmagan. FACEBOOK_ACCESS_TOKEN va FACEBOOK_AD_ACCOUNT_ID ni kiriting."
    };
  }

  return {
    ok: true,
    account,
    message: "Meta Ads ulanish sozlamalari topildi. Ma'lumotlarni sinxronlash adapteri tayyorlanadi."
  };
}

export async function syncFacebookData() {
  if (!facebookAccounts.length) {
    return {
      ok: false,
      log: {
        integrationType: "facebook",
        status: "failed",
        message: "Meta Ads sozlanmagan. FACEBOOK_ACCESS_TOKEN va FACEBOOK_AD_ACCOUNT_ID kerak.",
        startedAt: new Date().toISOString(),
        finishedAt: new Date().toISOString()
      }
    };
  }

  return {
    ok: true,
    log: {
      status: "success",
      integrationType: "facebook",
      message: "Meta Ads ulanishi tayyor. Real statistikani yozish uchun server adapterini ulang.",
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString()
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
