import { Link2, MousePointerClick, ShieldCheck, Target } from "lucide-react";
import { MatchingWorkbench } from "@/components/matching-workbench";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCampaignPerformance } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { getPageAccountId, getPageRange, type PageSearchParams } from "@/lib/page-range";
import { getMatchingSummary, getUnmatchedLeads } from "@/lib/services/matching";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function MatchingPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const range = await getPageRange(searchParams);
  const accountId = await getPageAccountId(searchParams);
  const user = await getCurrentUser();
  const [summary, unmatched, campaignPerformance] = await Promise.all([
    getMatchingSummary(range),
    getUnmatchedLeads(range),
    getCampaignPerformance(range, user, { facebookAccountId: accountId })
  ]);
  const campaigns = campaignPerformance.map((campaign) => ({
    id: campaign.id,
    campaignName: campaign.campaignName,
    health: campaign.health,
    leads: campaign.leads,
    sales: campaign.sales,
    cpl: campaign.cpl,
    roas: campaign.roas
  }));

  const metrics = [
    {
      label: "Barcha lidlar",
      value: formatNumber(summary.total),
      detail: `${formatNumber(summary.autoMatched)} avtomatik`,
      icon: Target,
      tone: "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300"
    },
    {
      label: "Bog'langan",
      value: formatNumber(summary.matched),
      detail: formatPercent((summary.matched / Math.max(summary.total, 1)) * 100),
      icon: Link2,
      tone: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"
    },
    {
      label: "Bog'lanmagan",
      value: formatNumber(summary.unmatched),
      detail: "Qo'lda bog'lash",
      icon: MousePointerClick,
      tone: "bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
    },
    {
      label: "Moslik aniqligi",
      value: formatPercent(summary.averageConfidence),
      detail: "O'rtacha aniqlik",
      icon: ShieldCheck,
      tone: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-300"
    }
  ];

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;

          return (
            <Card key={metric.label} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.label}</p>
                  <p className="mt-2 text-3xl font-semibold">{metric.value}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{metric.detail}</p>
                </div>
                <div className={`flex h-9 w-9 items-center justify-center rounded-md ${metric.tone}`}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </Card>
          );
        })}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lidlarni reklama bilan bog&apos;lash</CardTitle>
        </CardHeader>
        <CardContent>
          <MatchingWorkbench leads={unmatched} campaigns={campaigns} />
        </CardContent>
      </Card>
    </div>
  );
}
