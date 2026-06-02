import { OperatorTable } from "@/components/operator-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getManagerAnalytics } from "@/lib/analytics";
import { getPageAccountId, getPageRange, type PageSearchParams } from "@/lib/page-range";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

export default async function OperatorsPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const range = await getPageRange(searchParams);
  const accountId = await getPageAccountId(searchParams);
  const managers = getManagerAnalytics(range, { facebookAccountId: accountId });
  const top = managers[0];

  return (
    <div className="grid gap-6">
      <section className="grid gap-3 md:grid-cols-3">
        {managers.map((manager) => (
          <Card key={manager.managerId} className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{manager.managerName}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {formatNumber(manager.leads)} lid / {formatNumber(manager.wonDeals)} sotuv
                </p>
              </div>
              <span className="rounded bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                {formatCurrency(manager.revenue)}
              </span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Bog&apos;lanish</p>
                <p className="font-semibold">{formatPercent(manager.contactRate)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Sifatli lid</p>
                <p className="font-semibold">{formatPercent(manager.qualifiedLeadRate)}</p>
              </div>
            </div>
          </Card>
        ))}
      </section>

      {top ? (
        <Card className="border-emerald-200 bg-emerald-50 dark:border-emerald-900/70 dark:bg-emerald-950/30">
          <CardContent className="p-4">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              {top.managerName} eng ko&apos;p tushum qildi: {formatCurrency(top.revenue)}.
            </p>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Operatorlar natijasi</CardTitle>
        </CardHeader>
        <CardContent>
          <OperatorTable data={managers} />
        </CardContent>
      </Card>
    </div>
  );
}
