"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import type { FunnelStage } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function FunnelChart({ data }: { data: FunnelStage[] }) {
  if (!data.length) {
    return (
      <div className="h-[360px] w-full">
        <ChartEmptyState />
      </div>
    );
  }

  return (
    <div className="h-[360px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ left: 18, right: 12, top: 8, bottom: 8 }}>
          <CartesianGrid className="chart-grid" horizontal={false} />
          <XAxis type="number" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis
            type="category"
            dataKey="name"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            width={110}
          />
          <Tooltip formatter={(value: number) => [formatNumber(value), "Lid"]} />
          <Bar dataKey="leads" name="Lid" fill="#059669" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
