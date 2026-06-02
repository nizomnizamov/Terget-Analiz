import { QualityChart } from "@/components/charts/quality-chart";
import { LeadQualityTable } from "@/components/lead-quality-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeadQualityAnalytics } from "@/lib/analytics";
import { getCurrentUser } from "@/lib/auth";
import { getPageAccountId, getPageRange, type PageSearchParams } from "@/lib/page-range";

const scoring = [
  ["0", "Spam / noto'g'ri raqam"],
  ["1", "Javob bermadi"],
  ["2", "Javob berdi"],
  ["3", "Sayohatga qiziqdi"],
  ["4", "Maslahat berildi"],
  ["5", "Bron qildi"],
  ["6", "To'lov qilindi"]
];

export default async function LeadQualityPage({ searchParams }: { searchParams?: PageSearchParams }) {
  const range = await getPageRange(searchParams);
  const accountId = await getPageAccountId(searchParams);
  const user = await getCurrentUser();
  const quality = getLeadQualityAnalytics(range, user, { facebookAccountId: accountId });

  return (
    <div className="grid gap-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Reklama bo&apos;yicha lid sifati</CardTitle>
          </CardHeader>
          <CardContent>
            <QualityChart data={quality} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Sifat ballari</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {scoring.map(([score, label]) => (
                <div key={score} className="flex items-center gap-3 rounded-md border bg-card px-3 py-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-sm font-semibold text-background">
                    {score}
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Lid sifati jadvali</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadQualityTable data={quality} />
        </CardContent>
      </Card>
    </div>
  );
}
