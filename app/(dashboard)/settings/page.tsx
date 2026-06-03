import { CheckCircle2, Database, Facebook, MessageCircle, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { amoAccounts, facebookAccounts, kpiTargets, syncLogs } from "@/lib/production-data";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const envItems = [
  { key: "APP_ADMIN_EMAIL", label: "Admin email" },
  { key: "APP_ADMIN_PASSWORD", label: "Admin parol" },
  { key: "DATABASE_URL", label: "Ma'lumotlar bazasi" },
  { key: "NEXTAUTH_SECRET", label: "Kirish xavfsizligi" },
  { key: "FACEBOOK_ACCESS_TOKEN", label: "Meta Ads ulanishi" },
  { key: "FACEBOOK_AD_ACCOUNT_ID", label: "Meta Ads akkaunt" },
  { key: "AMO_SUBDOMAIN", label: "amoCRM ulanishi" },
  { key: "TELEGRAM_BOT_TOKEN", label: "Telegram bot" },
  { key: "CRON_SECRET", label: "Avtomatik yangilash" }
];

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
            {facebookAccounts.length ? (
              facebookAccounts.map((account) => (
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
            {amoAccounts[0] ? (
              <>
                <p className="font-medium">{amoAccounts[0].subdomain}.amocrm.com</p>
                <p className="font-semibold text-emerald-700">{statusLabel[amoAccounts[0].status]}</p>
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
            <p className="font-medium">Har kuni 22:00 da kunlik hisobot</p>
            <p className="text-muted-foreground">Haftalik va oylik hisobotlar ham avtomatik yuboriladi</p>
          </CardContent>
        </Card>
      </section>

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
              {envItems.map((item) => (
                <div key={item.key} className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-2 text-sm">
                  <span className="font-medium">{item.label}</span>
                  {process.env[item.key] ? (
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
