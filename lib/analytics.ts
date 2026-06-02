import {
  alerts,
  amoLeads,
  client,
  facebookCampaigns,
  facebookDailyStats,
  kpiTargets,
  leadMatches,
  leadQualityScores,
  leadStatusHistory,
  sales
} from "@/lib/mock-data";
import {
  addDays,
  getDateRange,
  isWithinDateRange,
  parseDateKey,
  toDateKey,
  type DateRangeInput
} from "@/lib/date-range";
import { getAmoPipelines } from "@/lib/services/amo";
import {
  Alert,
  AmoLead,
  CampaignPerformance,
  DashboardOverview,
  FunnelStage,
  LeadQualityCampaign,
  ManagerMetric,
  ReportScope,
  TrendPoint,
  User
} from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent, safeDivide } from "@/lib/utils";

function datePart(value: string) {
  return value.slice(0, 10);
}

function getRangeData(range: DateRangeInput, user?: User | null, scope?: ReportScope) {
  const { from, to } = getDateRange(range);
  const scopedCampaignIds = new Set(
    scope?.facebookAccountId
      ? facebookCampaigns
          .filter((campaign) => campaign.facebookAccountId === scope.facebookAccountId)
          .map((campaign) => campaign.id)
      : facebookCampaigns.map((campaign) => campaign.id)
  );
  const scopedLeads =
    user?.role === "manager" && user.managerId
      ? amoLeads.filter((lead) => lead.responsibleUserId === user.managerId)
      : amoLeads;

  const leadsInRange = scopedLeads.filter((lead) =>
    isWithinDateRange(datePart(lead.createdAtAmo), from, to) &&
    (!scope?.facebookAccountId || scopedCampaignIds.has(campaignForLead(lead)?.id ?? ""))
  );
  const leadIds = new Set(leadsInRange.map((lead) => lead.id));
  const statsInRange = facebookDailyStats.filter((stat) =>
    isWithinDateRange(stat.date, from, to) && scopedCampaignIds.has(stat.campaignId)
  );
  const salesInRange = sales.filter((sale) => leadIds.has(sale.amoLeadId));

  return { from, to, leadsInRange, statsInRange, salesInRange };
}

function qualityForLead(leadId: string) {
  return leadQualityScores.find((score) => score.amoLeadId === leadId);
}

function campaignForLead(lead: AmoLead) {
  const match = leadMatches.find((item) => item.amoLeadId === lead.id);
  return facebookCampaigns.find((campaign) => campaign.id === match?.facebookCampaignId);
}

function sumBy<T>(items: T[], selector: (item: T) => number) {
  return items.reduce((total, item) => total + selector(item), 0);
}

function dateKeysBetween(from: string, to: string) {
  const dates: string[] = [];
  let cursor = parseDateKey(from);
  const end = parseDateKey(to);

  while (cursor <= end && dates.length < 370) {
    dates.push(toDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function metricStatus(
  value: number,
  target: number,
  direction: "higher" | "lower"
): "good" | "neutral" | "warning" | "bad" {
  if (direction === "higher") {
    if (value >= target) return "good";
    if (value >= target * 0.8) return "warning";
    return "bad";
  }

  if (value <= target) return "good";
  if (value <= target * 1.15) return "warning";
  return "bad";
}

export function getCampaignPerformance(
  range: DateRangeInput = "today",
  user?: User | null,
  scope?: ReportScope
): CampaignPerformance[] {
  const target = kpiTargets[0];
  const { leadsInRange, statsInRange, salesInRange } = getRangeData(range, user, scope);

  return facebookCampaigns
    .filter((campaign) => !scope?.facebookAccountId || campaign.facebookAccountId === scope.facebookAccountId)
    .map((campaign) => {
      const campaignStats = statsInRange.filter((stat) => stat.campaignId === campaign.id);
      const campaignLeads = leadsInRange.filter((lead) => campaignForLead(lead)?.id === campaign.id);
      const campaignLeadIds = new Set(campaignLeads.map((lead) => lead.id));
      const campaignSales = salesInRange.filter((sale) => campaignLeadIds.has(sale.amoLeadId));
      const campaignScores = campaignLeads
        .map((lead) => qualityForLead(lead.id)?.score ?? 0)
        .filter((score) => score >= 0);

      const spend = sumBy(campaignStats, (stat) => stat.spend);
      const impressions = sumBy(campaignStats, (stat) => stat.impressions);
      const reach = sumBy(campaignStats, (stat) => stat.reach);
      const clicks = sumBy(campaignStats, (stat) => stat.clicks);
      const leads = sumBy(campaignStats, (stat) => stat.leads);
      const qualifiedLeads = campaignScores.filter((score) => score >= 3).length;
      const revenue = sumBy(campaignSales, (sale) => sale.amount);
      const salesCount = campaignSales.length;
      const cpl = safeDivide(spend, leads);
      const cpa = safeDivide(spend, salesCount);
      const roas = safeDivide(revenue, spend);
      const averageQualityScore = safeDivide(sumBy(campaignScores, (score) => score), campaignScores.length);
      const qualifiedRate = safeDivide(qualifiedLeads, campaignLeads.length) * 100;
      const ctr = safeDivide(clicks, impressions) * 100;
      const cpc = safeDivide(spend, clicks);
      const cpm = safeDivide(spend, impressions) * 1000;

      let health: CampaignPerformance["health"] = "learning";
      let recommendation = "Ko'proq ma'lumot yig'ilguncha nazoratda ushlang.";

      if (spend > target.maxCpa && salesCount === 0) {
        health = "pause";
        recommendation = "Pul ketmoqda, lekin lid kelmayapti. Auditoriya yoki taklifni tekshiring.";
      } else if (roas >= target.minRoas && qualifiedRate >= 45) {
        health = "scale";
        recommendation = "Reklama qaytimi va lid sifati yaxshi. Byudjetni asta-sekin oshirish mumkin.";
      } else if (cpl <= target.maxCpl && averageQualityScore < 3) {
        health = "watch";
        recommendation = "Lid arzon, lekin sifati past. Forma va reklama matnini tekshiring.";
      } else if (roas > 0 && roas < target.minRoas) {
        health = "pause";
        recommendation = "Reklama qaytimi past. Reklamani yaxshilang yoki byudjetni vaqtincha kamaytiring.";
      }

      return {
        id: campaign.id,
        campaignName: campaign.campaignName,
        spend,
        impressions,
        reach,
        clicks,
        ctr,
        cpc,
        cpm,
        leads,
        cpl,
        qualifiedLeads,
        sales: salesCount,
        cpa,
        revenue,
        roas,
        averageQualityScore,
        recommendation,
        health
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function getTrendData(
  range: DateRangeInput = "today",
  user?: User | null,
  scope?: ReportScope
): TrendPoint[] {
  const { from, to, leadsInRange, statsInRange, salesInRange } = getRangeData(range, user, scope);
  const dates = dateKeysBetween(from, to);

  return dates.map((date) => {
    const dailyStats = statsInRange.filter((stat) => stat.date === date);
    const dailyLeads = leadsInRange.filter((lead) => datePart(lead.createdAtAmo) === date);
    const dailyLeadIds = new Set(dailyLeads.map((lead) => lead.id));
    const dailySales = salesInRange.filter((sale) => dailyLeadIds.has(sale.amoLeadId));
    const spend = sumBy(dailyStats, (stat) => stat.spend);
    const leads = sumBy(dailyStats, (stat) => stat.leads);
    const qualifiedLeads = dailyLeads.filter((lead) => (qualityForLead(lead.id)?.score ?? 0) >= 3)
      .length;
    const revenue = sumBy(dailySales, (sale) => sale.amount);

    return {
      date,
      spend,
      leads,
      qualifiedLeads,
      sales: dailySales.length,
      revenue,
      cpl: safeDivide(spend, leads),
      roas: safeDivide(revenue, spend)
    };
  });
}

export function getFunnelAnalytics(
  range: DateRangeInput = "today",
  user?: User | null,
  scope?: ReportScope
): FunnelStage[] {
  const { leadsInRange } = getRangeData(range, user, scope);
  const totalLeads = leadsInRange.length;
  const pipelines = getAmoPipelines();
  const activePipeline =
    pipelines.find((pipeline) => leadsInRange.some((lead) => lead.pipelineId === pipeline.id)) ??
    pipelines[0];

  if (!activePipeline) {
    return [];
  }

  const orderedStatuses = [...activePipeline.statuses].sort((a, b) => a.sort - b.sort);
  const statusOrder = new Map(orderedStatuses.map((status, index) => [status.id, index]));

  return orderedStatuses.map((status, index) => {
    const currentLeads = leadsInRange.filter(
      (lead) => lead.pipelineId === activePipeline.id && (lead.statusId === status.id || lead.statusName === status.name)
    );
    const currentLeadIds = new Set(currentLeads.map((lead) => lead.id));
    const nextLeads = leadsInRange.filter((lead) => {
      if (lead.pipelineId !== activePipeline.id) {
        return false;
      }

      const leadStatusIndex = statusOrder.get(lead.statusId);

      return typeof leadStatusIndex === "number" && leadStatusIndex >= index + 1;
    });
    const stageHistories = leadStatusHistory.filter(
      (history) => currentLeadIds.has(history.amoLeadId) || history.newStatus === status.name
    );
    const averageStayHours = stageHistories.length
      ? 10 + index * 5 + (stageHistories.length % 7) * 1.5
      : 0;
    const lostReasons = currentLeads
      .map((lead) => lead.lostReason)
      .filter((reason): reason is string => Boolean(reason));

    return {
      id: status.id,
      name: status.name,
      pipelineId: activePipeline.id,
      pipelineName: activePipeline.name,
      sort: status.sort,
      isWon: status.type === "success",
      isLost: status.type === "loss",
      leads: currentLeads.length,
      share: safeDivide(currentLeads.length, totalLeads) * 100,
      nextConversion:
        index < orderedStatuses.length - 1
          ? safeDivide(nextLeads.length, currentLeads.length + nextLeads.length) * 100
          : 0,
      averageStayHours,
      lostLeads: status.type === "loss" ? currentLeads.length : lostReasons.length,
      lostReason: lostReasons[0]
    };
  });
}

export function getLeadQualityAnalytics(
  range: DateRangeInput = "today",
  user?: User | null,
  scope?: ReportScope
): LeadQualityCampaign[] {
  const { leadsInRange, salesInRange } = getRangeData(range, user, scope);

  return facebookCampaigns
    .filter((campaign) => !scope?.facebookAccountId || campaign.facebookAccountId === scope.facebookAccountId)
    .map((campaign) => {
      const campaignLeads = leadsInRange.filter((lead) => campaignForLead(lead)?.id === campaign.id);
      const leadIds = new Set(campaignLeads.map((lead) => lead.id));
      const scores = campaignLeads.map((lead) => qualityForLead(lead.id)?.score ?? 0);
      const salesCount = salesInRange.filter((sale) => leadIds.has(sale.amoLeadId)).length;

      return {
        campaignName: campaign.campaignName,
        averageScore: safeDivide(sumBy(scores, (score) => score), scores.length),
        qualifiedLeadRate: safeDivide(scores.filter((score) => score >= 3).length, scores.length) * 100,
        spamRate: safeDivide(scores.filter((score) => score === 0).length, scores.length) * 100,
        repliedRate: safeDivide(scores.filter((score) => score >= 2).length, scores.length) * 100,
        interestedRate: safeDivide(scores.filter((score) => score >= 3).length, scores.length) * 100,
        saleConversionRate: safeDivide(salesCount, campaignLeads.length) * 100
      };
    });
}

export function getManagerAnalytics(range: DateRangeInput = "today", scope?: ReportScope): ManagerMetric[] {
  const { leadsInRange, salesInRange } = getRangeData(range, null, scope);
  const managers = Array.from(
    new Map(
      leadsInRange.map((lead) => [
        lead.responsibleUserId,
        { id: lead.responsibleUserId, name: lead.responsibleUserName }
      ])
    ).values()
  );

  return managers
    .map((manager) => {
      const managerLeads = leadsInRange.filter((lead) => lead.responsibleUserId === manager.id);
      const managerLeadIds = new Set(managerLeads.map((lead) => lead.id));
      const scores = managerLeads.map((lead) => qualityForLead(lead.id)?.score ?? 0);
      const managerSales = salesInRange.filter((sale) => managerLeadIds.has(sale.amoLeadId));
      const responseMinutes = managerLeads
        .map((lead) => lead.firstResponseMinutes)
        .filter((value): value is number => typeof value === "number");

      return {
        managerId: manager.id,
        managerName: manager.name,
        leads: managerLeads.length,
        repliedLeads: scores.filter((score) => score >= 2).length,
        contactRate: safeDivide(scores.filter((score) => score >= 2).length, scores.length) * 100,
        qualifiedLeadRate: safeDivide(scores.filter((score) => score >= 3).length, scores.length) * 100,
        saleConversion: safeDivide(managerSales.length, managerLeads.length) * 100,
        averageResponseMinutes: safeDivide(
          sumBy(responseMinutes, (minutes) => minutes),
          responseMinutes.length
        ),
        lostLeads: scores.filter((score) => score === 0).length,
        wonDeals: managerSales.length,
        revenue: sumBy(managerSales, (sale) => sale.amount)
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

export function getGeneratedAlerts(
  range: DateRangeInput = "today",
  user?: User | null,
  scope?: ReportScope
): Alert[] {
  const performance = getCampaignPerformance(range, user, scope);
  const target = kpiTargets[0];
  const generated: Alert[] = [];

  performance.forEach((campaign) => {
    if (campaign.spend > 100 && campaign.leads === 0) {
      generated.push({
        id: `generated_no_leads_${campaign.id}`,
        clientId: client.id,
        alertType: "spend_no_leads",
        title: `${campaign.campaignName}: pul ketdi, lid kelmadi`,
        message: `${formatCurrency(campaign.spend)} sarflangan, lekin lid kelmagan.`,
        severity: "critical",
        isSent: false,
        createdAt: new Date().toISOString()
      });
    }

    if (campaign.cpl > target.maxCpl * 1.2) {
      generated.push({
        id: `generated_cpl_${campaign.id}`,
        clientId: client.id,
        alertType: "high_cpl",
        title: `${campaign.campaignName}: lid narxi limitdan yuqori`,
        message: `Lid narxi ${formatCurrency(campaign.cpl)}, limit ${formatCurrency(target.maxCpl)}.`,
        severity: "warning",
        isSent: false,
        createdAt: new Date().toISOString()
      });
    }

    if (campaign.roas > 0 && campaign.roas < target.minRoas) {
      generated.push({
        id: `generated_roas_${campaign.id}`,
        clientId: client.id,
        alertType: "low_roas",
        title: `${campaign.campaignName}: reklama qaytimi past`,
        message: `Qaytim ${formatNumber(campaign.roas)}x, kerakli maqsad ${formatNumber(target.minRoas)}x.`,
        severity: "critical",
        isSent: false,
        createdAt: new Date().toISOString()
      });
    }
  });

  const managerAlerts = getManagerAnalytics(range, scope)
    .filter((manager) => manager.averageResponseMinutes > 90)
    .map<Alert>((manager) => ({
      id: `generated_slow_${manager.managerId}`,
      clientId: client.id,
      alertType: "slow_operator_response",
      title: `${manager.managerName}: javob berish vaqti sekin`,
      message: `O'rtacha javob berish vaqti ${formatNumber(manager.averageResponseMinutes)} daqiqa.`,
      severity: "warning",
      isSent: false,
      createdAt: new Date().toISOString()
    }));

  return [...generated, ...managerAlerts, ...alerts].slice(0, 12);
}

export function getDashboardOverview(
  range: DateRangeInput = "today",
  user?: User | null,
  scope?: ReportScope
): DashboardOverview {
  const { leadsInRange, statsInRange, salesInRange } = getRangeData(range, user, scope);
  const trends = getTrendData(range, user, scope);
  const funnel = getFunnelAnalytics(range, user, scope);
  const campaignPerformance = getCampaignPerformance(range, user, scope);
  const dashboardAlerts = getGeneratedAlerts(range, user, scope);
  const target = kpiTargets[0];
  const spend = sumBy(statsInRange, (stat) => stat.spend);
  const adLeads = sumBy(statsInRange, (stat) => stat.leads);
  const qualifiedLeads = leadsInRange.filter((lead) => (qualityForLead(lead.id)?.score ?? 0) >= 3).length;
  const revenue = sumBy(salesInRange, (sale) => sale.amount);
  const salesCount = salesInRange.length;
  const cpl = safeDivide(spend, adLeads);
  const cpa = safeDivide(spend, salesCount);
  const roas = safeDivide(revenue, spend);
  const conversionRate = safeDivide(salesCount, adLeads) * 100;
  const bestCampaign = campaignPerformance.find((campaign) => campaign.health === "scale") ?? campaignPerformance[0];
  const worstCampaign =
    [...campaignPerformance].sort((a, b) => a.roas - b.roas || b.spend - a.spend)[0] ??
    campaignPerformance[0];
  const spendNoLead = campaignPerformance.find((campaign) => campaign.spend > 100 && campaign.leads === 0);
  const cheapLowQuality = campaignPerformance.find(
    (campaign) => campaign.cpl <= target.maxCpl && campaign.averageQualityScore < 3
  );
  const lowLeadHighSales = campaignPerformance.find(
    (campaign) => campaign.leads < 120 && campaign.sales >= 3 && campaign.roas >= target.minRoas
  );
  const insights = [
    bestCampaign
      ? `${bestCampaign.campaignName} eng yaxshi reklama: qaytim ${formatNumber(
          bestCampaign.roas
        )}x va ${bestCampaign.sales} ta sotuv.`
      : "",
    worstCampaign
      ? `${worstCampaign.campaignName} e'tibor talab qiladi: sotuv narxi ${formatCurrency(
          worstCampaign.cpa
        )}, qaytim ${formatNumber(worstCampaign.roas)}x.`
      : "",
    spendNoLead ? `${spendNoLead.campaignName} pul sarflayapti, lekin lid bermayapti.` : "",
    cheapLowQuality
      ? `${cheapLowQuality.campaignName} lid narxi arzon, ammo sifati past.`
      : "",
    lowLeadHighSales
      ? `${lowLeadHighSales.campaignName} kam lid bilan yaxshi sotuv beryapti. Shu auditoriyani kengaytirish mumkin.`
      : ""
  ].filter(Boolean);

  return {
    metrics: [
      {
        key: "spend",
        label: "Xarajat",
        value: formatCurrency(spend),
        rawValue: spend,
        change: 12.4,
        status: metricStatus(spend, target.monthlyBudget, "lower")
      },
      {
        key: "leads",
        label: "Lidlar",
        value: formatNumber(adLeads),
        rawValue: adLeads,
        change: 8.2,
        status: "neutral"
      },
      {
        key: "qualified",
        label: "Sifatli lidlar",
        value: formatNumber(qualifiedLeads),
        rawValue: qualifiedLeads,
        change: 14.1,
        status: "good"
      },
      {
        key: "sales",
        label: "Sotuv",
        value: formatNumber(salesCount),
        rawValue: salesCount,
        change: 5.8,
        status: "good"
      },
      {
        key: "revenue",
        label: "Tushum",
        value: formatCurrency(revenue),
        rawValue: revenue,
        change: 18.6,
        status: "good"
      },
      {
        key: "cpl",
        label: "1 lid narxi",
        value: formatCurrency(cpl),
        rawValue: cpl,
        change: -6.4,
        status: metricStatus(cpl, target.maxCpl, "lower")
      },
      {
        key: "cpa",
        label: "1 sotuv narxi",
        value: formatCurrency(cpa),
        rawValue: cpa,
        change: -3.2,
        status: metricStatus(cpa, target.maxCpa, "lower")
      },
      {
        key: "roas",
        label: "Reklama qaytimi",
        value: `${formatNumber(roas)}x`,
        rawValue: roas,
        change: 9.7,
        status: metricStatus(roas, target.minRoas, "higher")
      },
      {
        key: "conversion",
        label: "Sotuvga aylanish",
        value: formatPercent(conversionRate),
        rawValue: conversionRate,
        change: 2.1,
        status: metricStatus(conversionRate, target.minConversionRate, "higher")
      }
    ],
    trends,
    funnel,
    campaignPerformance,
    alerts: dashboardAlerts,
    bestCampaign,
    worstCampaign,
    insights
  };
}
