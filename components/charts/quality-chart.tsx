"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import type { LeadQualityCampaign } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function QualityChart({ data }: { data: LeadQualityCampaign[] }) {
  if (!data.length) {
    return (
      <div className="h-[320px] w-full">
        <ChartEmptyState />
      </div>
    );
  }

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 42 }}>
          <CartesianGrid className="chart-grid" vertical={false} />
          <XAxis
            dataKey="campaignName"
            tickLine={false}
            axisLine={false}
            fontSize={12}
            angle={-18}
            textAnchor="end"
            height={70}
          />
          <YAxis tickLine={false} axisLine={false} fontSize={12} />
          <Tooltip formatter={(value: number) => [formatNumber(value), "O'rtacha ball"]} />
          <Bar dataKey="averageScore" name="O'rtacha ball" fill="#2563eb" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
