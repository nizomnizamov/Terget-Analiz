import type { FunnelStage } from "@/lib/types";
import { formatNumber, formatPercent } from "@/lib/utils";

export function FunnelStageTable({ data }: { data: FunnelStage[] }) {
  return (
    <div className="grid gap-3">
      {data.map((stage) => (
        <div key={stage.name} className="rounded-md border bg-card p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{stage.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Ulush {formatPercent(stage.share)} / O&apos;rtacha {formatNumber(stage.averageStayHours)} soat
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-semibold">{formatNumber(stage.leads)}</div>
              <div className="text-xs text-muted-foreground">lid</div>
            </div>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded bg-muted">
            <div className="h-full rounded bg-primary" style={{ width: `${Math.min(stage.share, 100)}%` }} />
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Keyingi bosqich: {formatPercent(stage.nextConversion)}</span>
            <span>Yo&apos;qotildi: {formatNumber(stage.lostLeads)}</span>
            {stage.lostReason ? <span>Sabab: {stage.lostReason}</span> : null}
          </div>
        </div>
      ))}
    </div>
  );
}
