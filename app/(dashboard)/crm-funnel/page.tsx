import { FunnelChart } from "@/components/charts/funnel-chart";
import { FunnelStageTable } from "@/components/funnel-stage-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getFunnelAnalytics } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { getPageAccountId, getPageRange, type PageSearchParams } from "@/lib/page-range";
import { formatNumber, formatPercent } from "@/lib/utils";

export default async function CrmFunnelPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const range = await getPageRange(searchParams);
  const accountId = await getPageAccountId(searchParams);
  const user = await getCurrentUser();
  const funnel = getFunnelAnalytics(range, user, { facebookAccountId: accountId });
  const total = funnel.reduce((sum, stage) => sum + stage.leads, 0);
  const won = funnel.filter((stage) => stage.isWon).reduce((sum, stage) => sum + stage.leads, 0);
  const lost = funnel.filter((stage) => stage.isLost).reduce((sum, stage) => sum + stage.leads, 0);
  const pipelineName = funnel[0]?.pipelineName;

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Barcha lidlar</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(total)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Sotuv bo&apos;ldi</p>
          <p className="mt-2 text-3xl font-semibold text-emerald-700">{formatNumber(won)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Yo&apos;qotildi / spam</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">
            {formatNumber(lost)} <span className="text-base font-medium">({formatPercent((lost / Math.max(total, 1)) * 100)})</span>
          </p>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <CardTitle>{pipelineName ? `Sotuv varonkasi: ${pipelineName}` : "Sotuv varonkasi"}</CardTitle>
          </CardHeader>
          <CardContent>
            <FunnelChart data={funnel} />
          </CardContent>
        </Card>
        <div>
          <FunnelStageTable data={funnel} />
        </div>
      </section>
    </div>
  );
}
