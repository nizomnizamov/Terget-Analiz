import {
  Alert,
  AmoAccount,
  AmoLead,
  AmoPipeline,
  Client,
  FacebookAccount,
  FacebookCampaign,
  FacebookDailyStat,
  KpiTarget,
  LeadMatch,
  LeadQualityScore,
  LeadStatusHistory,
  Sale,
  SyncLog,
  TelegramSubscriber,
  User
} from "@/lib/types";
import { addDays, toDateKey } from "@/lib/date-range";

const createdAt = "2026-05-01T08:00:00.000Z";
const updatedAt = "2026-05-31T08:00:00.000Z";

export const client: Client = {
  id: "client_touristan",
  name: "Touristan Travel",
  currency: "USD",
  timezone: "Asia/Tashkent",
  createdAt,
  updatedAt
};

export const users: User[] = [
  {
    id: "user_admin",
    name: "Admin",
    email: "admin@demo.uz",
    role: "admin",
    createdAt,
    updatedAt
  },
  {
    id: "user_client",
    name: "Client",
    email: "client@demo.uz",
    role: "client",
    createdAt,
    updatedAt
  },
  {
    id: "user_manager_1",
    name: "Madina Karimova",
    email: "madina@demo.uz",
    role: "manager",
    managerId: "mgr_madina",
    createdAt,
    updatedAt
  },
  {
    id: "user_manager_2",
    name: "Azizbek Tursunov",
    email: "azizbek@demo.uz",
    role: "manager",
    managerId: "mgr_azizbek",
    createdAt,
    updatedAt
  }
];

export const facebookAccounts: FacebookAccount[] = [
  {
    id: "fb_account_1",
    clientId: client.id,
    amoAccountId: "amo_account_1",
    accountName: "Touristan Meta Ads",
    adAccountId: "act_1292039123",
    status: "active",
    createdAt,
    updatedAt
  },
  {
    id: "fb_account_2",
    clientId: client.id,
    amoAccountId: "amo_account_2",
    accountName: "Premium Tours Meta",
    adAccountId: "act_8472031180",
    status: "active",
    createdAt,
    updatedAt
  },
  {
    id: "fb_account_3",
    clientId: client.id,
    amoAccountId: "amo_account_3",
    accountName: "Budget Trips Meta",
    adAccountId: "act_5520184471",
    status: "active",
    createdAt,
    updatedAt
  }
];

export const amoAccounts: AmoAccount[] = [
  {
    id: "amo_account_1",
    clientId: client.id,
    subdomain: "touristan",
    status: "active",
    createdAt,
    updatedAt
  },
  {
    id: "amo_account_2",
    clientId: client.id,
    subdomain: "premiumtour",
    status: "active",
    createdAt,
    updatedAt
  },
  {
    id: "amo_account_3",
    clientId: client.id,
    subdomain: "budgettrip",
    status: "active",
    createdAt,
    updatedAt
  }
];

export const facebookCampaigns: FacebookCampaign[] = [
  {
    id: "camp_turkey_family",
    facebookAccountId: facebookAccounts[0].id,
    campaignId: "238651001",
    campaignName: "Turkey Family Summer",
    objective: "LEADS",
    status: "ACTIVE",
    createdAt,
    updatedAt
  },
  {
    id: "camp_dubai_premium",
    facebookAccountId: facebookAccounts[1].id,
    campaignId: "238651002",
    campaignName: "Dubai Premium Couples",
    objective: "LEADS",
    status: "ACTIVE",
    createdAt,
    updatedAt
  },
  {
    id: "camp_umrah_may",
    facebookAccountId: facebookAccounts[0].id,
    campaignId: "238651003",
    campaignName: "Umrah May Departures",
    objective: "LEADS",
    status: "ACTIVE",
    createdAt,
    updatedAt
  },
  {
    id: "camp_europe_group",
    facebookAccountId: facebookAccounts[1].id,
    campaignId: "238651004",
    campaignName: "Europe Group Tour",
    objective: "LEADS",
    status: "ACTIVE",
    createdAt,
    updatedAt
  },
  {
    id: "camp_egypt_budget",
    facebookAccountId: facebookAccounts[2].id,
    campaignId: "238651005",
    campaignName: "Egypt Budget Trips",
    objective: "LEADS",
    status: "ACTIVE",
    createdAt,
    updatedAt
  },
  {
    id: "camp_retargeting",
    facebookAccountId: facebookAccounts[2].id,
    campaignId: "238651006",
    campaignName: "Instagram Retargeting",
    objective: "LEADS",
    status: "ACTIVE",
    createdAt,
    updatedAt
  }
];

type CampaignBase = {
  spend: number;
  clicks: number;
  leads: number;
  qualityBase: number;
};

const campaignBases: Record<string, CampaignBase> = {
  camp_turkey_family: { spend: 72, clicks: 94, leads: 9, qualityBase: 4 },
  camp_dubai_premium: { spend: 105, clicks: 88, leads: 6, qualityBase: 5 },
  camp_umrah_may: { spend: 58, clicks: 75, leads: 8, qualityBase: 4 },
  camp_europe_group: { spend: 86, clicks: 62, leads: 3, qualityBase: 5 },
  camp_egypt_budget: { spend: 64, clicks: 110, leads: 13, qualityBase: 2 },
  camp_retargeting: { spend: 39, clicks: 57, leads: 4, qualityBase: 5 }
};

export const facebookDailyStats: FacebookDailyStat[] = facebookCampaigns.flatMap((campaign, cIndex) => {
  const base = campaignBases[campaign.id];
  const start = new Date("2026-05-02T00:00:00.000Z");

  return Array.from({ length: 31 }, (_, dayIndex) => {
    const wave = 1 + ((dayIndex + cIndex) % 5) * 0.07;
    const weekendSoftener = dayIndex % 7 > 4 ? 0.86 : 1;
    const spend = Number((base.spend * wave * weekendSoftener).toFixed(2));
    const clicks = Math.max(1, Math.round(base.clicks * wave * (1 + (dayIndex % 3) * 0.05)));
    const impressions = Math.round(clicks * (24 + cIndex * 3 + (dayIndex % 4)));
    const reach = Math.round(impressions * 0.72);
    const leadPenalty = campaign.id === "camp_europe_group" && dayIndex % 6 === 0 ? -2 : 0;
    const leadBoost = campaign.id === "camp_egypt_budget" && dayIndex % 4 === 0 ? 3 : 0;
    const leads = Math.max(0, Math.round(base.leads * wave + leadPenalty + leadBoost));
    const ctr = Number(((clicks / impressions) * 100).toFixed(2));
    const cpc = Number((spend / clicks).toFixed(2));
    const cpm = Number(((spend / impressions) * 1000).toFixed(2));
    const cpl = leads ? Number((spend / leads).toFixed(2)) : 0;

    return {
      id: `stat_${campaign.id}_${dayIndex + 1}`,
      campaignId: campaign.id,
      adsetId: `adset_${campaign.campaignId}_${(dayIndex % 3) + 1}`,
      adId: `ad_${campaign.campaignId}_${(dayIndex % 5) + 1}`,
      date: toDateKey(addDays(start, dayIndex)),
      spend,
      impressions,
      reach,
      clicks,
      ctr,
      cpc,
      cpm,
      leads,
      cpl,
      createdAt,
      updatedAt
    };
  });
});

const statusFlow = [
  { amoName: "New Lead", crmName: "Yangi lid", type: "regular" },
  { amoName: "Contact Attempt", crmName: "Aloqa qilinmoqda", type: "regular" },
  { amoName: "Replied", crmName: "Javob berdi", type: "regular" },
  { amoName: "Interested", crmName: "Qiziqdi", type: "regular" },
  { amoName: "Consultation", crmName: "Maslahat berildi", type: "regular" },
  { amoName: "Offer Sent", crmName: "Taklif yuborildi", type: "regular" },
  { amoName: "Reservation", crmName: "Bron qildi", type: "regular" },
  { amoName: "Payment", crmName: "To'lov qilindi", type: "success" },
  { amoName: "Won Client", crmName: "Sotuv bo'ldi", type: "success" },
  { amoName: "Lost / Spam", crmName: "Yo'qotildi / spam", type: "loss" }
] as const;

export const amoPipelines: AmoPipeline[] = [
  {
    id: "pipeline_tours",
    name: "Tour Sales",
    sort: 1,
    statuses: statusFlow.map((status, index) => ({
      id: `status_${index + 1}`,
      name: status.crmName,
      sort: index + 1,
      type: status.type
    }))
  }
];

const managers = [
  { id: "mgr_madina", name: "Madina Karimova" },
  { id: "mgr_azizbek", name: "Azizbek Tursunov" },
  { id: "mgr_shahlo", name: "Shahlo Nematova" }
];

const leadNames = [
  "Dilshod aka",
  "Malika opa",
  "Kamola",
  "Farruh",
  "Gulnoza",
  "Sardor",
  "Nilufar",
  "Otabek",
  "Zarina",
  "Jasur"
];

function scoreToStatus(score: number, index: number) {
  if (score <= 0) return "Lost / Spam";
  if (score === 1) return index % 2 === 0 ? "Contact Attempt" : "New Lead";
  if (score === 2) return "Replied";
  if (score === 3) return "Interested";
  if (score === 4) return "Consultation";
  if (score === 5) return "Reservation";
  return index % 2 === 0 ? "Payment" : "Won Client";
}

function statusId(status: string) {
  return `status_${statusFlow.findIndex((item) => item.amoName === status) + 1}`;
}

export const amoLeads: AmoLead[] = Array.from({ length: 92 }, (_, index) => {
  const campaign = facebookCampaigns[index % facebookCampaigns.length];
  const facebookAccount = facebookAccounts.find((account) => account.id === campaign.facebookAccountId);
  const base = campaignBases[campaign.id];
  const manager = managers[index % managers.length];
  const created = addDays(new Date("2026-05-02T08:00:00.000Z"), index % 31);
  const scoreNoise = index % 7 === 0 ? -2 : index % 5 === 0 ? -1 : index % 6 === 0 ? 1 : 0;
  const score = Math.max(0, Math.min(6, base.qualityBase + scoreNoise + (index % 9 === 0 ? 1 : 0)));
  const statusName = scoreToStatus(score, index);
  const isSale = statusName === "Payment" || statusName === "Won Client";
  const isUnmatched = index % 17 === 0;

  return {
    id: `lead_${index + 1}`,
    amoAccountId: facebookAccount?.amoAccountId ?? amoAccounts[0].id,
    amoLeadId: `${900000 + index}`,
    leadName: `${leadNames[index % leadNames.length]} - ${campaign.campaignName}`,
    statusId: statusId(statusName),
    statusName,
    pipelineId: amoPipelines[0].id,
    pipelineName: amoPipelines[0].name,
    responsibleUserId: manager.id,
    responsibleUserName: manager.name,
    price: isSale ? 620 + (index % 6) * 180 : 0,
    source: index % 4 === 0 ? "instagram" : "facebook",
    utmSource: isUnmatched ? undefined : index % 4 === 0 ? "instagram" : "facebook",
    utmMedium: isUnmatched ? undefined : "paid_social",
    utmCampaign: isUnmatched ? undefined : campaign.campaignName,
    utmContent: isUnmatched ? undefined : `creative_${(index % 5) + 1}`,
    utmTerm: index % 3 === 0 ? "family-tour" : "summer-tour",
    phone: `+99890${String(1100000 + index * 733).slice(0, 7)}`,
    contactName: leadNames[index % leadNames.length],
    lostReason:
      statusName === "Lost / Spam"
        ? index % 2 === 0
          ? "Spam lid"
          : "Wrong number"
        : undefined,
    firstResponseMinutes: score <= 1 ? 220 + index : 8 + ((index * 11) % 90),
    createdAtAmo: created.toISOString(),
    updatedAtAmo: addDays(created, Math.min(score + 1, 7)).toISOString(),
    createdAt,
    updatedAt
  };
});

export const leadQualityScores: LeadQualityScore[] = amoLeads.map((lead) => {
  const scoreMap: Record<string, { score: number; label: string; reason: string }> = {
    "Lost / Spam": { score: 0, label: "Spam / noto'g'ri raqam", reason: lead.lostReason ?? "Spam" },
    "New Lead": { score: 1, label: "Javob bermadi", reason: "Hali aloqa qilinmagan" },
    "Contact Attempt": { score: 1, label: "Javob bermadi", reason: "Bir necha urinishdan keyin javob yo'q" },
    Replied: { score: 2, label: "Javob berdi", reason: "Telefon orqali aloqa bo'lgan" },
    Interested: { score: 3, label: "Sayohatga qiziqdi", reason: "Yo'nalish va sana so'ragan" },
    Consultation: { score: 4, label: "Maslahat berildi", reason: "Operator batafsil maslahat bergan" },
    Reservation: { score: 5, label: "Bron qildi", reason: "Joy band qilingan" },
    Payment: { score: 6, label: "To'lov qilindi", reason: "To'lov qabul qilingan" },
    "Won Client": { score: 6, label: "Sotuv bo'ldi", reason: "Mijoz sotuvga aylandi" }
  };
  const quality = scoreMap[lead.statusName] ?? scoreMap["New Lead"];

  return {
    id: `quality_${lead.id}`,
    amoLeadId: lead.id,
    score: quality.score,
    qualityLabel: quality.label,
    reason: quality.reason,
    createdAt,
    updatedAt
  };
});

export const leadStatusHistory: LeadStatusHistory[] = amoLeads.flatMap((lead, leadIndex) => {
  const currentIndex = statusFlow.findIndex((status) => status.amoName === lead.statusName);
  const steps = Math.max(1, Math.min(currentIndex + 1, 7));

  return Array.from({ length: steps }, (_, stepIndex) => ({
    id: `history_${lead.id}_${stepIndex}`,
    amoLeadId: lead.id,
    oldStatus: stepIndex === 0 ? "Created" : statusFlow[stepIndex - 1].amoName,
    newStatus: statusFlow[stepIndex].amoName,
    changedAt: addDays(new Date(lead.createdAtAmo), stepIndex + (leadIndex % 2)).toISOString(),
    createdAt
  }));
});

export const leadMatches: LeadMatch[] = amoLeads.map((lead, index) => {
  const campaign = facebookCampaigns.find((item) => item.campaignName === lead.utmCampaign);

  if (!campaign) {
    return {
      id: `match_${lead.id}`,
      amoLeadId: lead.id,
      matchType: "unmatched",
      confidenceScore: 0,
      createdAt
    };
  }

  return {
    id: `match_${lead.id}`,
    amoLeadId: lead.id,
    facebookCampaignId: campaign.id,
    facebookAdsetId: `adset_${campaign.campaignId}_${(index % 3) + 1}`,
    facebookAdId: `ad_${campaign.campaignId}_${(index % 5) + 1}`,
    matchType: "utm_campaign",
    confidenceScore: 0.92,
    createdAt
  };
});

export const sales: Sale[] = amoLeads
  .filter((lead) => lead.statusName === "Payment" || lead.statusName === "Won Client")
  .map((lead, index) => ({
    id: `sale_${lead.id}`,
    amoLeadId: lead.id,
    amount: lead.price,
    saleDate: addDays(new Date(lead.updatedAtAmo), index % 3).toISOString().slice(0, 10),
    status: lead.statusName === "Payment" ? "paid" : "reserved",
    createdAt
  }));

export const kpiTargets: KpiTarget[] = [
  {
    id: "target_main",
    clientId: client.id,
    maxCpl: 11,
    maxCpa: 120,
    minRoas: 4.2,
    minConversionRate: 8,
    dailyBudget: 460,
    monthlyBudget: 12000,
    createdAt,
    updatedAt
  }
];

export const alerts: Alert[] = [
  {
    id: "alert_cpl_egypt",
    clientId: client.id,
    alertType: "spam_rate",
    title: "Egypt Budget Trips lid sifati past",
    message: "Spam lid ulushi 24% ga chiqdi. Reklama matni va forma savollarini tekshiring.",
    severity: "warning",
    isSent: true,
    sentAt: "2026-05-31T06:30:00.000Z",
    createdAt: "2026-05-31T06:00:00.000Z"
  },
  {
    id: "alert_europe_cpa",
    clientId: client.id,
    alertType: "high_cpa",
    title: "Europe Group Tour sotuv narxi oshdi",
    message: "Sotuv narxi maqsaddan 31% yuqori. Auditoriya toraygan bo'lishi mumkin.",
    severity: "critical",
    isSent: true,
    sentAt: "2026-05-31T07:15:00.000Z",
    createdAt: "2026-05-31T07:00:00.000Z"
  },
  {
    id: "alert_new_stage",
    clientId: client.id,
    alertType: "stale_new_leads",
    title: "Yangi lid bosqichida kutayotgan lidlar bor",
    message: "9 ta lid 2 soatdan beri yangi lid bosqichida. Operatorlarga vazifa bering.",
    severity: "warning",
    isSent: false,
    createdAt: "2026-05-31T08:00:00.000Z"
  }
];

export const telegramSubscribers: TelegramSubscriber[] = [
  {
    id: "tg_1",
    userId: "user_admin",
    chatId: "1002030405",
    isActive: true,
    createdAt
  }
];

export const syncLogs: SyncLog[] = [
  {
    id: "sync_fb_latest",
    integrationType: "facebook",
    status: "success",
    message: "Reklamalar va kunlik natijalar test adapteridan yangilandi.",
    startedAt: "2026-05-31T06:00:00.000Z",
    finishedAt: "2026-05-31T06:00:09.000Z"
  },
  {
    id: "sync_amo_latest",
    integrationType: "amo",
    status: "success",
    message: "Yangi lidlar, holatlar, operatorlar va sotuvlar test adapteridan yangilandi.",
    startedAt: "2026-05-31T06:30:00.000Z",
    finishedAt: "2026-05-31T06:30:12.000Z"
  },
  {
    id: "sync_alerts_latest",
    integrationType: "alerts",
    status: "success",
    message: "KPI limits checked and Telegram queue prepared.",
    startedAt: "2026-05-31T07:00:00.000Z",
    finishedAt: "2026-05-31T07:00:03.000Z"
  }
];
