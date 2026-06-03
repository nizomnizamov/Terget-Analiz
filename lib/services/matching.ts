import { amoLeads, facebookCampaigns, leadMatches } from "@/lib/production-data";
import { safeDivide } from "@/lib/utils";

export function getMatchingSummary() {
  const matched = leadMatches.filter((match) => match.matchType !== "unmatched");
  const unmatched = leadMatches.length - matched.length;
  const averageConfidence =
    safeDivide(
      matched.reduce((total, match) => total + match.confidenceScore, 0),
      matched.length
    ) * 100;

  return {
    total: leadMatches.length,
    matched: matched.length,
    unmatched,
    autoMatched: matched.filter((match) => match.matchType !== "manual").length,
    manualMatched: matched.filter((match) => match.matchType === "manual").length,
    averageConfidence
  };
}

export async function runLeadMatching() {
  const unmatched = getUnmatchedLeads();

  return {
    ok: true,
    matched: leadMatches.filter((match) => match.matchType !== "unmatched").length,
    unmatched: unmatched.length,
    summary: getMatchingSummary(),
    priority: ["utm_campaign", "utm_content", "ad_id", "adset_id", "campaign_id", "source"]
  };
}

export function getUnmatchedLeads() {
  const unmatchedIds = new Set(
    leadMatches.filter((match) => match.matchType === "unmatched").map((match) => match.amoLeadId)
  );

  return amoLeads.filter((lead) => unmatchedIds.has(lead.id));
}

export async function manualMatchLead(leadId: string, campaignId: string) {
  const lead = amoLeads.find((item) => item.id === leadId);
  const campaign = facebookCampaigns.find((item) => item.id === campaignId);

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
