import { facebookAccounts, facebookCampaigns, facebookDailyStats } from "@/lib/production-data";
import { getDateRange, isWithinDateRange, type DateRangeInput } from "@/lib/date-range";
import { getFacebookAccountProfiles, getFacebookCredentials, type FacebookCredentials } from "@/lib/integration-settings";
import type { FacebookCampaign, FacebookDailyStat, ReportScope } from "@/lib/types";
import { safeDivide } from "@/lib/utils";

type MetaPaging = {
  next?: string;
};

type MetaListResponse<T> = {
  data?: T[];
  paging?: MetaPaging;
  error?: {
    message?: string;
    type?: string;
    code?: number;
  };
};

type MetaCampaign = {
  id: string;
  name?: string;
  objective?: string;
  status?: "ACTIVE" | "PAUSED" | string;
  effective_status?: "ACTIVE" | "PAUSED" | string;
};

type MetaAction = {
  action_type?: string;
  value?: string;
};

type MetaInsight = {
  campaign_id?: string;
  campaign_name?: string;
  date_start?: string;
  date_stop?: string;
  spend?: string;
  impressions?: string;
  reach?: string;
  clicks?: string;
  ctr?: string;
  cpc?: string;
  cpm?: string;
  actions?: MetaAction[];
};

type MetaAdAccount = {
  balance?: string;
  currency?: string;
};

const graphVersion = process.env.META_GRAPH_VERSION ?? process.env.FACEBOOK_GRAPH_VERSION ?? "v23.0";

function normalizeAdAccountId(value: string) {
  return value.startsWith("act_") ? value : `act_${value}`;
}

function graphUrl(settings: FacebookCredentials, path: string, params?: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", settings.accessToken);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function metaGet<T>(settings: FacebookCredentials, path: string, params?: Record<string, string>) {
  const response = await fetch(graphUrl(settings, path, params), { cache: "no-store" });
  const body = (await response.json().catch(() => null)) as (T & {
    error?: {
      message?: string;
    };
  }) | null;

  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Meta API xatosi: ${response.status}`);
  }

  return (body ?? {}) as T;
}

async function metaList<T>(settings: FacebookCredentials, path: string, params?: Record<string, string>) {
  const items: T[] = [];
  let nextUrl: string | undefined;
  const firstPage = await metaGet<MetaListResponse<T>>(settings, path, params);

  items.push(...(firstPage.data ?? []));
  nextUrl = firstPage.paging?.next;

  while (nextUrl) {
    const response = await fetch(nextUrl, { cache: "no-store" });
    const body = (await response.json().catch(() => null)) as MetaListResponse<T> | null;

    if (!response.ok) {
      throw new Error(body?.error?.message ?? `Meta API paging xatosi: ${response.status}`);
    }

    items.push(...(body?.data ?? []));
    nextUrl = body?.paging?.next;
  }

  return items;
}

const leadActionTypes = [
  "lead",
  "onsite_conversion.lead_grouped",
  "offsite_complete_registration_add_meta_leads",
  "offsite_search_add_meta_leads",
  "offsite_content_view_add_meta_leads"
];

function actionValue(actions: MetaAction[] | undefined, actionTypes: string[]) {
  const byType = new Map((actions ?? []).map((action) => [action.action_type ?? "", Number(action.value ?? 0)]));

  for (const actionType of actionTypes) {
    const value = byType.get(actionType);

    if (typeof value === "number") {
      return value;
    }
  }

  return 0;
}

function campaignAccountId(settings?: FacebookCredentials | null) {
  return settings?.id ?? facebookAccounts[0]?.id ?? "facebook_account_primary";
}

export async function connectFacebookAccount() {
  const account = (await getFacebookAccountProfiles())[0];

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
  const settings = await getFacebookCredentials();

  if (!settings) {
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

  const [campaigns, stats] = await Promise.all([
    getFacebookCampaigns(),
    getFacebookStats("today")
  ]);

  return {
    ok: true,
    campaigns: campaigns.length,
    stats: stats.length,
    log: {
      status: "success",
      integrationType: "facebook",
      message: `Meta Ads API ishladi: ${campaigns.length} ta reklama, ${stats.length} ta kunlik statistika olindi.`,
      startedAt: new Date().toISOString(),
      finishedAt: new Date().toISOString()
    }
  };
}

export async function getFacebookAccounts() {
  return getFacebookAccountProfiles();
}

export async function getFacebookCampaigns(): Promise<FacebookCampaign[]> {
  const settings = await getFacebookCredentials();

  if (!settings) {
    return facebookCampaigns;
  }

  const accountId = normalizeAdAccountId(settings.adAccountId);
  const campaigns = await metaList<MetaCampaign>(settings, `${accountId}/campaigns`, {
    fields: "id,name,objective,status,effective_status",
    limit: "500"
  });
  const now = new Date().toISOString();

  return campaigns.map((campaign) => ({
    id: `meta_${campaign.id}`,
    facebookAccountId: campaignAccountId(settings),
    campaignId: campaign.id,
    campaignName: campaign.name ?? campaign.id,
    objective: campaign.objective ?? "",
    status: campaign.effective_status === "ACTIVE" ? "ACTIVE" : "PAUSED",
    createdAt: now,
    updatedAt: now
  }));
}

function configuredFacebookBalance() {
  const configuredBalance = Number(process.env.FACEBOOK_ACCOUNT_BALANCE);

  if (Number.isFinite(configuredBalance)) {
    return {
      amount: configuredBalance,
      currency: process.env.APP_CURRENCY ?? "USD"
    };
  }

  return null;
}

export async function getFacebookAccountBalance() {
  const settings = await getFacebookCredentials();

  if (!settings) {
    return configuredFacebookBalance();
  }

  const accountId = normalizeAdAccountId(settings.adAccountId);
  const account = await metaGet<MetaAdAccount>(settings, accountId, {
    fields: "balance,currency"
  });
  const rawBalance = Number(account.balance);

  if (!Number.isFinite(rawBalance)) {
    return configuredFacebookBalance();
  }

  const divisor = Number(process.env.FACEBOOK_BALANCE_DIVISOR ?? 100);
  const safeDivisor = Number.isFinite(divisor) && divisor > 0 ? divisor : 100;

  return {
    amount: rawBalance / safeDivisor,
    currency: account.currency ?? process.env.APP_CURRENCY ?? "USD"
  };
}

export async function getFacebookBillingStatus() {
  const settings = await getFacebookCredentials();
  const balance = await getFacebookAccountBalance();
  const limit = settings?.billingLimit ?? Number(process.env.FACEBOOK_BILLING_LIMIT);
  const warnBefore = settings?.billingWarnBefore ?? Number(process.env.FACEBOOK_BILLING_WARN_BEFORE ?? 3);

  if (!settings || !balance || !Number.isFinite(limit) || limit <= 0) {
    return {
      ok: false,
      accountName: settings?.accountName ?? "Meta Ads",
      balance,
      limit: Number.isFinite(limit) ? limit : null,
      warnBefore: Number.isFinite(warnBefore) ? warnBefore : null,
      remaining: null,
      shouldWarn: false,
      message: "Meta Ads billing limiti sozlanmagan."
    };
  }

  const safeWarnBefore = Number.isFinite(warnBefore) && warnBefore > 0 ? warnBefore : 3;
  const remaining = Math.max(limit - balance.amount, 0);

  return {
    ok: true,
    accountName: settings.accountName,
    balance,
    limit,
    warnBefore: safeWarnBefore,
    remaining,
    shouldWarn: remaining <= safeWarnBefore,
    message: "Meta Ads billing limiti tekshirildi."
  };
}

export async function getFacebookStats(range: DateRangeInput = "today", scope?: ReportScope) {
  const settings = await getFacebookCredentials();

  if (settings) {
    const { from, to } = getDateRange(range);
    const accountId = normalizeAdAccountId(settings.adAccountId);
    const insights = await metaList<MetaInsight>(settings, `${accountId}/insights`, {
      level: "campaign",
      fields: "campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,date_start,date_stop",
      time_increment: "1",
      time_range: JSON.stringify({ since: from, until: to }),
      limit: "500"
    });
    const now = new Date().toISOString();

    return insights
      .filter(() => !scope?.facebookAccountId || scope.facebookAccountId === campaignAccountId(settings))
      .map<FacebookDailyStat>((item) => {
        const leads = actionValue(item.actions, leadActionTypes);
        const spend = Number(item.spend ?? 0);
        const clicks = Number(item.clicks ?? 0);
        const impressions = Number(item.impressions ?? 0);

        return {
          id: `meta_stat_${item.campaign_id}_${item.date_start}`,
          campaignId: `meta_${item.campaign_id}`,
          adsetId: "",
          adId: "",
          date: item.date_start ?? item.date_stop ?? from,
          spend,
          impressions,
          reach: Number(item.reach ?? 0),
          clicks,
          ctr: Number(item.ctr ?? 0),
          cpc: Number(item.cpc ?? 0),
          cpm: Number(item.cpm ?? 0),
          leads,
          cpl: safeDivide(spend, leads),
          createdAt: now,
          updatedAt: now
        };
      });
  }

  const { from, to } = getDateRange(range);
  const campaignIds = new Set(
    facebookCampaigns
      .filter((campaign) => !scope?.facebookAccountId || campaign.facebookAccountId === scope.facebookAccountId)
      .map((campaign) => campaign.id)
  );

  return facebookDailyStats.filter((stat) => isWithinDateRange(stat.date, from, to) && campaignIds.has(stat.campaignId));
}
