import { getAnalyticsData } from "@/lib/data-source";
import type { DateRangeInput } from "@/lib/date-range";
import { safeDivide } from "@/lib/utils";

export async function getMatchingSummary(range: DateRangeInput = "today") {
  const data = await getAnalyticsData(range);
  const matched = data.leadMatches.filter((match) => match.matchType !== "unmatched");
  const unmatched = data.leadMatches.length - matched.length;
  const averageConfidence =
    safeDivide(
      matched.reduce((total, match) => total + match.confidenceScore, 0),
      matched.length
    ) * 100;

  return {
    total: data.leadMatches.length,
    matched: matched.length,
    unmatched,
    autoMatched: matched.filter((match) => match.matchType !== "manual").length,
    manualMatched: matched.filter((match) => match.matchType === "manual").length,
    averageConfidence
  };
}

export async function runLeadMatching(range: DateRangeInput = "today") {
  const data = await getAnalyticsData(range);
  const unmatched = await getUnmatchedLeads(range);

  return {
    ok: true,
    matched: data.leadMatches.filter((match) => match.matchType !== "unmatched").length,
    unmatched: unmatched.length,
    summary: await getMatchingSummary(range),
    priority: ["utm_campaign", "utm_content", "ad_id", "adset_id", "campaign_id", "source"]
  };
}

export async function getUnmatchedLeads(range: DateRangeInput = "today") {
  const data = await getAnalyticsData(range);
  const unmatchedIds = new Set(
    data.leadMatches.filter((match) => match.matchType === "unmatched").map((match) => match.amoLeadId)
  );

  return data.amoLeads.filter((lead) => unmatchedIds.has(lead.id));
}

export async function manualMatchLead(leadId: string, campaignId: string, range: DateRangeInput = "today") {
  const data = await getAnalyticsData(range);
  const lead = data.amoLeads.find((item) => item.id === leadId);
  const campaign = data.facebookCampaigns.find((item) => item.id === campaignId);

  if (!lead || !campaign) {
    return {
      ok: false,
      message: "Lid yoki reklama topilmadi."
    };
  }

  return {
    ok: true,
    match: {
      id: `manual_${lead.id}_${campaign.id}`,
      amoLeadId: lead.id,
      facebookCampaignId: campaign.id,
      matchType: "manual",
      confidenceScore: 1,
      createdAt: new Date().toISOString()
    }
  };
}
