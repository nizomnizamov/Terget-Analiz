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
  facebookBillingLimit?: string;
  facebookBillingWarnBefore?: string;
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
  billingLimit?: number;
  billingWarnBefore?: number;
};

export type AmoCredentials = {
  id: string;
  subdomain: string;
  baseUrl: string;
  accessToken: string;
  refreshToken?: string;
};

type AmoTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
  title?: string;
  detail?: string;
  hint?: string;
};

function clean(value?: string | null) {
  return value?.trim() ?? "";
}

function cleanNumber(value?: string | null) {
  const number = Number(clean(value));

  return Number.isFinite(number) && number > 0 ? number : null;
}

function optionalNumber(value?: Prisma.Decimal | number | string | null) {
  if (value === null || typeof value === "undefined") {
    return undefined;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : undefined;
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
    accessToken,
    billingLimit: optionalNumber(process.env.FACEBOOK_BILLING_LIMIT),
    billingWarnBefore: optionalNumber(process.env.FACEBOOK_BILLING_WARN_BEFORE)
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
          accessToken: account.accessToken,
          billingLimit: optionalNumber(account.billingLimit),
          billingWarnBefore: optionalNumber(account.billingWarnBefore)
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
          billingLimit: optionalNumber(account.billingLimit),
          billingWarnBefore: optionalNumber(account.billingWarnBefore),
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
          billingLimit: envAccount.billingLimit,
          billingWarnBefore: envAccount.billingWarnBefore,
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

export async function refreshAmoCredentials(current?: AmoCredentials | null): Promise<AmoCredentials> {
  const credentials = current ?? (await getAmoCredentials());
  const clientId = clean(process.env.AMO_CLIENT_ID);
  const clientSecret = clean(process.env.AMO_CLIENT_SECRET);
  const redirectUri = clean(process.env.AMO_REDIRECT_URI);

  if (!credentials?.refreshToken) {
    throw new Error("amoCRM refresh token topilmadi. Integratsiyani qayta ulang.");
  }

  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error("amoCRM tokenini yangilash uchun AMO_CLIENT_ID, AMO_CLIENT_SECRET va AMO_REDIRECT_URI kerak.");
  }

  const response = await fetch(`${credentials.baseUrl}/oauth2/access_token`, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: credentials.refreshToken,
      redirect_uri: redirectUri
    })
  });
  const body = (await response.json().catch(() => null)) as AmoTokenResponse | null;

  if (!response.ok) {
    throw new Error(body?.detail ?? body?.title ?? body?.hint ?? `amoCRM tokenini yangilab bo'lmadi: ${response.status}`);
  }

  const accessToken = clean(body?.access_token);
  const refreshToken = clean(body?.refresh_token);

  if (!accessToken || !refreshToken) {
    throw new Error("amoCRM token yangilash javobida access_token yoki refresh_token kelmadi.");
  }

  const expiresAt =
    typeof body?.expires_in === "number" && body.expires_in > 0
      ? new Date(Date.now() + body.expires_in * 1000)
      : null;
  const prisma = getPrisma();

  if (prisma) {
    await ensurePrimaryClient(prisma);
    await prisma.amoAccount.upsert({
      where: {
        id: credentials.id
      },
      create: {
        id: credentials.id,
        clientId: primaryClientId,
        subdomain: credentials.subdomain,
        accessToken,
        refreshToken,
        expiresAt,
        status: "active"
      },
      update: {
        accessToken,
        refreshToken,
        expiresAt,
        status: "active"
      }
    });
  } else {
    process.env.AMO_ACCESS_TOKEN = accessToken;
    process.env.AMO_REFRESH_TOKEN = refreshToken;
  }

  return {
    ...credentials,
    accessToken,
    refreshToken
  };
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

export async function saveTelegramChatId(chatId: string) {
  const prisma = getPrisma();
  const cleanChatId = clean(chatId);

  if (!prisma || !cleanChatId) {
    return false;
  }

  await ensureAdminUser(prisma);

  const existing = await prisma.telegramSubscriber.findFirst({
    where: {
      chatId: cleanChatId
    }
  });

  if (existing) {
    await prisma.telegramSubscriber.update({
      where: {
        id: existing.id
      },
      data: {
        userId: adminUserId,
        isActive: true
      }
    });
  } else {
    await prisma.telegramSubscriber.create({
      data: {
        userId: adminUserId,
        chatId: cleanChatId,
        isActive: true
      }
    });
  }

  return true;
}

export async function deactivateTelegramChatId(chatId: string) {
  const prisma = getPrisma();
  const cleanChatId = clean(chatId);

  if (!prisma || !cleanChatId) {
    return false;
  }

  await prisma.telegramSubscriber.updateMany({
    where: {
      chatId: cleanChatId
    },
    data: {
      isActive: false
    }
  });

  return true;
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
  const login = clean(process.env.APP_ADMIN_LOGIN) || clean(process.env.APP_ADMIN_EMAIL) || "admin";

  await prisma.user.upsert({
    where: {
      id: adminUserId
    },
    create: {
      id: adminUserId,
      name: process.env.APP_ADMIN_NAME ?? "Administrator",
      email: login,
      passwordHash: "env-managed-admin",
      role: "admin"
    },
    update: {
      name: process.env.APP_ADMIN_NAME ?? "Administrator",
      email: login
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
  const facebookBillingLimit = cleanNumber(input.facebookBillingLimit);
  const facebookBillingWarnBefore = cleanNumber(input.facebookBillingWarnBefore);

  if (
    facebookAccountName ||
    facebookAdAccountId ||
    facebookAccessToken ||
    typeof input.facebookBillingLimit === "string" ||
    typeof input.facebookBillingWarnBefore === "string"
  ) {
    const existing = await prisma.facebookAccount.findUnique({
      where: {
        id: primaryFacebookAccountId
      }
    });
    const updateData: Prisma.FacebookAccountUpdateInput = {
      accountName: facebookAccountName || existing?.accountName || "Meta Ads",
      adAccountId: facebookAdAccountId || existing?.adAccountId || "",
      status: facebookAdAccountId || existing?.adAccountId ? "active" : "error",
      billingLimit: facebookBillingLimit,
      billingWarnBefore: facebookBillingWarnBefore
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
        billingLimit: facebookBillingLimit,
        billingWarnBefore: facebookBillingWarnBefore,
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

  if (typeof input.telegramChatIds === "string") {
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
