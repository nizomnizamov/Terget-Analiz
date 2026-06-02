import { AlertsList } from "@/components/alerts-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getGeneratedAlerts } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { getPageAccountId, getPageRange, type PageSearchParams } from "@/lib/page-range";
import { formatNumber } from "@/lib/utils";

export default async function AlertsPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const range = await getPageRange(searchParams);
  const accountId = await getPageAccountId(searchParams);
  const user = await getCurrentUser();
  const alerts = getGeneratedAlerts(range, user, { facebookAccountId: accountId });
  const critical = alerts.filter((alert) => alert.severity === "critical").length;
  const unsent = alerts.filter((alert) => !alert.isSent).length;

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Ogohlantirishlar</p>
          <p className="mt-2 text-3xl font-semibold">{formatNumber(alerts.length)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Muhim</p>
          <p className="mt-2 text-3xl font-semibold text-red-700">{formatNumber(critical)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm font-medium text-muted-foreground">Telegram navbati</p>
          <p className="mt-2 text-3xl font-semibold text-amber-700">{formatNumber(unsent)}</p>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Ogohlantirishlar</CardTitle>
        </CardHeader>
        <CardContent>
          <AlertsList alerts={alerts} />
        </CardContent>
      </Card>
    </div>
  );
}
