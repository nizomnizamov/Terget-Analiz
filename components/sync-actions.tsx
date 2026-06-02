"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Download, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncActions() {
  const searchParams = useSearchParams();
  const range = searchParams.get("range") ?? "today";
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const query = useMemo(() => {
    const params = new URLSearchParams();
    params.set("range", range);

    const accountId = searchParams.get("accountId");

    if (accountId) {
      params.set("accountId", accountId);
    }

    if (range === "custom") {
      const from = searchParams.get("from");
      const to = searchParams.get("to");

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }
    }

    return `?${params.toString()}`;
  }, [range, searchParams]);

  async function fetchWithTimeout(url: string, init?: RequestInit) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);

    try {
      const response = await fetch(url, { ...init, signal: controller.signal });

      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "So'rov bajarilmadi.");
      }

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function syncAll() {
    setLoading(true);
    setStatus(null);

    try {
      await Promise.all([
        fetchWithTimeout(`/api/integrations/facebook/sync${query}`, { method: "POST" }),
        fetchWithTimeout(`/api/integrations/amo/sync${query}`, { method: "POST" }),
        fetchWithTimeout(`/api/alerts/check${query}`, { method: "POST" })
      ]);
      setStatus({ message: "Yangilandi", type: "success" });
    } catch {
      setStatus({ message: "Xato yuz berdi", type: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function exportOverview() {
    try {
      const response = await fetchWithTimeout(`/api/dashboard/overview${query}`);
      const data = await response.json();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `targel-overview-${range}-${searchParams.get("from") ?? ""}-${searchParams.get("to") ?? ""}.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setStatus({ message: "Yuklandi", type: "success" });
    } catch {
      setStatus({ message: "Yuklab bo'lmadi", type: "error" });
    }
  }

  return (
    <div className="flex items-center gap-2">
      {status ? (
        <span
          className={
            status.type === "success"
              ? "hidden text-xs font-medium text-emerald-700 sm:inline dark:text-emerald-300"
              : "hidden text-xs font-medium text-red-700 sm:inline dark:text-red-300"
          }
        >
          {status.message}
        </span>
      ) : null}
      <Button size="icon" variant="outline" onClick={syncAll} disabled={loading} title="Yangilash">
        <RefreshCcw className={loading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
      </Button>
      <Button size="icon" variant="outline" onClick={exportOverview} title="Yuklab olish">
        <Download className="h-4 w-4" />
      </Button>
    </div>
  );
}
