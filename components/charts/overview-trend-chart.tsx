"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartEmptyState } from "@/components/charts/chart-empty-state";
import type { TrendPoint } from "@/lib/types";
import { formatCurrency, formatNumber } from "@/lib/utils";

export function OverviewTrendChart({ data }: { data: TrendPoint[] }) {
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
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
          <defs>
            <linearGradient id="spendFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#2563eb" stopOpacity={0.22} />
              <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid className="chart-grid" vertical={false} />
          <XAxis
            dataKey="date"
            tickFormatter={(value: string) => value.slice(5)}
            tickLine={false}
            axisLine={false}
            fontSize={12}
          />
          <YAxis
            yAxisId="money"
            tickFormatter={(value: number) => `$${formatNumber(value)}`}
            tickLine={false}
            axisLine={false}
            width={64}
            fontSize={12}
          />
          <YAxis
            yAxisId="count"
            orientation="right"
            tickLine={false}
            axisLine={false}
            width={36}
            fontSize={12}
          />
          <Tooltip
            formatter={(value: number, name: string) => {
              const labels: Record<string, string> = {
                spend: "Xarajat",
                revenue: "Tushum",
                qualifiedLeads: "Sifatli lid",
                sales: "Sotuv"
              };

              return name === "spend" || name === "revenue"
                ? [formatCurrency(value), labels[name] ?? name]
                : [formatNumber(value), labels[name] ?? name];
            }}
            labelFormatter={(label) => `Sana: ${label}`}
          />
          <Legend />
          <Area
            yAxisId="money"
            type="monotone"
            dataKey="spend"
            name="Xarajat"
            stroke="#2563eb"
            fill="url(#spendFill)"
            strokeWidth={2}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="qualifiedLeads"
            name="Sifatli lid"
            stroke="#059669"
            strokeWidth={2}
            dot={false}
          />
          <Line
            yAxisId="count"
            type="monotone"
            dataKey="sales"
            name="Sotuv"
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
