export type UserRole = "admin" | "client" | "manager";

export type DateRangeKey =
  | "today"
  | "yesterday"
  | "last7"
  | "last30"
  | "thisMonth"
  | "lastMonth"
  | "custom";

export type ReportScope = {
  facebookAccountId?: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  managerId?: string;
  createdAt: string;
  updatedAt: string;
};

export type Client = {
  id: string;
  name: string;
  currency: "USD" | "UZS";
  timezone: string;
  createdAt: string;
  updatedAt: string;
};

export type FacebookAccount = {
  id: string;
  clientId: string;
  amoAccountId?: string;
  accountName: string;
  adAccountId: string;
  billingLimit?: number;
  billingWarnBefore?: number;
  status: "active" | "paused" | "error";
  createdAt: string;
  updatedAt: string;
};

export type AmoAccount = {
  id: string;
  clientId: string;
  subdomain: string;
  status: "active" | "paused" | "error";
  createdAt: string;
  updatedAt: string;
};

export type AmoStatus = {
  id: string;
  name: string;
  sort: number;
  type: "regular" | "success" | "loss";
};

export type AmoPipeline = {
  id: string;
  name: string;
  sort: number;
  statuses: AmoStatus[];
};

export type FacebookCampaign = {
  id: string;
  facebookAccountId: string;
  campaignId: string;
  campaignName: string;
  objective: string;
  status: "ACTIVE" | "PAUSED";
  createdAt: string;
  updatedAt: string;
};

export type FacebookDailyStat = {
  id: string;
  campaignId: string;
  adsetId: string;
  adId: string;
  date: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  cpl: number;
  createdAt: string;
  updatedAt: string;
};

export type AmoLead = {
  id: string;
  amoAccountId: string;
  amoLeadId: string;
  leadName: string;
  statusId: string;
  statusName: string;
  pipelineId: string;
  pipelineName: string;
  responsibleUserId: string;
  responsibleUserName: string;
  price: number;
  source: "facebook" | "instagram" | "manual" | "telegram";
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  phone: string;
  contactName: string;
  lostReason?: string;
  firstResponseMinutes?: number;
  createdAtAmo: string;
  updatedAtAmo: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadStatusHistory = {
  id: string;
  amoLeadId: string;
  oldStatus: string;
  newStatus: string;
  changedAt: string;
  createdAt: string;
};

export type LeadQualityScore = {
  id: string;
  amoLeadId: string;
  score: number;
  qualityLabel: string;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type LeadMatch = {
  id: string;
  amoLeadId: string;
  facebookCampaignId?: string;
  facebookAdsetId?: string;
  facebookAdId?: string;
  matchType:
    | "utm_campaign"
    | "utm_content"
    | "ad_id"
    | "adset_id"
    | "campaign_id"
    | "source"
    | "manual"
    | "unmatched";
  confidenceScore: number;
  createdAt: string;
};

export type Sale = {
  id: string;
  amoLeadId: string;
  amount: number;
  saleDate: string;
  status: "paid" | "reserved" | "refunded";
  createdAt: string;
};

export type KpiTarget = {
  id: string;
  clientId: string;
  maxCpl: number;
  maxCpa: number;
  minRoas: number;
  minConversionRate: number;
  dailyBudget: number;
  monthlyBudget: number;
  createdAt: string;
  updatedAt: string;
};

export type AlertSeverity = "info" | "warning" | "critical";

export type Alert = {
  id: string;
  clientId: string;
  alertType: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  isSent: boolean;
  sentAt?: string;
  createdAt: string;
};

export type TelegramSubscriber = {
  id: string;
  userId: string;
  chatId: string;
  isActive: boolean;
  createdAt: string;
};

export type SyncLog = {
  id: string;
  integrationType: "facebook" | "amo" | "alerts" | "telegram";
  status: "success" | "failed" | "running";
  message: string;
  startedAt: string;
  finishedAt?: string;
};

export type KpiMetric = {
  key: string;
  label: string;
  value: string;
  rawValue: number;
  change: number;
  status: "good" | "neutral" | "warning" | "bad";
};

export type TrendPoint = {
  date: string;
  spend: number;
  leads: number;
  qualifiedLeads: number;
  sales: number;
  revenue: number;
  cpl: number;
  roas: number;
};

export type CampaignPerformance = {
  id: string;
  campaignName: string;
  spend: number;
  impressions: number;
  reach: number;
  clicks: number;
  ctr: number;
  cpc: number;
  cpm: number;
  leads: number;
  cpl: number;
  qualifiedLeads: number;
  sales: number;
  cpa: number;
  revenue: number;
  roas: number;
  averageQualityScore: number;
  recommendation: string;
  health: "scale" | "watch" | "pause" | "learning";
};

export type FunnelStage = {
  id: string;
  name: string;
  pipelineId: string;
  pipelineName: string;
  sort: number;
  isWon: boolean;
  isLost: boolean;
  leads: number;
  share: number;
  nextConversion: number;
  averageStayHours: number;
  lostLeads: number;
  lostReason?: string;
};

export type LeadQualityCampaign = {
  campaignName: string;
  averageScore: number;
  qualifiedLeadRate: number;
  spamRate: number;
  repliedRate: number;
  interestedRate: number;
  saleConversionRate: number;
};

export type ManagerMetric = {
  managerId: string;
  managerName: string;
  leads: number;
  repliedLeads: number;
  contactRate: number;
  qualifiedLeadRate: number;
  saleConversion: number;
  averageResponseMinutes: number;
  lostLeads: number;
  wonDeals: number;
  revenue: number;
};

export type DashboardOverview = {
  metrics: KpiMetric[];
  trends: TrendPoint[];
  funnel: FunnelStage[];
  campaignPerformance: CampaignPerformance[];
  alerts: Alert[];
  bestCampaign?: CampaignPerformance;
  worstCampaign?: CampaignPerformance;
  insights: string[];
};
