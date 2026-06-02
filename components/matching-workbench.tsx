"use client";

import { useMemo, useState } from "react";
import { Check, Link2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AmoLead, CampaignPerformance } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent, formatSourceName, formatStageName } from "@/lib/utils";

type CampaignOption = Pick<
  CampaignPerformance,
  "id" | "campaignName" | "health" | "leads" | "sales" | "cpl" | "roas"
>;

type MatchingWorkbenchProps = {
  leads: AmoLead[];
  campaigns: CampaignOption[];
};

type RunResult = {
  matched: number;
  unmatched: number;
  priority: string[];
};

export function MatchingWorkbench({ leads, campaigns }: MatchingWorkbenchProps) {
  const [queue, setQueue] = useState(leads);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [loadingLeadId, setLoadingLeadId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [runResult, setRunResult] = useState<RunResult | null>(null);

  const defaultCampaignId = campaigns[0]?.id ?? "";
  const campaignById = useMemo(
    () => new Map(campaigns.map((campaign) => [campaign.id, campaign])),
    [campaigns]
  );

  async function runMatching() {
    setRunning(true);
    setMessage(null);

    try {
      const response = await fetch("/api/matching/run", { method: "POST" });
      const data = (await response.json()) as RunResult;
      setRunResult(data);
      setMessage(`${formatNumber(data.matched)} ta bog'landi, ${formatNumber(data.unmatched)} ta qoldi.`);
    } finally {
      setRunning(false);
    }
  }

  async function matchLead(lead: AmoLead) {
    const campaignId = selected[lead.id] ?? defaultCampaignId;
    const campaign = campaignById.get(campaignId);

    if (!campaign) {
      setMessage("Reklama tanlanmagan.");
      return;
    }

    setLoadingLeadId(lead.id);
    setMessage(null);

    try {
      const response = await fetch("/api/matching/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id, campaignId })
      });
      const data = await response.json();

      if (!data.ok) {
      setMessage(data.message ?? "Bog'lash amalga oshmadi.");
        return;
      }

      setQueue((current) => current.filter((item) => item.id !== lead.id));
      setMessage(`${lead.contactName} -> ${campaign.campaignName}`);
    } finally {
      setLoadingLeadId(null);
    }
  }

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="grid gap-1">
          <p className="text-sm font-semibold">Qo&apos;lda bog&apos;lash navbati</p>
          <p className="text-xs text-muted-foreground">
            {formatNumber(queue.length)} bog&apos;lanmagan lid / {formatNumber(campaigns.length)} reklama
          </p>
        </div>
        <div className="flex items-center gap-2">
          {message ? <span className="hidden text-xs font-medium text-emerald-700 md:inline">{message}</span> : null}
          <Button variant="outline" onClick={runMatching} disabled={running}>
            <RefreshCcw className={running ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            Avtomatik
          </Button>
        </div>
      </div>

      {runResult ? (
        <div className="grid gap-2 rounded-md border bg-muted/40 p-3 text-sm sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Bog&apos;landi</p>
            <p className="font-semibold">{formatNumber(runResult.matched)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Qoldi</p>
            <p className="font-semibold">{formatNumber(runResult.unmatched)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Ustuvorlik</p>
            <p className="truncate font-semibold">{runResult.priority.join(" -> ")}</p>
          </div>
        </div>
      ) : null}

      <div className="overflow-x-auto">
        <div className="min-w-[1040px] overflow-hidden rounded-md border">
          <div className="grid grid-cols-[1.25fr_1fr_0.85fr_1.35fr_120px] gap-3 border-b bg-muted px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">
            <span>Lid</span>
            <span>Manba</span>
            <span>Holat</span>
            <span>Reklama</span>
            <span className="text-right">Amal</span>
          </div>
          {queue.map((lead) => {
            const selectedCampaign = selected[lead.id] ?? defaultCampaignId;
            const campaign = campaignById.get(selectedCampaign);

            return (
              <div
                key={lead.id}
                className="grid grid-cols-[1.25fr_1fr_0.85fr_1.35fr_120px] items-center gap-3 border-b bg-card px-3 py-3 text-sm last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{lead.contactName}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {lead.phone} / {new Date(lead.createdAtAmo).toLocaleDateString("uz-UZ")}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="truncate font-medium">{formatSourceName(lead.source)}</p>
                  <p className="mt-1 truncate text-xs text-muted-foreground">
                    {lead.utmCampaign ?? "UTM yo'q"} / {lead.utmContent ?? "reklama matni yo'q"}
                  </p>
                </div>
                <div>
                  <p className="font-medium">{formatStageName(lead.statusName)}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatCurrency(lead.price)}</p>
                </div>
                <div className="grid gap-1">
                  <select
                    value={selectedCampaign}
                    onChange={(event) =>
                      setSelected((current) => ({ ...current, [lead.id]: event.target.value }))
                    }
                    className="h-9 rounded-md border bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
                    aria-label={`${lead.contactName} reklamasi`}
                  >
                    {campaigns.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.campaignName}
                      </option>
                    ))}
                  </select>
                  {campaign ? (
                    <p className="truncate text-xs text-muted-foreground">
                      Lid narxi {formatCurrency(campaign.cpl)} / Qaytim {formatNumber(campaign.roas)}x / Sotuvga aylanish{" "}
                      {formatPercent((campaign.sales / Math.max(campaign.leads, 1)) * 100)}
                    </p>
                  ) : null}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => matchLead(lead)}
                    disabled={loadingLeadId === lead.id || !campaign}
                  >
                    {loadingLeadId === lead.id ? (
                      <RefreshCcw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Bog&apos;lash
                  </Button>
                </div>
              </div>
            );
          })}
          {queue.length === 0 ? (
            <div className="flex items-center gap-3 bg-card px-3 py-8 text-sm text-muted-foreground">
              <Link2 className="h-4 w-4" />
              Barcha lidlar bog&apos;langan.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
