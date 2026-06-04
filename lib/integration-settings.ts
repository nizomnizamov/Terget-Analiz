import { Prisma } from "@prisma/client";
import { getPrisma, hasDatabase } from "@/lib/prisma";
import { client } from "@/lib/production-data";
import type { AmoAccount, FacebookAccount } from "@/lib/types";

const primaryClientId = client.id;
const primaryFacebookAccountId = "facebook_account_primary";
const primaryAmoAccountId = "amo_account_primary";
const adminUserId = "user_admin";

type SaveIntegrationInput = {
  facebookAccountName?: string;
  facebookAdAccountId?: string;
  facebookAccessToken?: string;
  amoSubdomain?: string;
  amoAccessToken?: string;
  amoRefreshToken?: string;
  telegramChatIds?: string;
};

export type FacebookCredentials = {
  id: string;
  accountName: string;
  adAccountId: string;
  accessToken: string;
};

export type AmoCredentials = {
  id: string;
  subdomain: string;
  baseUrl: string;
  accessToken: string;
  refreshToken?: string;
};

function clean(value?: string | null) {
  return value?.trim() ?? "";
}

function iso(value: Date | string) {
  return value instanceof Date ? value.toISOString() : value;
}

function envFacebookCredentials(): FacebookCredentials | null {
  const accessToken = clean(process.env.FACEBOOK_ACCESS_TOKEN);
  const adAccountId = clean(process.env.FACEBOOK_AD_ACCOUNT_ID);

  if (!accessToken || !adAccountId) {
    return null;
  }

  return {
    id: primaryFacebookAccountId,
    accountName: clean(process.env.FACEBOOK_ACCOUNT_NAME) || "Meta Ads",
    adAccountId,
    accessToken
  };
}

function envAmoCredentials(): AmoCredentials | null {
  const accessToken = clean(process.env.AMO_ACCESS_TOKEN);
  const subdomain = clean(process.env.AMO_SUBDOMAIN);
  const baseUrl = clean(process.env.AMO_BASE_URL) || (subdomain ? `https://${subdomain}.amocrm.ru` : "");

  if (!accessToken || !baseUrl) {
    return null;
  }

  return {
    id: primaryAmoAccountId,
    subdomain,
    baseUrl,
    accessToken,
    refreshToken: clean(process.env.AMO_REFRESH_TOKEN) || undefined
  };
}

export async function getFacebookCredentials(): Promise<FacebookCredentials | null> {
  const prisma = getPrisma();

  if (prisma) {
    try {
      const account = await prisma.facebookAccount.findFirst({
        where: {
          status: "active",
          accessToken: {
            not: null
          }
        },
        orderBy: {
          updatedAt: "desc"
        }
      });

      if (account?.accessToken && account.adAccountId) {
        return {
          id: account.id,
          accountName: account.accountName,
          adAccountId: account.adAccountId,
          accessToken: account.accessToken
        };
      }
    } catch (error) {
      console.warn("[integrations] Facebook baza sozlamalarini o'qib bo'lmadi", error);
    }
  }

  return envFacebookCredentials();
}

export async function getFacebookAccountProfiles(): Promise<FacebookAccount[]> {
  const prisma = getPrisma();

  if (prisma) {
    try {
      const accounts = await prisma.facebookAccount.findMany({
        orderBy: {
          updatedAt: "desc"
        }
      });

      if (accounts.length) {
        return accounts.map((account) => ({
          id: account.id,
          clientId: account.clientId,
          accountName: account.accountName,
          adAccountId: account.adAccountId,
          status: account.status,
          createdAt: iso(account.createdAt),
          updatedAt: iso(account.updatedAt)
        }));
      }
    } catch (error) {
      console.warn("[integrations] Facebook profillarini o'qib bo'lmadi", error);
    }
  }

  const envAccount = envFacebookCredentials();

  return envAccount
    ? [
        {
          id: envAccount.id,
          clientId: primaryClientId,
          accountName: envAccount.accountName,
          adAccountId: envAccount.adAccountId,
          status: "active",
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        }
      ]
    : [];
}

export async function getAmoCredentials(): Promise<AmoCredentials | null> {
  const prisma = getPrisma();

  if (prisma) {
    try {
      const account = await prisma.amoAccount.findFirst({
        where: {
          status: "active",
          accessToken: {
            not: null
          }
        },
        orderBy: {
          updatedAt: "desc"
        }
      });

      if (account?.accessToken && account.subdomain) {
        return {
          id: account.id,
          subdomain: account.subdomain,
          baseUrl: `https://${account.subdomain}.amocrm.ru`,
          accessToken: account.accessToken,
          refreshToken: account.refreshToken ?? undefined
        };
      }
    } catch (error) {
      console.warn("[integrations] amoCRM baza sozlamalarini o'qib bo'lmadi", error);
    }
  }

  return envAmoCredentials();
}

export async function getAmoAccountProfiles(): Promise<AmoAccount[]> {
  const prisma = getPrisma();

  if (prisma) {
    try {
      const accounts = await prisma.amoAccount.findMany({
        orderBy: {
          updatedAt: "desc"
        }
      });

      if (accounts.length) {
        return accounts.map((account) => ({
          id: account.id,
          clientId: account.clientId,
          subdomain: account.subdomain,
          status: account.status,
          createdAt: iso(account.createdAt),
          updatedAt: iso(account.updatedAt)
        }));
      }
    } catch (error) {
      console.warn("[integrations] amoCRM profillarini o'qib bo'lmadi", error);
    }
  }

  const envAccount = envAmoCredentials();

  return envAccount
    ? [
        {
          id: envAccount.id,
          clientId: primaryClientId,
          subdomain: envAccount.subdomain || "amoCRM",
          status: "active",
          createdAt: client.createdAt,
          updatedAt: client.updatedAt
        }
      ]
    : [];
}

export async function getTelegramChatIds() {
  const envChatIds = process.env.TELEGRAM_CHAT_IDS ?? process.env.TELEGRAM_CHAT_ID;
  const fromEnv = envChatIds
    ? envChatIds
        .split(",")
        .map((chatId) => chatId.trim())
        .filter(Boolean)
    : [];

  const prisma = getPrisma();

  if (!prisma) {
    return fromEnv;
  }

  try {
    const subscribers = await prisma.telegramSubscriber.findMany({
      where: {
        isActive: true
      }
    });
    const fromDb = subscribers.map((subscriber) => subscriber.chatId);

    return Array.from(new Set([...fromDb, ...fromEnv]));
  } catch (error) {
    console.warn("[integrations] Telegram chat IDlarini o'qib bo'lmadi", error);

    return fromEnv;
  }
}

export async function getIntegrationSummary() {
  const [facebookAccounts, amoAccounts, telegramChatIds] = await Promise.all([
    getFacebookAccountProfiles(),
    getAmoAccountProfiles(),
    getTelegramChatIds()
  ]);

  return {
    databaseReady: hasDatabase(),
    facebookAccounts,
    amoAccounts,
    telegram: {
      hasBotToken: Boolean(process.env.TELEGRAM_BOT_TOKEN),
      chatIds: telegramChatIds
    }
  };
}

async function ensurePrimaryClient(prisma: NonNullable<ReturnType<typeof getPrisma>>) {
  await prisma.client.upsert({
    where: {
      id: primaryClientId
    },
    create: {
      id: primaryClientId,
      name: client.name,
      currency: client.currency,
      timezone: client.timezone
    },
    update: {
      name: client.name,
      currency: client.currency,
      timezone: client.timezone
    }
  });
}

async function ensureAdminUser(prisma: NonNullable<ReturnType<typeof getPrisma>>) {
  const email = clean(process.env.APP_ADMIN_EMAIL) || "admin@targel.uz";

  await prisma.user.upsert({
    where: {
      id: adminUserId
    },
    create: {
      id: adminUserId,
      name: process.env.APP_ADMIN_NAME ?? "Administrator",
      email,
      passwordHash: "env-managed-admin",
      role: "admin"
    },
    update: {
      name: process.env.APP_ADMIN_NAME ?? "Administrator",
      email
    }
  });
}

export async function saveIntegrationSettings(input: SaveIntegrationInput) {
  const prisma = getPrisma();

  if (!prisma) {
    return {
      ok: false,
      error: "Paneldan saqlash uchun DATABASE_URL kerak. Hozircha tokenlarni Vercel Environment Variables orqali kiriting."
    };
  }

  await ensurePrimaryClient(prisma);

  const facebookAccountName = clean(input.facebookAccountName);
  const facebookAdAccountId = clean(input.facebookAdAccountId);
  const facebookAccessToken = clean(input.facebookAccessToken);

  if (facebookAccountName || facebookAdAccountId || facebookAccessToken) {
    const existing = await prisma.facebookAccount.findUnique({
      where: {
        id: primaryFacebookAccountId
      }
    });
    const updateData: Prisma.FacebookAccountUpdateInput = {
      accountName: facebookAccountName || existing?.accountName || "Meta Ads",
      adAccountId: facebookAdAccountId || existing?.adAccountId || "",
      status: facebookAdAccountId || existing?.adAccountId ? "active" : "error"
    };

    if (facebookAccessToken) {
      updateData.accessToken = facebookAccessToken;
    }

    await prisma.facebookAccount.upsert({
      where: {
        id: primaryFacebookAccountId
      },
      create: {
        id: primaryFacebookAccountId,
        clientId: primaryClientId,
        accountName: facebookAccountName || "Meta Ads",
        adAccountId: facebookAdAccountId,
        accessToken: facebookAccessToken || null,
        status: facebookAdAccountId && facebookAccessToken ? "active" : "error"
      },
      update: updateData
    });
  }

  const amoSubdomain = clean(input.amoSubdomain).replace(/^https?:\/\//, "").replace(/\.amocrm\.(ru|com)\/?$/, "");
  const amoAccessToken = clean(input.amoAccessToken);
  const amoRefreshToken = clean(input.amoRefreshToken);

  if (amoSubdomain || amoAccessToken || amoRefreshToken) {
    const existing = await prisma.amoAccount.findUnique({
      where: {
        id: primaryAmoAccountId
      }
    });
    const updateData: Prisma.AmoAccountUpdateInput = {
      subdomain: amoSubdomain || existing?.subdomain || "",
      status: amoSubdomain || existing?.subdomain ? "active" : "error"
    };

    if (amoAccessToken) {
      updateData.accessToken = amoAccessToken;
    }

    if (amoRefreshToken) {
      updateData.refreshToken = amoRefreshToken;
    }

    await prisma.amoAccount.upsert({
      where: {
        id: primaryAmoAccountId
      },
      create: {
        id: primaryAmoAccountId,
        clientId: primaryClientId,
        subdomain: amoSubdomain,
        accessToken: amoAccessToken || null,
        refreshToken: amoRefreshToken || null,
        status: amoSubdomain && amoAccessToken ? "active" : "error"
      },
      update: updateData
    });
  }

  const telegramChatIds = clean(input.telegramChatIds);

  if (telegramChatIds) {
    await ensureAdminUser(prisma);
    const chatIds = telegramChatIds
      .split(",")
      .map((chatId) => chatId.trim())
      .filter(Boolean);

    await prisma.telegramSubscriber.deleteMany({
      where: {
        userId: adminUserId
      }
    });

    if (chatIds.length) {
      await prisma.telegramSubscriber.createMany({
        data: chatIds.map((chatId) => ({
          userId: adminUserId,
          chatId,
          isActive: true
        }))
      });
    }
  }

  return {
    ok: true,
    summary: await getIntegrationSummary()
  };
}
