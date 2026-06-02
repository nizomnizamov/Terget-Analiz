import Link from "next/link";
import { ArrowRight, CircleCheck, Sparkles, TriangleAlert } from "lucide-react";
import { OverviewTrendChart } from "@/components/charts/overview-trend-chart";
import { HealthBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboardOverview } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { getPageAccountId, getPageRange, type PageSearchParams } from "@/lib/page-range";
import { rangeToQuery } from "@/lib/date-range";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function OverviewPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const range = await getPageRange(searchParams);
  const accountId = await getPageAccountId(searchParams);
  const user = await getCurrentUser();
  const overview = getDashboardOverview(range, user, { facebookAccountId: accountId });
  const adsQuery = new URLSearchParams(rangeToQuery(range));
  if (accountId) {
    adsQuery.set("accountId", accountId);
  }
  const metric = (key: string) => overview.metrics.find((item) => item.key === key);
  const criticalAlerts = overview.alerts.filter((alert) => alert.severity === "critical");
  const mainMetrics = [
    { label: "Reklama xarajati", value: metric("spend")?.value ?? "-", helper: "reklamaga ketgan pul" },
    { label: "Lidlar soni", value: metric("leads")?.value ?? "-", helper: "jami kelgan murojaatlar" },
    { label: "Sifatli lidlar", value: metric("qualified")?.value ?? "-", helper: "sotuvga yaqin lidlar" },
    { label: "Sotuv soni", value: metric("sales")?.value ?? "-", helper: "sotuvga aylanganlar" }
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-4 py-2 md:grid-cols-[1fr_auto] md:items-end">
        <div className="max-w-3xl">
          <div className="mb-3 inline-flex items-center gap-2 rounded-md bg-foreground px-3 py-1 text-xs font-semibold text-background">
            <Sparkles className="h-3.5 w-3.5" />
            Bosh sahifa
          </div>
          <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
            Reklama va sotuv holati
          </h1>
        </div>
        <Link
          href={`/ads?${adsQuery.toString()}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-foreground px-4 text-sm font-semibold text-background transition-colors hover:bg-foreground/90"
        >
          Reklamalarni ko&apos;rish
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {mainMetrics.map((item) => (
          <Card key={item.label} className="p-5">
            <p className="text-sm font-semibold text-muted-foreground">{item.label}</p>
            <p className="mt-3 text-3xl font-semibold tracking-normal">{item.value}</p>
            <p className="mt-2 text-xs font-medium text-muted-foreground">{item.helper}</p>
          </Card>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <CardHeader>
            <CardTitle>Qisqa xulosa</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="flex items-start gap-3 rounded-md bg-emerald-50 p-4 dark:bg-emerald-950/30">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300">
                <CircleCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-emerald-950 dark:text-emerald-100">Eng yaxshi reklama</p>
                  {overview.bestCampaign ? <HealthBadge health={overview.bestCampaign.health} /> : null}
                </div>
                <p className="mt-1 text-sm text-emerald-900 dark:text-emerald-200">
                  {overview.bestCampaign?.campaignName ?? "Hali yetarli ma'lumot yo'q"}
                </p>
                {overview.bestCampaign ? (
                  <p className="mt-2 text-xs font-medium text-emerald-800 dark:text-emerald-300">
                    Reklama qaytimi {formatNumber(overview.bestCampaign.roas)}x / Tushum{" "}
                    {formatCurrency(overview.bestCampaign.revenue)}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-md bg-amber-50 p-4 dark:bg-amber-950/30">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white text-amber-700 dark:bg-amber-950/80 dark:text-amber-300">
                <TriangleAlert className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-amber-950 dark:text-amber-100">E&apos;tibor kerak</p>
                  {overview.worstCampaign ? <HealthBadge health={overview.worstCampaign.health} /> : null}
                </div>
                <p className="mt-1 text-sm text-amber-900 dark:text-amber-200">
                  {criticalAlerts[0]?.title ?? overview.worstCampaign?.campaignName ?? "Jiddiy muammo yo'q"}
                </p>
                <p className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300">
                  {criticalAlerts[0]?.message ??
                    `Sotuv narxi ${formatCurrency(overview.worstCampaign?.cpa ?? 0)} / Reklama qaytimi ${formatNumber(
                      overview.worstCampaign?.roas ?? 0
                    )}x`}
                </p>
              </div>
            </div>

            <div className="rounded-md bg-muted/60 p-4">
              <p className="text-sm font-semibold">Keyingi qadam</p>
              <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {overview.insights[0] ?? "Hozircha reklamalar barqaror. Ma'lumot yig'ilishini davom ettiring."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Natijalar o&apos;zgarishi</CardTitle>
          </CardHeader>
          <CardContent>
            <OverviewTrendChart data={overview.trends} />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
