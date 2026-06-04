import { facebookAccounts, facebookCampaigns, facebookDailyStats } from "@/lib/production-data";
import { getDateRange, isWithinDateRange, type DateRangeInput } from "@/lib/date-range";
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

const graphVersion = process.env.META_GRAPH_VERSION ?? process.env.FACEBOOK_GRAPH_VERSION ?? "v23.0";

function normalizeAdAccountId(value: string) {
  return value.startsWith("act_") ? value : `act_${value}`;
}

function accessToken() {
  return process.env.FACEBOOK_ACCESS_TOKEN ?? "";
}

function isConfigured() {
  return Boolean(accessToken() && process.env.FACEBOOK_AD_ACCOUNT_ID);
}

function graphUrl(path: string, params?: Record<string, string>) {
  const url = new URL(`https://graph.facebook.com/${graphVersion}/${path.replace(/^\//, "")}`);
  url.searchParams.set("access_token", accessToken());

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value);
    }
  });

  return url;
}

async function metaGet<T>(path: string, params?: Record<string, string>) {
  const response = await fetch(graphUrl(path, params), { cache: "no-store" });
  const body = (await response.json().catch(() => null)) as MetaListResponse<T> | null;

  if (!response.ok) {
    throw new Error(body?.error?.message ?? `Meta API xatosi: ${response.status}`);
  }

  return body ?? {};
}

async function metaList<T>(path: string, params?: Record<string, string>) {
  const items: T[] = [];
  let nextUrl: string | undefined;
  const firstPage = await metaGet<T>(path, params);

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

function actionValue(actions: MetaAction[] | undefined, patterns: string[]) {
  return (actions ?? []).reduce((total, action) => {
    const type = action.action_type ?? "";

    return patterns.some((pattern) => type.includes(pattern))
      ? total + Number(action.value ?? 0)
      : total;
  }, 0);
}

function campaignAccountId() {
  return facebookAccounts[0]?.id ?? "facebook_account_primary";
}

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
  if (!isConfigured()) {
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
  return facebookAccounts;
}

export async function getFacebookCampaigns(): Promise<FacebookCampaign[]> {
  if (!isConfigured()) {
    return facebookCampaigns;
  }

  const accountId = normalizeAdAccountId(process.env.FACEBOOK_AD_ACCOUNT_ID!);
  const campaigns = await metaList<MetaCampaign>(`${accountId}/campaigns`, {
    fields: "id,name,objective,status",
    limit: "500"
  });
  const now = new Date().toISOString();

  return campaigns.map((campaign) => ({
    id: `meta_${campaign.id}`,
    facebookAccountId: campaignAccountId(),
    campaignId: campaign.id,
    campaignName: campaign.name ?? campaign.id,
    objective: campaign.objective ?? "",
    status: campaign.status === "PAUSED" ? "PAUSED" : "ACTIVE",
    createdAt: now,
    updatedAt: now
  }));
}

export async function getFacebookStats(range: DateRangeInput = "today", scope?: ReportScope) {
  if (isConfigured()) {
    const { from, to } = getDateRange(range);
    const accountId = normalizeAdAccountId(process.env.FACEBOOK_AD_ACCOUNT_ID!);
    const insights = await metaList<MetaInsight>(`${accountId}/insights`, {
      level: "campaign",
      fields: "campaign_id,campaign_name,spend,impressions,reach,clicks,ctr,cpc,cpm,actions,date_start,date_stop",
      time_increment: "1",
      time_range: JSON.stringify({ since: from, until: to }),
      limit: "500"
    });
    const now = new Date().toISOString();

    return insights
      .filter(() => !scope?.facebookAccountId || scope.facebookAccountId === campaignAccountId())
      .map<FacebookDailyStat>((item) => {
        const leads = actionValue(item.actions, ["lead"]);
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
