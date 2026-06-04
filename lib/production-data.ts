import type {
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

const createdAt = "2026-06-01T00:00:00.000Z";
const updatedAt = createdAt;

function numberFromEnv(key: string, fallback = 0) {
  const value = Number(process.env[key]);

  return Number.isFinite(value) ? value : fallback;
}

export const client: Client = {
  id: "client_primary",
  name: process.env.APP_CLIENT_NAME ?? "Targel Analiz",
  currency: process.env.APP_CURRENCY === "UZS" ? "UZS" : "USD",
  timezone: process.env.APP_TIMEZONE ?? "Asia/Tashkent",
  createdAt,
  updatedAt
};

export const adminCredentials = {
  login: process.env.APP_ADMIN_LOGIN ?? process.env.APP_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "",
  password: process.env.APP_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? "",
  name: process.env.APP_ADMIN_NAME ?? "Administrator"
};

export const users: User[] =
  adminCredentials.login && adminCredentials.password
    ? [
        {
          id: "user_admin",
          name: adminCredentials.name,
          email: adminCredentials.login,
          role: "admin",
          createdAt,
          updatedAt
        }
      ]
    : [];

export const facebookAccounts: FacebookAccount[] =
  process.env.FACEBOOK_AD_ACCOUNT_ID && process.env.FACEBOOK_ACCESS_TOKEN
    ? [
        {
          id: "facebook_account_primary",
          clientId: client.id,
          amoAccountId: process.env.AMO_SUBDOMAIN ? "amo_account_primary" : undefined,
          accountName: process.env.FACEBOOK_ACCOUNT_NAME ?? "Meta Ads",
          adAccountId: process.env.FACEBOOK_AD_ACCOUNT_ID,
          status: "active",
          createdAt,
          updatedAt
        }
      ]
    : [];

export const amoAccounts: AmoAccount[] =
  process.env.AMO_SUBDOMAIN && (process.env.AMO_ACCESS_TOKEN || process.env.AMO_REFRESH_TOKEN)
    ? [
        {
          id: "amo_account_primary",
          clientId: client.id,
          subdomain: process.env.AMO_SUBDOMAIN,
          status: "active",
          createdAt,
          updatedAt
        }
      ]
    : [];

export const facebookCampaigns: FacebookCampaign[] = [];
export const facebookDailyStats: FacebookDailyStat[] = [];
export const amoPipelines: AmoPipeline[] = [];
export const amoLeads: AmoLead[] = [];
export const leadQualityScores: LeadQualityScore[] = [];
export const leadStatusHistory: LeadStatusHistory[] = [];
export const leadMatches: LeadMatch[] = [];
export const sales: Sale[] = [];
export const alerts: Alert[] = [];
export const telegramSubscribers: TelegramSubscriber[] = [];
export const syncLogs: SyncLog[] = [];

export const kpiTargets: KpiTarget[] = [
  {
    id: "target_primary",
    clientId: client.id,
    maxCpl: numberFromEnv("KPI_MAX_CPL"),
    maxCpa: numberFromEnv("KPI_MAX_CPA"),
    minRoas: numberFromEnv("KPI_MIN_ROAS"),
    minConversionRate: numberFromEnv("KPI_MIN_CONVERSION_RATE"),
    dailyBudget: numberFromEnv("KPI_DAILY_BUDGET"),
    monthlyBudget: numberFromEnv("KPI_MONTHLY_BUDGET"),
    createdAt,
    updatedAt
  }
];
