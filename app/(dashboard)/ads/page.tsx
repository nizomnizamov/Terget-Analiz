import { CampaignPerformanceTable } from "@/components/campaign-performance-table";
import { RoasTrendChart } from "@/components/charts/roas-trend-chart";
import { MetricCard } from "@/components/metric-card";
import { HealthBadge } from "@/components/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaignPerformance, getDashboardOverview } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { getPageAccountId, getPageRange, type PageSearchParams } from "@/lib/page-range";
import { formatCurrency, formatNumber } from "@/lib/utils";

export default async function AdsPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const range = await getPageRange(searchParams);
  const accountId = await getPageAccountId(searchParams);
  const user = await getCurrentUser();
  const overview = getDashboardOverview(range, user, { facebookAccountId: accountId });
  const campaigns = getCampaignPerformance(range, user, { facebookAccountId: accountId });
  const roasMetric = overview.metrics.find((metric) => metric.key === "roas");
  const spendNoLead = campaigns.filter((campaign) => campaign.spend > 100 && campaign.leads === 0);
  const cheapLowQuality = campaigns.filter(
    (campaign) => campaign.cpl < 11 && campaign.averageQualityScore < 3
  );
  const lowLeadHighSales = campaigns.filter(
    (campaign) => campaign.leads < 120 && campaign.sales >= 3 && campaign.roas >= 4.2
  );

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {overview.metrics
          .filter((metric) => ["spend", "leads", "cpl", "cpa"].includes(metric.key))
          .map((metric) => (
            <MetricCard key={metric.key} metric={metric} />
          ))}
      </section>

      <Card>
        <CardHeader className="flex-row items-start justify-between gap-4">
          <CardTitle>Reklama qaytimi</CardTitle>
          <div className="rounded-md bg-muted px-3 py-1 text-sm font-semibold text-foreground">
            {roasMetric?.value ?? "0x"}
          </div>
        </CardHeader>
        <CardContent>
          <RoasTrendChart data={overview.trends} />
        </CardContent>
      </Card>

      <section className="grid gap-4 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader>
            <CardTitle>Asosiy reklamalar</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[overview.bestCampaign, overview.worstCampaign].filter(Boolean).map((campaign) => (
              <div key={campaign!.id} className="rounded-md border bg-card p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-medium">{campaign!.campaignName}</div>
                  <HealthBadge health={campaign!.health} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
                  <span>Qaytim {formatNumber(campaign!.roas)}x</span>
                  <span>Sotuv narxi {formatCurrency(campaign!.cpa)}</span>
                  <span>Sifatli lid {formatNumber(campaign!.qualifiedLeads)}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Pul ketdi, lid kelmadi</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {spendNoLead.length ? spendNoLead.map((item) => item.campaignName).join(", ") : "Hozircha yo'q"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Lid arzon, sifati past</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {cheapLowQuality.length ? cheapLowQuality.map((item) => item.campaignName).join(", ") : "Hozircha yo'q"}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Kam lid, yaxshi sotuv</CardTitle>
          </CardHeader>
          <CardContent className="text-sm font-medium">
            {lowLeadHighSales.length ? lowLeadHighSales.map((item) => item.campaignName).join(", ") : "Hozircha yo'q"}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Reklama jadvali</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignPerformanceTable data={campaigns} />
        </CardContent>
      </Card>
    </div>
  );
}
