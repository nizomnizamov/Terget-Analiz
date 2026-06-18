import { CheckCircle2, Database, Facebook, MessageCircle, TriangleAlert } from "lucide-react";
import { SettingsConnectionsForm } from "@/components/settings-connections-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getIntegrationSummary } from "@/lib/integration-settings";
import { kpiTargets, syncLogs } from "@/lib/production-data";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const statusLabel = {
  active: "Ulangan",
  paused: "To'xtatilgan",
  error: "Xatolik"
};

const syncLabel = {
  facebook: "Meta Ads",
  amo: "amoCRM",
  alerts: "Ogohlantirish",
  telegram: "Telegram"
};

function optionalMetric(value: number, formatter: (value: number) => string) {
  return value > 0 ? formatter(value) : "Sozlanmagan";
}

export default function SettingsPage() {
  const target = kpiTargets[0];
  const summaryPromise = getIntegrationSummary();

  return <SettingsContent target={target} summaryPromise={summaryPromise} />;
}

async function SettingsContent({
  target,
  summaryPromise
}: {
  target: typeof kpiTargets[number];
  summaryPromise: ReturnType<typeof getIntegrationSummary>;
}) {
  const summary = await summaryPromise;
  const facebookAccount = summary.facebookAccounts[0];
  const amoAccount = summary.amoAccounts[0];
  const readinessItems = [
    { label: "Admin login", ready: Boolean(process.env.APP_ADMIN_LOGIN ?? process.env.APP_ADMIN_EMAIL) },
    { label: "Admin parol", ready: Boolean(process.env.APP_ADMIN_PASSWORD) },
    { label: "Ma'lumotlar bazasi", ready: summary.databaseReady },
    { label: "Kirish xavfsizligi", ready: Boolean(process.env.NEXTAUTH_SECRET) },
    { label: "Meta Ads ulanishi", ready: summary.facebookAccounts.length > 0 },
    { label: "Meta Ads akkaunt", ready: Boolean(facebookAccount?.adAccountId) },
    { label: "Viza ogohlantirish limiti", ready: Boolean(facebookAccount?.billingLimit) },
    { label: "amoCRM ulanishi", ready: summary.amoAccounts.length > 0 },
    {
      label: "amoCRM token yangilash",
      ready: Boolean(process.env.AMO_CLIENT_ID && process.env.AMO_CLIENT_SECRET && process.env.AMO_REDIRECT_URI)
    },
    { label: "Telegram bot", ready: summary.telegram.hasBotToken },
    { label: "Telegram chat ID", ready: summary.telegram.chatIds.length > 0 },
    { label: "Avtomatik hisobot", ready: Boolean(process.env.CRON_SECRET) }
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              Meta Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {summary.facebookAccounts.length ? (
              summary.facebookAccounts.map((account) => (
                <div key={account.id} className="rounded-md border bg-card px-3 py-2">
                  <p className="font-medium">{account.accountName}</p>
                  <p className="text-muted-foreground">{account.adAccountId}</p>
                  <p className="font-semibold text-emerald-700">{statusLabel[account.status]}</p>
                </div>
              ))
            ) : (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground">
                Meta Ads hali ulanmagan.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              amoCRM
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            {summary.amoAccounts[0] ? (
              <>
                <p className="font-medium">{summary.amoAccounts[0].subdomain}.amocrm.ru</p>
                <p className="font-semibold text-emerald-700">{statusLabel[summary.amoAccounts[0].status]}</p>
              </>
            ) : (
              <p className="rounded-md border bg-muted/40 px-3 py-2 text-muted-foreground">
                amoCRM hali ulanmagan.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              Telegram
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p className="font-medium">Har kuni 09:00 da kunlik hisobot</p>
            <p className={summary.telegram.chatIds.length ? "font-semibold text-emerald-700" : "text-muted-foreground"}>
              {summary.telegram.chatIds.length ? "Qabul qiluvchi ulangan" : "Chat ID kiritilmagan"}
            </p>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ulanishlarni sozlash</CardTitle>
        </CardHeader>
        <CardContent>
          <SettingsConnectionsForm
            databaseReady={summary.databaseReady}
            facebookAdAccountId={facebookAccount?.adAccountId}
            facebookBillingLimit={facebookAccount?.billingLimit}
            facebookBillingWarnBefore={facebookAccount?.billingWarnBefore}
            amoSubdomain={amoAccount?.subdomain}
            telegramChatIds={summary.telegram.chatIds}
          />
        </CardContent>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <CardHeader>
            <CardTitle>Maqsadlar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm">
            <div className="flex justify-between gap-3">
              <span>1 lid uchun maksimum</span>
              <strong>{optionalMetric(target.maxCpl, formatCurrency)}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>1 sotuv uchun maksimum</span>
              <strong>{optionalMetric(target.maxCpa, formatCurrency)}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Minimal qaytim</span>
              <strong>{target.minRoas > 0 ? `${formatNumber(target.minRoas)}x` : "Sozlanmagan"}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Minimal sotuvga aylanish</span>
              <strong>{optionalMetric(target.minConversionRate, formatPercent)}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Kunlik byudjet</span>
              <strong>{optionalMetric(target.dailyBudget, formatCurrency)}</strong>
            </div>
            <div className="flex justify-between gap-3">
              <span>Oylik byudjet</span>
              <strong>{optionalMetric(target.monthlyBudget, formatCurrency)}</strong>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Texnik tayyorgarlik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {readinessItems.map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                  <span className="font-medium">{item.label}</span>
                  {item.ready ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
                  ) : (
                    <TriangleAlert className="h-4 w-4 shrink-0 text-amber-700" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Oxirgi yangilanishlar</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3">
          {syncLogs.length ? (
            syncLogs.map((log) => (
              <div key={log.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                <span className="font-medium">{syncLabel[log.integrationType]}</span>
                <span className="text-muted-foreground">
                  {log.finishedAt ? new Date(log.finishedAt).toLocaleString("uz-UZ") : "Jarayonda"}
                </span>
                <span className="font-semibold text-emerald-700">
                  {log.status === "success" ? "Tayyor" : log.status === "running" ? "Jarayonda" : "Xatolik"}
                </span>
              </div>
            ))
          ) : (
            <p className="rounded-md border bg-muted/40 px-3 py-3 text-sm text-muted-foreground">
              Hali yangilanish tarixi yo&apos;q.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
