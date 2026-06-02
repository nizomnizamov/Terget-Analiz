"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import type { TrendPoint } from "@/lib/types";
import { formatNumber } from "@/lib/utils";

export function RoasTrendChart({ data }: { data: TrendPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-[260px] w-full">
        <ChartEmptyState />
      </div>
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 8, top: 10, bottom: 0 }}>
          <CartesianGrid className="chart-grid" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => value.slice(5)}
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            tickFormatter={(value: number) => `${formatNumber(value)}x`}
            tickLine={false}
            axisLine={false}
            width={42}
            fontSize={12}
            domain={[0, "dataMax + 1"]}
          />
          <Tooltip
            formatter={(value: number) => [`${formatNumber(value)}x`, "Reklama qaytimi"]}
            labelFormatter={(label) => `Sana: ${label}`}
          />
          <Line
            type="monotone"
            dataKey="roas"
            name="Reklama qaytimi"
            stroke="#111827"
            strokeWidth={2.5}
            dot={{ r: 4, strokeWidth: 2, fill: "#ffffff" }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
