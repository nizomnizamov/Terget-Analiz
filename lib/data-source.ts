import { alerts, client, kpiTargets, leadStatusHistory, syncLogs } from "@/lib/production-data";
import { getAmoLeads, getAmoPipelines } from "@/lib/services/amo";
import { getFacebookAccounts, getFacebookCampaigns, getFacebookStats } from "@/lib/services/facebook";
import type {
  Alert,
  AmoLead,
  AmoPipeline,
  FacebookAccount,
  FacebookCampaign,
  FacebookDailyStat,
  KpiTarget,
  LeadMatch,
  LeadQualityScore,
  LeadStatusHistory,
  Sale,
  SyncLog
} from "@/lib/types";
import type { DateRangeInput } from "@/lib/date-range";

export type AnalyticsData = {
  client: typeof client;
  facebookAccounts: FacebookAccount[];
  facebookCampaigns: FacebookCampaign[];
  facebookDailyStats: FacebookDailyStat[];
  amoPipelines: AmoPipeline[];
  amoLeads: AmoLead[];
  leadQualityScores: LeadQualityScore[];
  leadStatusHistory: LeadStatusHistory[];
  leadMatches: LeadMatch[];
  sales: Sale[];
  kpiTargets: KpiTarget[];
  alerts: Alert[];
  syncLogs: SyncLog[];
};

function scoreForLead(lead: AmoLead, pipelines: AmoPipeline[]) {
  const pipeline = pipelines.find((item) => item.id === lead.pipelineId);
  const status = pipeline?.statuses.find((item) => item.id === lead.statusId);

  if (status?.type === "loss" || lead.lostReason) {
    return { score: 0, label: "Yo'qotildi / spam", reason: lead.lostReason ?? "CRMda yo'qotilgan" };
  }

  if (status?.type === "success") {
    return { score: 6, label: "Sotuv bo'ldi", reason: "CRMda muvaffaqiyatli bosqich" };
  }

  const statuses = pipeline?.statuses.filter((item) => item.type === "regular") ?? [];
  const index = statuses.findIndex((item) => item.id === lead.statusId);
  const score = index < 0 ? 1 : Math.min(5, Math.max(1, index + 1));

  return {
    score,
    label:
      score >= 4
        ? "Sifatli lid"
        : score >= 2
          ? "Aloqa bor"
          : "Yangi lid",
    reason: lead.statusName
  };
}

function buildLeadQualityScores(leads: AmoLead[], pipelines: AmoPipeline[]): LeadQualityScore[] {
  return leads.map((lead) => {
    const quality = scoreForLead(lead, pipelines);

    return {
      id: `quality_${lead.id}`,
      amoLeadId: lead.id,
      score: quality.score,
      qualityLabel: quality.label,
      reason: quality.reason,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt
    };
  });
}

function normalize(value?: string) {
  return (value ?? "").trim().toLowerCase();
}

function buildLeadMatches(leads: AmoLead[], campaigns: FacebookCampaign[]): LeadMatch[] {
  return leads.map((lead) => {
    const byCampaignName = campaigns.find(
      (campaign) => normalize(campaign.campaignName) === normalize(lead.utmCampaign)
    );
    const byCampaignId = campaigns.find(
      (campaign) => normalize(campaign.campaignId) === normalize(lead.utmCampaign)
    );
    const campaign = byCampaignName ?? byCampaignId;

    if (campaign) {
      return {
        id: `match_${lead.id}`,
        amoLeadId: lead.id,
        facebookCampaignId: campaign.id,
        matchType: byCampaignName ? "utm_campaign" : "campaign_id",
        confidenceScore: byCampaignName ? 0.95 : 0.85,
        createdAt: new Date().toISOString()
      };
    }

    return {
      id: `match_${lead.id}`,
      amoLeadId: lead.id,
      matchType: "unmatched",
      confidenceScore: 0,
      createdAt: new Date().toISOString()
    };
  });
}

function buildSales(leads: AmoLead[], pipelines: AmoPipeline[]): Sale[] {
  return leads
    .filter((lead) => {
      const pipeline = pipelines.find((item) => item.id === lead.pipelineId);
      const status = pipeline?.statuses.find((item) => item.id === lead.statusId);

      return status?.type === "success" || lead.price > 0;
    })
    .map((lead) => ({
      id: `sale_${lead.id}`,
      amoLeadId: lead.id,
      amount: lead.price,
      saleDate: lead.updatedAtAmo.slice(0, 10),
      status: "paid",
      createdAt: lead.updatedAt
    }));
}

export async function getAnalyticsData(range: DateRangeInput = "today"): Promise<AnalyticsData> {
  const [facebookAccounts, facebookCampaigns, facebookDailyStats, amoPipelines, amoLeads] =
    await Promise.all([
      getFacebookAccounts(),
      getFacebookCampaigns(),
      getFacebookStats(range),
      getAmoPipelines(),
      getAmoLeads(range)
    ]);
  const leadQualityScores = buildLeadQualityScores(amoLeads, amoPipelines);
  const leadMatches = buildLeadMatches(amoLeads, facebookCampaigns);
  const sales = buildSales(amoLeads, amoPipelines);

  return {
    client,
    facebookAccounts,
    facebookCampaigns,
    facebookDailyStats,
    amoPipelines,
    amoLeads,
    leadQualityScores,
    leadStatusHistory,
    leadMatches,
    sales,
    kpiTargets,
    alerts,
    syncLogs
  };
}
