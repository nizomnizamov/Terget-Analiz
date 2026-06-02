"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable
} from "@tanstack/react-table";
import { useState } from "react";
import { ArrowUpDown } from "lucide-react";
import { HealthBadge } from "@/components/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CampaignPerformance } from "@/lib/types";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

const columns: ColumnDef<CampaignPerformance>[] = [
  {
    accessorKey: "campaignName",
    header: "Reklama",
    cell: ({ row }) => (
      <div className="min-w-52">
        <div className="font-medium">{row.original.campaignName}</div>
        <div className="mt-1 text-xs text-muted-foreground">{row.original.recommendation}</div>
      </div>
    )
  },
  {
    accessorKey: "spend",
    header: "Xarajat",
    cell: ({ row }) => formatCurrency(row.original.spend)
  },
  {
    accessorKey: "impressions",
    header: "Ko'rishlar",
    cell: ({ row }) => formatNumber(row.original.impressions)
  },
  {
    accessorKey: "reach",
    header: "Qamrov",
    cell: ({ row }) => formatNumber(row.original.reach)
  },
  {
    accessorKey: "clicks",
    header: "Bosishlar",
    cell: ({ row }) => formatNumber(row.original.clicks)
  },
  {
    accessorKey: "ctr",
    header: "Bosish ulushi",
    cell: ({ row }) => formatPercent(row.original.ctr)
  },
  {
    accessorKey: "cpc",
    header: "1 bosish narxi",
    cell: ({ row }) => formatCurrency(row.original.cpc)
  },
  {
    accessorKey: "cpm",
    header: "1000 ko'rish narxi",
    cell: ({ row }) => formatCurrency(row.original.cpm)
  },
  {
    accessorKey: "leads",
    header: "Lidlar",
    cell: ({ row }) => formatNumber(row.original.leads)
  },
  {
    accessorKey: "cpl",
    header: "1 lid narxi",
    cell: ({ row }) => formatCurrency(row.original.cpl)
  },
  {
    accessorKey: "qualifiedLeads",
    header: "Sifatli lid",
    cell: ({ row }) => formatNumber(row.original.qualifiedLeads)
  },
  {
    accessorKey: "sales",
    header: "Sotuv",
    cell: ({ row }) => formatNumber(row.original.sales)
  },
  {
    accessorKey: "cpa",
    header: "Sotuv narxi",
    cell: ({ row }) => formatCurrency(row.original.cpa)
  },
  {
    accessorKey: "revenue",
    header: "Tushum",
    cell: ({ row }) => formatCurrency(row.original.revenue)
  },
  {
    accessorKey: "roas",
    header: "Reklama qaytimi",
    cell: ({ row }) => `${formatNumber(row.original.roas)}x`
  },
  {
    accessorKey: "health",
    header: "Holat",
    cell: ({ row }) => <HealthBadge health={row.original.health} />
  }
];

export function CampaignPerformanceTable({ data }: { data: CampaignPerformance[] }) {
  const [sorting, setSorting] = useState<SortingState>([{ id: "revenue", desc: true }]);
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel()
  });

  return (
    <div className="overflow-x-auto">
      <Table className="min-w-[1360px]">
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  <button
                    type="button"
                    className="inline-flex items-center gap-1 text-left"
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    <ArrowUpDown className="h-3 w-3" />
                  </button>
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.map((row) => (
            <TableRow key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <TableCell key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
